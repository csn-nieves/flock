alter table public.flock_event_run_options
drop constraint flock_event_run_options_structured_values_check;

alter table public.flock_event_run_options
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
    and pace_unit = distance_unit
    and distance_tenths between 1 and 1000
    and distance_unit in ('mi', 'km')
    and (
      pace_seconds is null
      or (pace_unit = 'mi' and pace_seconds between 240 and 900)
      or (pace_unit = 'km' and pace_seconds between 150 and 570)
    )
  )
);

create or replace function private.valid_event_run_options(event_run_options jsonb)
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
        or (
          option ? 'paceSeconds'
          and jsonb_typeof(option -> 'paceSeconds') <> 'null'
          and (
            jsonb_typeof(option -> 'paceSeconds') <> 'number'
            or not case
              when jsonb_typeof(option -> 'paceSeconds') = 'number'
              then mod((option ->> 'paceSeconds')::numeric, 1) = 0
                and (
                  (option ->> 'unit' = 'mi' and (option ->> 'paceSeconds')::numeric between 240 and 900)
                  or (option ->> 'unit' = 'km' and (option ->> 'paceSeconds')::numeric between 150 and 570)
                )
              else false
            end
          )
        )
        or ((option ? 'routeCoordinates') <> (option ? 'routeDistanceMeters'))
        or (
          option ? 'routeCoordinates'
          and (
            not private.valid_route_coordinates(option -> 'routeCoordinates')
            or jsonb_typeof(option -> 'routeDistanceMeters') <> 'number'
            or not case
              when jsonb_typeof(option -> 'routeDistanceMeters') = 'number'
              then mod((option ->> 'routeDistanceMeters')::numeric, 1) = 0
                and (option ->> 'routeDistanceMeters')::numeric between 1 and 1000000
              else false
            end
          )
        )
    );
exception
  when others then
    return false;
end;
$$;

create or replace function private.event_pace_label(pace_seconds integer, pace_unit text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when pace_seconds is null then 'Run at your own pace'
    else (pace_seconds / 60)::text || ':' || lpad(mod(pace_seconds, 60)::text, 2, '0') || '/' || pace_unit
  end;
$$;
