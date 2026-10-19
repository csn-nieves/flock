begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select has_table(
  'public',
  'notification_preferences',
  'notification preferences are stored per runner'
);
select has_function(
  'public',
  'get_notification_preferences',
  array[]::text[],
  'runners can read their notification preferences'
);
select has_function(
  'public',
  'update_notification_preferences',
  array['boolean', 'boolean', 'boolean'],
  'runners can update their notification preferences'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'f1111111-1111-4111-8111-111111111111',
    'notification-preferences-owner@example.com',
    '{"display_name":"Preferences Owner"}'
  ),
  (
    'f2222222-2222-4222-8222-222222222222',
    'notification-preferences-member@example.com',
    '{"display_name":"Preferences Member"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'f1111111-1111-4111-8111-111111111111',
  'Notification Preferences Flock'
);

insert into public.flock_members (flock_id, user_id, role)
values
  (
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'f2222222-2222-4222-8222-222222222222',
    'member'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'f2222222-2222-4222-8222-222222222222';

select is(
  (select event_invitations from public.get_notification_preferences()),
  true,
  'new runners receive event invitations by default'
);

select (public.update_notification_preferences(false, true, false)).*;

select is(
  (select chat_messages from public.get_notification_preferences()),
  false,
  'a runner can disable chat notifications'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'f1111111-1111-4111-8111-111111111111';

select *
into temporary first_message
from public.send_flock_message(
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'This message should not notify the member.'
);

reset role;

select is(
  (select count(*) from public.notifications where source_id = (select id from first_message)),
  0::bigint,
  'disabled chat notifications suppress in-app fan-out'
);

select * from finish();

rollback;
