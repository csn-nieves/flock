create function private.event_series_occurrence_starts(
  event_starts_at timestamptz,
  event_time_zone text,
  event_frequency text,
  event_interval smallint,
  event_weekdays smallint[],
  event_monthly_mode text,
  event_day_of_month smallint,
  event_weekday smallint,
  event_week_of_month smallint,
  max_occurrences smallint,
  event_until_date date
)
returns table (occurrence_position smallint, starts_at timestamptz)
language plpgsql
immutable
set search_path = ''
as $$
declare
  local_start timestamp := event_starts_at at time zone event_time_zone;
  local_date date := local_start::date;
  local_time time := local_start::time;
  candidate date;
  next_position smallint := 0;
  week_day smallint;
  month_day integer;
  day_offset integer;
  week_offset integer;
  month_offset integer;
begin
  if max_occurrences is null or max_occurrences < 1 or max_occurrences > 365 then
    raise check_violation using message = 'A recurrence must contain between 1 and 365 occurrences.';
  end if;

  if event_frequency = 'daily' then
    for day_offset in 0..(max_occurrences * event_interval - 1) loop
      candidate := local_date + day_offset;
      if day_offset % event_interval = 0 and (event_until_date is null or candidate <= event_until_date) then
        next_position := next_position + 1;
        occurrence_position := next_position;
        starts_at := make_timestamptz(
          extract(year from candidate)::integer,
          extract(month from candidate)::integer,
          extract(day from candidate)::integer,
          extract(hour from local_time),
          extract(minute from local_time),
          extract(second from local_time),
          event_time_zone
        );
        return next;
      end if;
    end loop;
  elsif event_frequency = 'weekly' then
    for week_offset in 0..(max_occurrences * event_interval * 7 - 1) loop
      candidate := local_date + week_offset;
      week_day := extract(dow from candidate)::smallint;
      if week_offset / 7 % event_interval = 0 and week_day = any(event_weekdays)
        and (event_until_date is null or candidate <= event_until_date) then
        next_position := next_position + 1;
        occurrence_position := next_position;
        starts_at := make_timestamptz(
          extract(year from candidate)::integer,
          extract(month from candidate)::integer,
          extract(day from candidate)::integer,
          extract(hour from local_time), extract(minute from local_time),
          extract(second from local_time), event_time_zone
        );
        return next;
      end if;
    end loop;
  else
    for month_offset in 0..(max_occurrences * event_interval * 2 - 1) loop
      candidate := (local_date + (month_offset * event_interval || ' months')::interval)::date;
      if event_monthly_mode = 'day-of-month' then
        if event_day_of_month > extract(day from (date_trunc('month', candidate) + interval '1 month - 1 day')) then
          continue;
        end if;
        candidate := make_date(extract(year from candidate)::integer, extract(month from candidate)::integer, event_day_of_month);
      else
        candidate := date_trunc('month', candidate)::date;
        candidate := candidate + ((event_weekday - extract(dow from candidate)::integer + 7) % 7) + ((event_week_of_month - 1) * 7);
        if extract(month from candidate) <> extract(month from date_trunc('month', local_date + (month_offset * event_interval || ' months')::interval)) then
          continue;
        end if;
      end if;
      if candidate >= local_date and (event_until_date is null or candidate <= event_until_date) then
        next_position := next_position + 1;
        occurrence_position := next_position;
        starts_at := make_timestamptz(extract(year from candidate)::integer, extract(month from candidate)::integer, extract(day from candidate)::integer, extract(hour from local_time), extract(minute from local_time), extract(second from local_time), event_time_zone);
        return next;
      end if;
    end loop;
  end if;
end;
$$;

revoke all on function private.event_series_occurrence_starts(timestamptz, text, text, smallint, smallint[], text, smallint, smallint, smallint, smallint, date) from public, anon, authenticated;
