begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

select has_table(
  'public',
  'notifications',
  'durable in-app notifications are stored in the public schema'
);
select has_function(
  'public',
  'mark_notification_read',
  array['uuid'],
  'runners can mark one notification read through an authorized function'
);
select has_function(
  'public',
  'mark_all_notifications_read',
  array[]::text[],
  'runners can mark all of their notifications read'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'e1111111-1111-4111-8111-111111111111',
    'notification-owner@example.com',
    '{"display_name":"Notification Owner"}'
  ),
  (
    'e2222222-2222-4222-8222-222222222222',
    'notification-member@example.com',
    '{"display_name":"Notification Member"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Notification Test Flock'
);

insert into public.flock_members (flock_id, user_id, role)
values
  (
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e2222222-2222-4222-8222-222222222222',
    'member'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'e1111111-1111-4111-8111-111111111111';

create temporary table created_notification_message as
select *
from public.send_flock_message(
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Meet at the river path at sunrise.'
);

reset role;

select is(
  (
    select count(*)
    from public.notifications
    where user_id = 'e2222222-2222-4222-8222-222222222222'
      and kind = 'flock_message'
      and source_id = (select id from created_notification_message)
  ),
  1::bigint,
  'a flock message creates one durable notification for each other member'
);
select is(
  (
    select count(*)
    from public.notifications
    where user_id = 'e1111111-1111-4111-8111-111111111111'
      and source_id = (select id from created_notification_message)
  ),
  0::bigint,
  'the message sender does not receive an in-app notification'
);

set local role authenticated;
set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';

select is(
  (select count(*) from public.notifications),
  1::bigint,
  'a runner can read only their own notification feed'
);

select public.mark_notification_read(
  (select id from public.notifications limit 1)
);

select isnt(
  (select read_at from public.notifications limit 1),
  null,
  'marking one notification records a read timestamp'
);

reset role;

select * from finish();

rollback;
