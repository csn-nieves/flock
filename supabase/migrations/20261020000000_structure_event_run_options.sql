alter table public.flock_event_run_options
add column distance_tenths smallint,
add column distance_unit text,
add column pace_seconds smallint,
add column pace_unit text,
add constraint flock_event_run_options_structured_values_check check (
  (
    distance_tenths is null
    and distance_unit is null
    and pace_seconds is null
    and pace_unit is null
  )
  or (
    distance_tenths is not null
    and distance_unit is not null
    and pace_seconds is not null
    and pace_unit is not null
    and distance_tenths between 1 and 1000
    and distance_unit in ('mi', 'km')
    and pace_unit = distance_unit
    and (
      (pace_unit = 'mi' and pace_seconds between 240 and 900)
      or (pace_unit = 'km' and pace_seconds between 150 and 570)
    )
  )
);

create function private.valid_event_run_options(event_run_options jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(event_run_options) <> 'array' then
    return false;
  end if;

  return jsonb_array_length(event_run_options) between 1 and 8
    and not exists (
      select 1
      from jsonb_array_elements(event_run_options) as option
      where jsonb_typeof(option) <> 'object'
        or jsonb_typeof(option -> 'distanceTenths') <> 'number'
        or not case
          when jsonb_typeof(option -> 'distanceTenths') = 'number'
          then (option ->> 'distanceTenths')::numeric between 1 and 1000
            and mod((option ->> 'distanceTenths')::numeric, 1) = 0
          else false
        end
        or option ->> 'unit' not in ('mi', 'km')
        or jsonb_typeof(option -> 'paceSeconds') <> 'number'
        or not case
          when jsonb_typeof(option -> 'paceSeconds') = 'number'
          then mod((option ->> 'paceSeconds')::numeric, 1) = 0
            and (
              (option ->> 'unit' = 'mi' and (option ->> 'paceSeconds')::numeric between 240 and 900)
              or (option ->> 'unit' = 'km' and (option ->> 'paceSeconds')::numeric between 150 and 570)
            )
          else false
        end
    );
end;
$$;

create function private.event_distance_label(distance_tenths integer, distance_unit text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when mod(distance_tenths, 10) = 0 then (distance_tenths / 10)::text
    else (distance_tenths / 10)::text || '.' || mod(distance_tenths, 10)::text
  end || ' ' || distance_unit;
$$;

create function private.event_pace_label(pace_seconds integer, pace_unit text)
returns text
language sql
immutable
set search_path = ''
as $$
  select (pace_seconds / 60)::text || ':' || lpad(mod(pace_seconds, 60)::text, 2, '0') || '/' || pace_unit;
$$;

revoke all on function private.valid_event_run_options(jsonb) from public;
revoke all on function private.event_distance_label(integer, text) from public;
revoke all on function private.event_pace_label(integer, text) from public;

create or replace function public.create_flock_event(
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

  if not private.valid_event_run_options(event_run_options) then
    raise check_violation using message = 'Provide between one and eight valid run options.';
  end if;

  insert into public.flock_events (flock_id, created_by, title, starts_at, location, description)
  values (target_flock_id, actor_user_id, btrim(event_title), event_starts_at, btrim(event_location), btrim(event_description))
  returning * into created_event;

  insert into public.flock_event_run_options (
    event_id,
    distance_label,
    distance_tenths,
    distance_unit,
    pace_label,
    pace_seconds,
    pace_unit,
    position
  )
  select
    created_event.id,
    private.event_distance_label((option.value ->> 'distanceTenths')::integer, option.value ->> 'unit'),
    (option.value ->> 'distanceTenths')::smallint,
    option.value ->> 'unit',
    private.event_pace_label((option.value ->> 'paceSeconds')::integer, option.value ->> 'unit'),
    (option.value ->> 'paceSeconds')::smallint,
    option.value ->> 'unit',
    option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as option(value, ordinality);

  perform private.enqueue_flock_event_notification(created_event.id, 'created', actor_user_id);

  return query select created_event.id, created_event.flock_id, created_event.created_by,
    created_event.title, created_event.starts_at, created_event.location,
    created_event.description, created_event.created_at;
end;
$$;

drop function public.create_user_event(text, timestamptz, text, text);

create function public.create_user_event(
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb
)
returns public.flock_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  created_event public.flock_events;
begin
  if actor_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if not private.valid_event_run_options(event_run_options) then
    raise check_violation using message = 'Provide between one and eight valid run options.';
  end if;

  insert into public.flock_events (
    flock_id,
    created_by,
    title,
    starts_at,
    location,
    description
  )
  values (
    null,
    actor_user_id,
    btrim(event_title),
    event_starts_at,
    btrim(event_location),
    btrim(event_description)
  )
  returning * into created_event;

  insert into public.flock_event_run_options (
    event_id,
    distance_label,
    distance_tenths,
    distance_unit,
    pace_label,
    pace_seconds,
    pace_unit,
    position
  )
  select
    created_event.id,
    private.event_distance_label((option.value ->> 'distanceTenths')::integer, option.value ->> 'unit'),
    (option.value ->> 'distanceTenths')::smallint,
    option.value ->> 'unit',
    private.event_pace_label((option.value ->> 'paceSeconds')::integer, option.value ->> 'unit'),
    (option.value ->> 'paceSeconds')::smallint,
    option.value ->> 'unit',
    option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as option(value, ordinality);

  return created_event;
end;
$$;

revoke execute on function public.create_user_event(text, timestamptz, text, text, jsonb) from public;
grant execute on function public.create_user_event(text, timestamptz, text, text, jsonb) to authenticated;

drop function public.update_flock_event(uuid, text, timestamptz, text, text);

create or replace function public.update_flock_event(
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
    and ((select private.is_superadmin()) or event.created_by = actor_user_id or flock.owner_id = actor_user_id)
  for update of event;

  if previous_event.id is null then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;

  if not private.valid_event_run_options(event_run_options)
    or exists (
      select 1
      from jsonb_array_elements(event_run_options) as option
      where option ? 'id'
        and option ->> 'id' is not null
        and not exists (
          select 1
          from public.flock_event_run_options as existing_option
          where existing_option.id = (option ->> 'id')::uuid
            and existing_option.event_id = target_event_id
        )
    )
  then
    raise check_violation using message = 'Provide between one and eight valid run options.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', option.id,
        'distanceTenths', option.distance_tenths,
        'unit', option.distance_unit,
        'paceSeconds', option.pace_seconds
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
    distance_label = private.event_distance_label((supplied_option.value ->> 'distanceTenths')::integer, supplied_option.value ->> 'unit'),
    distance_tenths = (supplied_option.value ->> 'distanceTenths')::smallint,
    distance_unit = supplied_option.value ->> 'unit',
    pace_label = private.event_pace_label((supplied_option.value ->> 'paceSeconds')::integer, supplied_option.value ->> 'unit'),
    pace_seconds = (supplied_option.value ->> 'paceSeconds')::smallint,
    pace_unit = supplied_option.value ->> 'unit',
    position = supplied_option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as supplied_option(value, ordinality)
  where existing_option.id = (supplied_option.value ->> 'id')::uuid
    and existing_option.event_id = target_event_id;

  insert into public.flock_event_run_options (
    event_id,
    distance_label,
    distance_tenths,
    distance_unit,
    pace_label,
    pace_seconds,
    pace_unit,
    position
  )
  select
    target_event_id,
    private.event_distance_label((option.value ->> 'distanceTenths')::integer, option.value ->> 'unit'),
    (option.value ->> 'distanceTenths')::smallint,
    option.value ->> 'unit',
    private.event_pace_label((option.value ->> 'paceSeconds')::integer, option.value ->> 'unit'),
    (option.value ->> 'paceSeconds')::smallint,
    option.value ->> 'unit',
    option.ordinality - 1
  from jsonb_array_elements(event_run_options) with ordinality as option(value, ordinality)
  where option.value ->> 'id' is null;

  if updated_event.flock_id is not null and (
    previous_event.title is distinct from updated_event.title
    or previous_event.starts_at is distinct from updated_event.starts_at
    or previous_event.location is distinct from updated_event.location
    or previous_event.description is distinct from updated_event.description
    or options_changed
  ) then
    perform private.enqueue_flock_event_notification(updated_event.id, 'updated', actor_user_id);
  end if;

  return updated_event;
end;
$$;
