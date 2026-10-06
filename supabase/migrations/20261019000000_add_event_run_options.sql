create table public.flock_event_run_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.flock_events(id) on delete cascade,
  distance_label text not null check (char_length(btrim(distance_label)) between 1 and 40),
  pace_label text not null check (char_length(btrim(pace_label)) between 1 and 60),
  position smallint not null check (position between 0 and 7),
  created_at timestamptz not null default now(),
  unique (event_id, position) deferrable initially deferred
);

alter table public.flock_event_run_options enable row level security;

revoke all on table public.flock_event_run_options from anon, authenticated;
grant select on table public.flock_event_run_options to authenticated;

create policy "Authorized users can read event run options"
on public.flock_event_run_options for select to authenticated
using (
  exists (
    select 1
    from public.flock_events as event
    where event.id = event_id
      and (
        (select private.is_superadmin())
        or event.created_by = (select auth.uid())
        or event.flock_id in (select private.user_flock_ids())
        or event.id in (select private.user_event_invitation_ids())
      )
  )
);

alter table public.flock_event_attendance
add column run_option_id uuid references public.flock_event_run_options(id) on delete set null;

create index flock_event_attendance_run_option_id_idx
on public.flock_event_attendance(run_option_id);

drop function public.set_flock_event_response(uuid, public.flock_event_response);

create function public.set_flock_event_response(
  target_event_id uuid,
  next_response public.flock_event_response,
  target_run_option_id uuid
)
returns public.flock_event_attendance
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  event_has_options boolean;
begin
  if not exists (
    select 1
    from public.flock_events as event
    where event.id = target_event_id
      and (
        (select private.is_superadmin())
        or event.created_by = (select auth.uid())
        or event.flock_id in (select private.user_flock_ids())
        or event.id in (select private.user_event_invitation_ids())
      )
  ) then
    raise insufficient_privilege using message = 'Event access is required.';
  end if;

  select exists (
    select 1
    from public.flock_event_run_options as option
    where option.event_id = target_event_id
  ) into event_has_options;

  if next_response in ('in', 'maybe') and event_has_options then
    if target_run_option_id is null or not exists (
      select 1
      from public.flock_event_run_options as option
      where option.id = target_run_option_id
        and option.event_id = target_event_id
    ) then
      raise check_violation using message = 'Choose a run option for this response.';
    end if;
  elsif target_run_option_id is not null then
    raise check_violation using message = 'This response cannot use that run option.';
  end if;

  insert into public.flock_event_attendance (
    event_id,
    user_id,
    response,
    run_option_id,
    updated_at
  )
  values (
    target_event_id,
    (select auth.uid()),
    next_response,
    case when next_response = 'out' then null else target_run_option_id end,
    clock_timestamp()
  )
  on conflict on constraint flock_event_attendance_pkey do update
    set response = excluded.response,
      run_option_id = excluded.run_option_id,
      updated_at = excluded.updated_at;

  return (
    select attendance
    from public.flock_event_attendance as attendance
    where attendance.event_id = target_event_id
      and attendance.user_id = (select auth.uid())
  );
end;
$$;

revoke execute on function public.set_flock_event_response(uuid, public.flock_event_response, uuid) from public;
grant execute on function public.set_flock_event_response(uuid, public.flock_event_response, uuid) to authenticated;

drop function public.create_flock_event(uuid, text, timestamptz, text, text);

create function public.create_flock_event(
  target_flock_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb
)
returns table (id uuid, flock_id uuid, created_by uuid, title text, starts_at timestamptz, location text, description text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  created_event public.flock_events;
begin
  if not exists (
    select 1 from public.flocks as flock
    where flock.id = target_flock_id
      and ((select private.is_superadmin()) or flock.owner_id = actor_user_id)
  ) then
    raise insufficient_privilege using message = 'Flock ownership is required.';
  end if;

  if jsonb_typeof(event_run_options) <> 'array'
    or jsonb_array_length(event_run_options) not between 1 and 8
    or exists (
      select 1
      from jsonb_array_elements(event_run_options) as option
      where jsonb_typeof(option) <> 'object'
        or char_length(btrim(option ->> 'distanceLabel')) not between 1 and 40
        or char_length(btrim(option ->> 'paceLabel')) not between 1 and 60
    )
  then
    raise check_violation using message = 'Provide between one and eight complete run options.';
  end if;

  insert into public.flock_events (flock_id, created_by, title, starts_at, location, description)
  values (target_flock_id, actor_user_id, btrim(event_title), event_starts_at, btrim(event_location), btrim(event_description))
  returning * into created_event;

  insert into public.flock_event_run_options (event_id, distance_label, pace_label, position)
  select
    created_event.id,
    btrim(option.value ->> 'distanceLabel'),
    btrim(option.value ->> 'paceLabel'),
    option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as option(value, ordinality);

  perform private.enqueue_flock_event_notification(created_event.id, 'created', actor_user_id);

  return query select created_event.id, created_event.flock_id, created_event.created_by,
    created_event.title, created_event.starts_at, created_event.location,
    created_event.description, created_event.created_at;
end;
$$;

revoke execute on function public.create_flock_event(uuid, text, timestamptz, text, text, jsonb) from public;
grant execute on function public.create_flock_event(uuid, text, timestamptz, text, text, jsonb) to authenticated;

create function public.update_flock_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb
)
returns public.flock_events
language plpgsql security definer set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  previous_event public.flock_events;
  updated_event public.flock_events;
  options_changed boolean;
begin
  select event.*
  into previous_event
  from public.flock_events as event
  left join public.flocks as flock on flock.id = event.flock_id
  where event.id = target_event_id
    and event.flock_id is not null
    and ((select private.is_superadmin()) or event.created_by = actor_user_id or flock.owner_id = actor_user_id)
  for update of event;

  if previous_event.id is null then
    raise insufficient_privilege using message = 'Flock event ownership is required.';
  end if;

  if jsonb_typeof(event_run_options) <> 'array'
    or jsonb_array_length(event_run_options) not between 1 and 8
    or exists (
      select 1
      from jsonb_array_elements(event_run_options) as option
      where jsonb_typeof(option) <> 'object'
        or char_length(btrim(option ->> 'distanceLabel')) not between 1 and 40
        or char_length(btrim(option ->> 'paceLabel')) not between 1 and 60
        or (
          option ? 'id'
          and option ->> 'id' is not null
          and not exists (
            select 1
            from public.flock_event_run_options as existing_option
            where existing_option.id = (option ->> 'id')::uuid
              and existing_option.event_id = target_event_id
          )
        )
    )
  then
    raise check_violation using message = 'Provide between one and eight valid run options.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', option.id,
        'distanceLabel', option.distance_label,
        'paceLabel', option.pace_label
      ) order by option.position
    ),
    '[]'::jsonb
  ) is distinct from event_run_options
  into options_changed
  from public.flock_event_run_options as option
  where option.event_id = target_event_id;

  update public.flock_events
  set
    title = btrim(event_title),
    starts_at = event_starts_at,
    location = btrim(event_location),
    description = btrim(event_description)
  where id = target_event_id
  returning * into updated_event;

  delete from public.flock_event_run_options as existing_option
  where existing_option.event_id = target_event_id
    and not exists (
      select 1
      from jsonb_array_elements(event_run_options) as supplied_option
      where supplied_option ->> 'id' = existing_option.id::text
    );

  update public.flock_event_run_options as existing_option
  set
    distance_label = btrim(supplied_option.value ->> 'distanceLabel'),
    pace_label = btrim(supplied_option.value ->> 'paceLabel'),
    position = supplied_option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as supplied_option(value, ordinality)
  where existing_option.id = (supplied_option.value ->> 'id')::uuid
    and existing_option.event_id = target_event_id;

  insert into public.flock_event_run_options (event_id, distance_label, pace_label, position)
  select
    target_event_id,
    btrim(option.value ->> 'distanceLabel'),
    btrim(option.value ->> 'paceLabel'),
    option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as option(value, ordinality)
  where option.value ->> 'id' is null;

  if previous_event.title is distinct from updated_event.title
    or previous_event.starts_at is distinct from updated_event.starts_at
    or previous_event.location is distinct from updated_event.location
    or previous_event.description is distinct from updated_event.description
    or options_changed
  then
    perform private.enqueue_flock_event_notification(updated_event.id, 'updated', actor_user_id);
  end if;

  return updated_event;
end;
$$;

revoke execute on function public.update_flock_event(uuid, text, timestamptz, text, text, jsonb) from public;
grant execute on function public.update_flock_event(uuid, text, timestamptz, text, text, jsonb) to authenticated;
