begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select has_function(
  'private',
  'event_series_occurrence_starts',
  array['timestamptz', 'text', 'text', 'smallint', 'smallint[]', 'text', 'smallint', 'smallint', 'smallint', 'smallint', 'date'],
  'recurring events expose a private calendar materialization helper'
);

select is(
  (select count(*) from private.event_series_occurrence_starts(
    '2026-10-23 09:00:00-04'::timestamptz,
    'America/New_York', 'daily', 1::smallint, '{}'::smallint[], null::text, null::smallint, null::smallint, null::smallint, 3::smallint, null::date
  )),
  3::bigint,
  'daily rules generate the requested number of occurrences'
);

select is(
  (select array_agg(starts_at order by occurrence_position) from private.event_series_occurrence_starts(
    '2026-10-23 09:00:00-04'::timestamptz,
    'America/New_York', 'daily', 1::smallint, '{}'::smallint[], null::text, null::smallint, null::smallint, null::smallint, 3::smallint, null::date
  )),
  array['2026-10-23 13:00:00+00'::timestamptz, '2026-10-24 13:00:00+00'::timestamptz, '2026-10-25 13:00:00+00'::timestamptz],
  'daily rules preserve the local time'
);

select is(
  (select count(*) from private.event_series_occurrence_starts(
    '2026-03-07 09:00:00-05'::timestamptz,
    'America/New_York', 'daily', 1::smallint, '{}'::smallint[], null::text, null::smallint, null::smallint, null::smallint, 3::smallint, null::date
  )),
  3::bigint,
  'daily rules cross daylight-saving boundaries'
);

select is(
  (select extract(hour from starts_at) from private.event_series_occurrence_starts(
    '2026-03-07 09:00:00-05'::timestamptz,
    'America/New_York', 'daily', 1::smallint, '{}'::smallint[], null::text, null::smallint, null::smallint, null::smallint, 3::smallint, null::date
  ) where occurrence_position = 3),
  13::numeric,
  'daylight-saving changes adjust UTC while keeping local time stable'
);

select is(
  (select count(*) from private.event_series_occurrence_starts(
    '2026-10-20 09:00:00-04'::timestamptz,
    'America/New_York', 'weekly', 1::smallint, array[2, 4]::smallint[], null::text, null::smallint, null::smallint, null::smallint, 4::smallint, null::date
  )),
  4::bigint,
  'weekly rules select configured weekdays'
);

select is(
  (select count(*) from private.event_series_occurrence_starts(
    '2026-01-31 09:00:00-05'::timestamptz,
    'America/New_York', 'monthly', 1::smallint, '{}'::smallint[], 'day-of-month', 31::smallint, null::smallint, null::smallint, 3::smallint, null::date
  )),
  3::bigint,
  'monthly day rules skip months without the requested day'
);

select throws_ok(
  $$select * from private.event_series_occurrence_starts(
    '2026-10-23 09:00:00-04'::timestamptz,
    'America/New_York', 'daily', 1::smallint, '{}'::smallint[], null::text, null::smallint, null::smallint, null::smallint, 366::smallint, null::date
  )$$,
  '23514',
  'A recurrence must contain between 1 and 365 occurrences.',
  'recurrence generation rejects more than 365 occurrences'
);

select * from finish();
rollback;
