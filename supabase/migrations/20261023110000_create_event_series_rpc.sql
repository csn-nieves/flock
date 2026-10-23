create function public.create_event_series(
  target_flock_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb,
  event_time_zone text,
  event_frequency text,
  event_interval smallint,
  event_weekdays smallint[],
  event_monthly_mode text,
  event_day_of_month smallint,
  event_weekday smallint,
  event_week_of_month smallint,
  event_occurrence_limit smallint,
  event_until_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  series_id uuid;
  occurrence record;
  created_event public.flock_events;
  generation_limit smallint := coalesce(event_occurrence_limit, 365);
begin
  if actor_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;
  if target_flock_id is not null and not exists (
    select 1 from public.flocks as flock
    where flock.id = target_flock_id and flock.owner_id = actor_user_id
  ) then
    raise insufficient_privilege using message = 'Flock ownership is required.';
  end if;
  if not private.valid_event_time_zone(event_time_zone) then
    raise check_violation using message = 'Choose a valid event time zone.';
  end if;
  if not private.valid_event_run_options(event_run_options) then
    raise check_violation using message = 'Provide between one and eight valid run options.';
  end if;

  insert into public.event_series (
    created_by, flock_id, frequency, interval_count, weekdays, monthly_mode,
    day_of_month, weekday, week_of_month, occurrence_limit, until_date
  )
  values (
    actor_user_id, target_flock_id, event_frequency, event_interval, event_weekdays,
    event_monthly_mode, event_day_of_month, event_weekday, event_week_of_month,
    event_occurrence_limit, event_until_date
  )
  returning id into series_id;

  for occurrence in
    select * from private.event_series_occurrence_starts(
      event_starts_at, event_time_zone, event_frequency, event_interval,
      event_weekdays, event_monthly_mode, event_day_of_month, event_weekday,
      event_week_of_month, generation_limit, event_until_date
    )
  loop
    insert into public.flock_events (
      flock_id, created_by, title, starts_at, location, description,
      time_zone, reminders_enabled, series_id, series_position
    )
    values (
      target_flock_id, actor_user_id, btrim(event_title), occurrence.starts_at,
      btrim(event_location), btrim(event_description), event_time_zone, true,
      series_id, occurrence.occurrence_position
    )
    returning * into created_event;

    insert into public.flock_event_run_options (
      event_id, distance_label, distance_tenths, distance_unit, pace_label,
      pace_seconds, pace_unit, position, route_coordinates, route_distance_meters
    )
    select
      created_event.id,
      private.event_distance_label((option.value ->> 'distanceTenths')::integer, option.value ->> 'unit'),
      (option.value ->> 'distanceTenths')::smallint,
      option.value ->> 'unit',
      private.event_pace_label((option.value ->> 'paceSeconds')::integer, option.value ->> 'unit'),
      (option.value ->> 'paceSeconds')::smallint,
      option.value ->> 'unit',
      option.ordinality - 1,
      option.value -> 'routeCoordinates',
      (option.value ->> 'routeDistanceMeters')::integer
    from jsonb_array_elements(event_run_options) with ordinality as option(value, ordinality);
  end loop;

  return series_id;
end;
$$;

revoke execute on function public.create_event_series(uuid, text, timestamptz, text, text, jsonb, text, text, smallint, smallint[], text, smallint, smallint, smallint, smallint, date) from public, anon;
grant execute on function public.create_event_series(uuid, text, timestamptz, text, text, jsonb, text, text, smallint, smallint[], text, smallint, smallint, smallint, smallint, date) to authenticated;
