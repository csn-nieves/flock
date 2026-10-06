begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select has_table(
  'public',
  'flock_event_run_options',
  'flock event run options are stored publicly behind RLS'
);

select has_column(
  'public',
  'flock_event_attendance',
  'run_option_id',
  'attendance can reference a selected run option'
);

select has_function(
  'public',
  'set_flock_event_response',
  array['uuid', 'flock_event_response', 'uuid'],
  'the response function accepts a run option'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'e1111111-1111-4111-8111-111111111111',
    'run-option-owner@example.com',
    '{"display_name":"Option Owner"}'
  ),
  (
    'e2222222-2222-4222-8222-222222222222',
    'run-option-member@example.com',
    '{"display_name":"Option Member"}'
  ),
  (
    'e3333333-3333-4333-8333-333333333333',
    'run-option-outsider@example.com',
    '{"display_name":"Option Outsider"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Run Option Flock'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e2222222-2222-4222-8222-222222222222',
  'member'
);

set local role authenticated;
set local request.jwt.claim.sub = 'e1111111-1111-4111-8111-111111111111';

create temporary table created_option_event as
select *
from public.create_flock_event(
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Saturday choices',
  clock_timestamp() + interval '7 days',
  'River trail',
  'Pick your run.',
  '[{"distanceLabel":" 5 miles ","paceLabel":" Social "},{"distanceLabel":"10 miles","paceLabel":"Steady"}]'::jsonb
);

select is(
  (
    select count(*)
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
  ),
  2::bigint,
  'event creation stores every run option'
);

select is(
  (
    select distance_label || ' / ' || pace_label
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
    order by position
    limit 1
  ),
  '5 miles / Social',
  'event creation trims option labels and preserves order'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';

select is(
  (
    select count(*)
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
  ),
  2::bigint,
  'flock members can read run options'
);

select throws_ok(
  format(
    'select public.set_flock_event_response(%L, %L, %L)',
    (select id from created_option_event),
    'in',
    'e9999999-9999-4999-8999-999999999999'
  ),
  '23514',
  'Choose a run option for this response.',
  'in and maybe responses reject options outside the event'
);

select is(
  (
    select run_option_id::text
    from public.set_flock_event_response(
      (select id from created_option_event),
      'in',
      (
        select id
        from public.flock_event_run_options
        where event_id = (select id from created_option_event)
        order by position
        limit 1
      )
    )
  ),
  (
    select id::text
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
    order by position
    limit 1
  ),
  'a member can join a specific run option'
);

select is(
  (
    select run_option_id::text
    from public.set_flock_event_response(
      (select id from created_option_event),
      'out',
      null
    )
  ),
  null,
  'an out response clears the selected run option'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'e3333333-3333-4333-8333-333333333333';

select is(
  (
    select count(*)
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
  ),
  0::bigint,
  'outsiders cannot read flock run options'
);

select throws_ok(
  format(
    'select public.update_flock_event(%L, %L, clock_timestamp() + interval ''8 days'', %L, %L, %L::jsonb)',
    (select id from created_option_event),
    'Changed by outsider',
    'Elsewhere',
    '',
    '[{"distanceLabel":"5 miles","paceLabel":"Fast"}]'
  ),
  '42501',
  'Flock event ownership is required.',
  'outsiders cannot update flock event options'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';

select public.set_flock_event_response(
  (select id from created_option_event),
  'maybe',
  (
    select id
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
    order by position
    limit 1
  )
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'e1111111-1111-4111-8111-111111111111';

select lives_ok(
  format(
    'select public.update_flock_event(%L, %L, %L, %L, %L, %L::jsonb)',
    (select id from created_option_event),
    'Saturday choices',
    (select starts_at from created_option_event),
    'River trail',
    'Pick your run.',
    (
      select jsonb_build_array(
        jsonb_build_object(
          'id', option.id,
          'distanceLabel', option.distance_label,
          'paceLabel', 'Tempo'
        )
      )::text
      from public.flock_event_run_options as option
      where option.event_id = (select id from created_option_event)
      order by option.position desc
      limit 1
    )
  ),
  'the owner can remove and edit run options atomically'
);

select is(
  (
    select count(*)
    from public.flock_event_run_options
    where event_id = (select id from created_option_event)
  ),
  1::bigint,
  'the updated event keeps only the supplied options'
);

select is(
  (
    select run_option_id
    from public.flock_event_attendance
    where event_id = (select id from created_option_event)
      and user_id = 'e2222222-2222-4222-8222-222222222222'
  ),
  null,
  'removing a selected option preserves attendance and clears its selection'
);

reset role;

insert into public.flock_events (
  id,
  flock_id,
  created_by,
  title,
  starts_at,
  location
)
values (
  'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Legacy event',
  clock_timestamp() + interval '9 days',
  'Old trailhead'
);

set local role authenticated;
set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';

select is(
  (
    select response::text
    from public.set_flock_event_response(
      'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'in',
      null
    )
  ),
  'in',
  'legacy events without options still accept responses'
);

select * from finish();

rollback;
