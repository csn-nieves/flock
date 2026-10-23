create table public.event_series (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete restrict,
  flock_id uuid references public.flocks (id) on delete cascade,
  frequency text not null,
  interval_count smallint not null default 1,
  weekdays smallint[] not null default '{}',
  monthly_mode text,
  day_of_month smallint,
  weekday smallint,
  week_of_month smallint,
  occurrence_limit smallint,
  until_date date,
  created_at timestamptz not null default now(),
  constraint event_series_frequency_check check (frequency in ('daily', 'weekly', 'monthly')),
  constraint event_series_interval_check check (interval_count between 1 and 4),
  constraint event_series_limit_check check (
    (occurrence_limit is not null and until_date is null and occurrence_limit between 1 and 365)
    or (occurrence_limit is null and until_date is not null)
  ),
  constraint event_series_monthly_mode_check check (
    (frequency <> 'monthly' and monthly_mode is null)
    or (frequency = 'monthly' and monthly_mode in ('day-of-month', 'weekday-position'))
  ),
  constraint event_series_day_of_month_check check (
    monthly_mode <> 'day-of-month' or day_of_month between 1 and 31
  ),
  constraint event_series_week_position_check check (
    monthly_mode <> 'weekday-position'
    or (weekday between 0 and 6 and week_of_month between 1 and 5)
  ),
  constraint event_series_flock_or_personal_check check (flock_id is null or created_by is not null)
);

create index event_series_creator_idx on public.event_series (created_by, created_at desc);
create index event_series_flock_idx on public.event_series (flock_id, created_at desc);

alter table public.event_series enable row level security;
revoke all on table public.event_series from anon, authenticated;
grant select on table public.event_series to authenticated;

create policy "Authorized users can read event series"
on public.event_series for select to authenticated
using (
  created_by = (select auth.uid())
  or flock_id in (select private.user_flock_ids())
);

alter table public.flock_events
  add column series_id uuid references public.event_series (id) on delete set null,
  add column series_position smallint,
  add constraint flock_events_series_position_check check (
    (series_id is null and series_position is null)
    or (series_id is not null and series_position is not null and series_position between 1 and 365)
  );

create unique index flock_events_series_position_idx
on public.flock_events (series_id, series_position)
where series_id is not null;
