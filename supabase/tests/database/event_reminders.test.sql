begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select has_table(
  'private',
  'event_reminder_jobs',
  'event reminders have a private idempotent job table'
);
select has_column(
  'public',
  'flock_events',
  'time_zone',
  'events store an IANA time zone'
);
select has_column(
  'public',
  'flock_events',
  'reminders_enabled',
  'legacy events can remain reminder-disabled'
);
select has_function(
  'public',
  'update_notification_preferences',
  array['boolean', 'boolean', 'boolean', 'boolean'],
  'runners can control event reminders separately'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'e1111111-1111-4111-8111-111111111111',
    'event-reminders-owner@example.com',
    '{"display_name":"Reminder Owner"}'
  ),
  (
    'e2222222-2222-4222-8222-222222222222',
    'event-reminders-member@example.com',
    '{"display_name":"Reminder Member"}'
  ),
  (
    'e3333333-3333-4333-8333-333333333333',
    'event-reminders-out@example.com',
    '{"display_name":"Reminder Out"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Reminder Flock'
);

insert into public.flock_members (flock_id, user_id, role)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e2222222-2222-4222-8222-222222222222', 'member'),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e3333333-3333-4333-8333-333333333333', 'member');

insert into public.flock_events (
  id, flock_id, created_by, title, starts_at, time_zone, reminders_enabled, location
)
values (
  'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Sunrise Reminder Run',
  clock_timestamp() + interval '30 minutes',
  'America/New_York',
  true,
  'Riverside'
);

insert into public.flock_event_attendance (event_id, user_id, response)
values
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'e2222222-2222-4222-8222-222222222222', 'in'),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'e3333333-3333-4333-8333-333333333333', 'out');

select private.enqueue_due_event_reminders();
select private.enqueue_due_event_reminders();

select is(
  (select count(*) from private.event_reminder_jobs where event_id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  4::bigint,
  'the creator and in-responders receive both due reminder windows'
);
select is(
  (select count(*) from private.event_reminder_jobs where event_id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and reminder_minutes = 60),
  2::bigint,
  'the one-hour reminder is created for eligible participants'
);
select is(
  (select count(*) from private.event_reminder_jobs where event_id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and reminder_minutes = 1440),
  2::bigint,
  'the missed 24-hour reminder is still created while the event is upcoming'
);
select is(
  (select count(*) from private.event_reminder_jobs where event_id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id = 'e3333333-3333-4333-8333-333333333333'),
  0::bigint,
  'runners who are out do not receive reminders'
);
select is(
  (select count(*) from private.notification_jobs as job join private.event_reminder_jobs as reminder on reminder.id = job.event_reminder_id where reminder.event_id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  4::bigint,
  'push jobs are idempotent across scheduler retries'
);
select is(
  (select count(*) from public.notifications where kind = 'event_reminder' and source_id in (select id from private.event_reminder_jobs where event_id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')),
  4::bigint,
  'in-app reminders are distinct per reminder window'
);
select ok(
  position(
    'Sunrise Reminder Run' in (select body from public.notifications where kind = 'event_reminder' limit 1)
  ) > 0
  and position(
    'America/New_York' in (select body from public.notifications where kind = 'event_reminder' limit 1)
  ) > 0,
  'reminder copy contains the event name and event time zone'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';
select (public.update_notification_preferences(true, true, true, false)).*;
reset role;

insert into public.flock_events (
  id, flock_id, created_by, title, starts_at, time_zone, reminders_enabled, location
)
values (
  'eccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Muted Reminder Run',
  clock_timestamp() + interval '30 minutes',
  'America/New_York',
  true,
  'Riverside'
);
insert into public.flock_event_attendance (event_id, user_id, response)
values ('eccccccc-cccc-4ccc-8ccc-cccccccccccc', 'e2222222-2222-4222-8222-222222222222', 'in');
select private.enqueue_due_event_reminders();

select is(
  (select count(*) from private.notification_jobs as push_job
   join private.event_reminder_jobs as reminder on reminder.id = push_job.event_reminder_id
   where reminder.event_id = 'eccccccc-cccc-4ccc-8ccc-cccccccccccc'
     and reminder.user_id = 'e2222222-2222-4222-8222-222222222222'),
  0::bigint,
  'disabled event reminders do not enqueue push jobs'
);
select is(
  (select count(*) from public.notifications
   where kind = 'event_reminder'
     and user_id = 'e2222222-2222-4222-8222-222222222222'
     and source_id in (select id from private.event_reminder_jobs where event_id = 'eccccccc-cccc-4ccc-8ccc-cccccccccccc')),
  0::bigint,
  'disabled event reminders do not fan out in-app notifications'
);

select * from finish();
rollback;
