begin;

create extension if not exists pgtap with schema extensions;

select plan(32);

select has_column(
  'private',
  'notification_jobs',
  'flock_message_id',
  'notification jobs can belong to a flock message'
);
select has_column(
  'private',
  'notification_jobs',
  'direct_message_id',
  'notification jobs can belong to a direct message'
);
select has_index(
  'private',
  'notification_jobs',
  'notification_jobs_flock_message_user_idx',
  'flock message alerts are idempotent per recipient'
);
select has_index(
  'private',
  'notification_jobs',
  'notification_jobs_direct_message_user_idx',
  'direct message alerts are idempotent per recipient'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'd1111111-1111-4111-8111-111111111111',
    'chat-alert-owner@example.com',
    '{"display_name":"Chat Alert Owner"}'
  ),
  (
    'd2222222-2222-4222-8222-222222222222',
    'chat-alert-member@example.com',
    '{"display_name":"Chat Alert Member"}'
  ),
  (
    'd3333333-3333-4333-8333-333333333333',
    'chat-alert-opted-out@example.com',
    '{"display_name":"Chat Alert Opted Out"}'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

insert into public.flocks (id, name)
values ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Chat Alerts');

reset role;

insert into public.flock_members (flock_id, user_id, role)
values
  (
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'd2222222-2222-4222-8222-222222222222',
    'member'
  ),
  (
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'd3333333-3333-4333-8333-333333333333',
    'member'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'd2222222-2222-4222-8222-222222222222';

select public.register_push_subscription(
  'https://push.example/chat-alert-member',
  'chat-alert-member-p256dh',
  'chat-alert-member-auth',
  null
);

set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table first_flock_message as
select *
from public.send_flock_message(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Meet at the private trail entrance.'
);

reset role;

select is(
  (
    select count(*)
    from private.notification_jobs
    where flock_message_id = (select id from first_flock_message)
      and user_id = 'd2222222-2222-4222-8222-222222222222'
  ),
  1::bigint,
  'a subscribed flock member receives one notification job'
);
select is(
  (
    select count(*)
    from private.notification_jobs
    where flock_message_id = (select id from first_flock_message)
      and user_id = 'd1111111-1111-4111-8111-111111111111'
  ),
  0::bigint,
  'the flock message sender never receives their own alert'
);
select is(
  (
    select count(*)
    from private.notification_jobs
    where flock_message_id = (select id from first_flock_message)
      and user_id = 'd3333333-3333-4333-8333-333333333333'
  ),
  0::bigint,
  'a flock member without a current device subscription gets no historical job'
);
select is(
  (
    select num_nonnulls(
      invitation_id,
      event_activity_id,
      flock_message_id,
      direct_message_id
    )
    from private.notification_jobs
    where flock_message_id = (select id from first_flock_message)
  ),
  1,
  'a chat notification remains bound to exactly one source'
);

create temporary table first_flock_job as
select id
from private.notification_jobs
where flock_message_id = (select id from first_flock_message);
grant select on first_flock_job to service_role;

set local role service_role;

create temporary table claimed_flock_alert as
select *
from public.claim_push_notification((select id from first_flock_job));

select is(
  (select count(*) from claimed_flock_alert),
  1::bigint,
  'an eligible flock alert returns the subscribed device'
);
select is(
  (select notification_path from claimed_flock_alert),
  '/chats/daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'a flock alert deep-links to the correct chat'
);
select is(
  (select notification_title from claimed_flock_alert),
  'New message in Chat Alerts',
  'a flock alert identifies the authorized conversation'
);
select is(
  (select notification_body from claimed_flock_alert),
  'Chat Alert Owner: Meet at the private trail entrance.',
  'a flock alert includes a bounded plain-text message preview'
);
select ok(
  (
    select length(notification_body) <= 200
    from claimed_flock_alert
  ),
  'a flock alert preview remains bounded by the delivery payload'
);
select is(
  (select notification_tag from claimed_flock_alert),
  'flock-chat-daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'flock alerts share a replacement tag per conversation'
);
select is(
  (select ttl_seconds from claimed_flock_alert),
  86400,
  'chat alerts expire after one day'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table older_flock_message as
select *
from public.send_flock_message(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'First rapid update.'
);
create temporary table latest_flock_message as
select *
from public.send_flock_message(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Latest rapid update.'
);

reset role;

create temporary table rapid_flock_jobs as
select flock_message_id, id
from private.notification_jobs
where flock_message_id in (
  (select id from older_flock_message),
  (select id from latest_flock_message)
);
grant select on rapid_flock_jobs to service_role;
grant select on older_flock_message to service_role;
grant select on latest_flock_message to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification(
      (
        select id
        from rapid_flock_jobs
        where flock_message_id = (select id from older_flock_message)
      )
    )
  ),
  0::bigint,
  'an older undelivered flock message is suppressed after newer activity'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs
    where flock_message_id = (select id from older_flock_message)
  ),
  'skipped',
  'a superseded flock alert closes without delivery'
);

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification(
      (
        select id
        from rapid_flock_jobs
        where flock_message_id = (select id from latest_flock_message)
      )
    )
  ),
  1::bigint,
  'the latest unread flock message remains deliverable'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table read_flock_message as
select *
from public.send_flock_message(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'This message is read before delivery.'
);

set local request.jwt.claim.sub = 'd2222222-2222-4222-8222-222222222222';
select public.mark_flock_chat_read(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  (select id from read_flock_message)
);

reset role;

create temporary table read_flock_job as
select id
from private.notification_jobs
where flock_message_id = (select id from read_flock_message);
grant select on read_flock_job to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification((select id from read_flock_job))
  ),
  0::bigint,
  'a flock message read before delivery does not produce an alert'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs
    where flock_message_id = (select id from read_flock_message)
  ),
  'skipped',
  'a read flock alert closes without delivery'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table departed_flock_message as
select *
from public.send_flock_message(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'This member leaves before delivery.'
);

reset role;

delete from public.flock_members
where flock_id = 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = 'd2222222-2222-4222-8222-222222222222';

create temporary table departed_flock_job as
select id
from private.notification_jobs
where flock_message_id = (select id from departed_flock_message);
grant select on departed_flock_job to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification((select id from departed_flock_job))
  ),
  0::bigint,
  'delivery rechecks flock membership before exposing conversation details'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs
    where flock_message_id = (select id from departed_flock_message)
  ),
  'skipped',
  'a former member alert closes without delivery'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table direct_conversation as
select public.get_or_create_direct_conversation(
  'd2222222-2222-4222-8222-222222222222'
) as id;

create temporary table first_direct_message as
select *
from public.send_direct_message(
  (select id from direct_conversation),
  'The direct-message body stays private.'
);

reset role;

select is(
  (
    select count(*)
    from private.notification_jobs
    where direct_message_id = (select id from first_direct_message)
      and user_id = 'd2222222-2222-4222-8222-222222222222'
  ),
  1::bigint,
  'a subscribed direct-message participant receives one notification job'
);

create temporary table first_direct_job as
select id
from private.notification_jobs
where direct_message_id = (select id from first_direct_message);
grant select on first_direct_job to service_role;
grant select on direct_conversation to service_role;

set local role service_role;

create temporary table claimed_direct_alert as
select *
from public.claim_push_notification((select id from first_direct_job));

select is(
  (select count(*) from claimed_direct_alert),
  1::bigint,
  'an eligible direct-message alert returns the subscribed device'
);
select is(
  (select notification_path from claimed_direct_alert),
  format('/chats/direct/%s', (select id from direct_conversation)),
  'a direct-message alert deep-links to the private conversation'
);
select is(
  (select notification_title from claimed_direct_alert),
  'New direct message',
  'a direct-message alert uses a privacy-conscious title'
);
select is(
  (select notification_body from claimed_direct_alert),
  'Chat Alert Owner: The direct-message body stays private.',
  'a direct-message alert includes a bounded plain-text message preview'
);
select ok(
  (
    select length(notification_body) <= 200
    from claimed_direct_alert
  ),
  'a direct-message preview remains bounded by the delivery payload'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table read_direct_message as
select *
from public.send_direct_message(
  (select id from direct_conversation),
  'Read before direct delivery.'
);

set local request.jwt.claim.sub = 'd2222222-2222-4222-8222-222222222222';
select public.mark_direct_conversation_read(
  (select id from direct_conversation),
  (select id from read_direct_message)
);

reset role;

create temporary table read_direct_job as
select id
from private.notification_jobs
where direct_message_id = (select id from read_direct_message);
grant select on read_direct_job to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification((select id from read_direct_job))
  ),
  0::bigint,
  'a direct message read before delivery does not produce an alert'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs
    where direct_message_id = (select id from read_direct_message)
  ),
  'skipped',
  'a read direct-message alert closes without delivery'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

create temporary table opted_out_conversation as
select public.get_or_create_direct_conversation(
  'd3333333-3333-4333-8333-333333333333'
) as id;

create temporary table opted_out_direct_message as
select *
from public.send_direct_message(
  (select id from opted_out_conversation),
  'No device is subscribed.'
);

reset role;

select is(
  (
    select count(*)
    from private.notification_jobs
    where direct_message_id = (select id from opted_out_direct_message)
  ),
  0::bigint,
  'a direct-message participant without a subscription gets no historical job'
);

select throws_ok(
  $$insert into private.notification_jobs (user_id)
    values ('d2222222-2222-4222-8222-222222222222')$$,
  '23514',
  null,
  'notification jobs require exactly one supported source'
);

select * from finish();

rollback;
