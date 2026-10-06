begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

select has_table(
  'private',
  'push_subscriptions',
  'per-device push subscriptions are stored privately'
);

select has_table(
  'private',
  'notification_jobs',
  'event invitation push jobs are stored privately'
);

select has_function(
  'public',
  'register_push_subscription',
  array['text', 'text', 'text', 'bigint'],
  'authenticated browsers can register a push subscription'
);

select has_function(
  'public',
  'unregister_push_subscription',
  array['text'],
  'authenticated browsers can unregister their own subscription'
);

select has_function(
  'public',
  'claim_push_notification',
  array['uuid'],
  'the delivery worker can claim one push job'
);

select has_function(
  'public',
  'complete_push_notification',
  array['uuid', 'integer', 'uuid[]', 'text'],
  'the delivery worker can complete one push job'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.register_push_subscription(text, text, text, bigint)',
    'execute'
  ),
  'authenticated users can register their device'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.register_push_subscription(text, text, text, bigint)',
    'execute'
  ),
  'anonymous users cannot register a device'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.claim_push_notification(uuid)',
    'execute'
  ),
  'the service role can claim push jobs'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.claim_push_notification(uuid)',
    'execute'
  ),
  'browser users cannot claim push jobs'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'push-event-owner@example.com',
    '{"display_name":"Event Owner"}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'push-flock-owner@example.com',
    '{"display_name":"Flock Owner"}'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'push-current-member@example.com',
    '{"display_name":"Current Member"}'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'push-later-member@example.com',
    '{"display_name":"Later Member"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Harbor Long Run'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  'member'
);

insert into public.flock_events (
  id,
  flock_id,
  created_by,
  title,
  starts_at,
  location,
  description
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  null,
  '11111111-1111-1111-1111-111111111111',
  'Cross-flock social run',
  clock_timestamp() + interval '7 days',
  'Riverside Park',
  'Easy miles together.'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select public.register_push_subscription(
  'https://push.example/current-member',
  'current-member-p256dh',
  'current-member-auth',
  null
);

reset role;

select is(
  (
    select count(*)
    from private.push_subscriptions
    where user_id = '33333333-3333-3333-3333-333333333333'
  ),
  1::bigint,
  'registering stores one subscription for the current browser'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table targeted_push_invitation as
select *
from public.create_targeted_event_invitation(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '33333333-3333-3333-3333-333333333333'
);

create temporary table flock_push_invitation as
select *
from public.create_flock_event_invitation(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

reset role;

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.event_invitations as invitation
      on invitation.id = job.invitation_id
    where invitation.token_hash = extensions.digest(
      (select token from targeted_push_invitation),
      'sha256'
    )
      and job.user_id = '33333333-3333-3333-3333-333333333333'
  ),
  1::bigint,
  'a targeted invitation queues its recipient'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.event_invitations as invitation
      on invitation.id = job.invitation_id
    where invitation.token_hash = extensions.digest(
      (select token from flock_push_invitation),
      'sha256'
    )
      and job.user_id = '33333333-3333-3333-3333-333333333333'
  ),
  1::bigint,
  'a flock invitation queues every current eligible member'
);

select is(
  (
    select count(*)
    from private.notification_jobs
    where user_id = '11111111-1111-1111-1111-111111111111'
  ),
  0::bigint,
  'an event creator never receives their own invitation alert'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '44444444-4444-4444-4444-444444444444',
  'member'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.event_invitations as invitation
      on invitation.id = job.invitation_id
    where invitation.token_hash = extensions.digest(
      (select token from flock_push_invitation),
      'sha256'
    )
      and job.user_id = '44444444-4444-4444-4444-444444444444'
  ),
  1::bigint,
  'a member who joins during the invitation window gets a push job'
);

delete from public.flock_members
where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and user_id = '33333333-3333-3333-3333-333333333333';

create temporary table push_job_ids as
select
  (array_agg(job.id) filter (
    where job.user_id = '33333333-3333-3333-3333-333333333333'
  ))[1] as former_member_job_id,
  (array_agg(job.id) filter (
    where job.user_id = '44444444-4444-4444-4444-444444444444'
  ))[1] as later_member_job_id
from private.notification_jobs as job
join private.event_invitations as invitation
  on invitation.id = job.invitation_id
where invitation.token_hash = extensions.digest(
  (select token from flock_push_invitation),
  'sha256'
);

grant select on push_job_ids to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification(
      (select former_member_job_id from push_job_ids)
    )
  ),
  0::bigint,
  'delivery rechecks live flock membership before exposing notification content'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs as job
    join private.event_invitations as invitation
      on invitation.id = job.invitation_id
    where invitation.token_hash = extensions.digest(
      (select token from flock_push_invitation),
      'sha256'
    )
      and job.user_id = '33333333-3333-3333-3333-333333333333'
  ),
  'skipped',
  'an ineligible delivery is closed without sending'
);

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification(
      (select later_member_job_id from push_job_ids)
    )
  ),
  0::bigint,
  'a job waits when the runner has no registered device'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs as job
    join private.event_invitations as invitation
      on invitation.id = job.invitation_id
    where invitation.token_hash = extensions.digest(
      (select token from flock_push_invitation),
      'sha256'
    )
      and job.user_id = '44444444-4444-4444-4444-444444444444'
  ),
  'waiting_for_subscription',
  'the waiting state can be retried after this device opts in'
);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select public.register_push_subscription(
  'https://push.example/later-member',
  'later-member-p256dh',
  'later-member-auth',
  null
);

reset role;

select is(
  (
    select status
    from private.notification_jobs as job
    join private.event_invitations as invitation
      on invitation.id = job.invitation_id
    where invitation.token_hash = extensions.digest(
      (select token from flock_push_invitation),
      'sha256'
    )
      and job.user_id = '44444444-4444-4444-4444-444444444444'
  ),
  'pending',
  'registering a device requeues a still-pending invitation'
);

set local role service_role;

create temporary table claimed_push_notification as
select *
from public.claim_push_notification(
  (select later_member_job_id from push_job_ids)
);

select is(
  (select count(*) from claimed_push_notification),
  1::bigint,
  'claiming returns every current device subscription'
);

select is(
  (select notification_path from claimed_push_notification),
  '/events#event-invitations',
  'the notification deep-links to the in-app invitation inbox'
);

select ok(
  (
    select notification_body like '%Cross-flock social run%'
    from claimed_push_notification
  ),
  'the notification identifies the invited event'
);

select public.complete_push_notification(
  (select job_id from claimed_push_notification),
  0,
  array[(select subscription_id from claimed_push_notification)],
  null
);

reset role;

select is(
  (
    select count(*)
    from private.push_subscriptions
    where endpoint = 'https://push.example/later-member'
  ),
  0::bigint,
  'a stale push-service endpoint is removed during completion'
);

select is(
  (
    select status
    from private.notification_jobs
    where id = (select job_id from claimed_push_notification)
  ),
  'waiting_for_subscription',
  'a stale-only delivery waits for a future device subscription'
);

select is(
  (
    select count(*)
    from private.notification_jobs
    where invitation_id is null
  ),
  0::bigint,
  'every push job remains bound to an invitation'
);

select * from finish();

rollback;
