create table private.demo_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  initialized_at timestamptz not null default clock_timestamp()
);

revoke all on table private.demo_workspaces from public, anon, authenticated;

create or replace function public.initialize_demo_workspace()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  target_conversation_id uuid;
  source_event record;
  copied_event public.flock_events;
begin
  if actor_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise insufficient_privilege using message = 'The demo is available to anonymous sessions only.';
  end if;

  insert into private.demo_workspaces (user_id)
  values (actor_user_id)
  on conflict (user_id) do nothing;

  if not found then
    return;
  end if;

  update public.profiles
  set display_name = 'Demo Runner', updated_at = clock_timestamp()
  where user_id = actor_user_id;

  insert into public.flock_members (flock_id, user_id, role)
  select flock_id, actor_user_id, 'member'
  from unnest(array[
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid
  ]) as seeded_flocks(flock_id)
  on conflict (flock_id, user_id) do nothing;

  for source_event in
    select event.*
    from public.flock_events as event
    where event.flock_id is null
    order by event.starts_at, event.id
    limit 2
  loop
    insert into public.flock_events (
      flock_id, created_by, title, starts_at, location, description
    )
    values (
      null,
      actor_user_id,
      'Demo · ' || source_event.title,
      greatest(source_event.starts_at, clock_timestamp() + interval '45 days'),
      source_event.location,
      source_event.description
    )
    returning * into copied_event;

    insert into public.flock_event_run_options (
      event_id, distance_label, distance_tenths, distance_unit, pace_label,
      pace_seconds, pace_unit, position, route_coordinates,
      route_distance_meters
    )
    select
      copied_event.id,
      option.distance_label,
      option.distance_tenths,
      option.distance_unit,
      option.pace_label,
      option.pace_seconds,
      option.pace_unit,
      option.position,
      option.route_coordinates,
      option.route_distance_meters
    from public.flock_event_run_options as option
    where option.event_id = source_event.id;
  end loop;

  insert into public.direct_conversations (participant_one_id, participant_two_id)
  values (
    least(actor_user_id, '11111111-1111-4111-8111-111111111111'::uuid),
    greatest(actor_user_id, '11111111-1111-4111-8111-111111111111'::uuid)
  )
  on conflict (participant_one_id, participant_two_id) do update
  set participant_one_id = excluded.participant_one_id
  returning id into target_conversation_id;

  insert into public.direct_messages (id, conversation_id, sender_id, body, created_at)
  values
    (
      md5(actor_user_id::text || ':demo:1')::uuid,
      target_conversation_id,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Welcome to the Flock demo. I saved a route for our next easy run.',
      clock_timestamp() - interval '4 minutes'
    ),
    (
      md5(actor_user_id::text || ':demo:2')::uuid,
      target_conversation_id,
      actor_user_id,
      'Thanks! I am going to look through the flocks and upcoming events.',
      clock_timestamp() - interval '2 minutes'
    )
  on conflict (id) do nothing;
end;
$$;

revoke execute on function public.initialize_demo_workspace() from public, anon;
grant execute on function public.initialize_demo_workspace() to authenticated;

comment on function public.initialize_demo_workspace() is
  'Creates an idempotent workspace for an anonymous demo session.';
