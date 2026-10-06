begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

select has_table(
  'private',
  'flock_event_notification_activities',
  'flock event notification activity is stored privately'
);

select has_table(
  'private',
  'notification_jobs',
  'the shared notification job queue exists'
);

select has_function(
  'public',
  'claim_push_notification',
  array['uuid'],
  'the delivery worker can claim a generic push job'
);

select has_function(
  'public',
  'complete_push_notification',
  array['uuid', 'integer', 'uuid[]', 'text'],
  'the delivery worker can complete a generic push job'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.claim_push_notification(uuid)',
    'execute'
  ),
  'the service role can claim alerts'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.claim_push_notification(uuid)',
    'execute'
  ),
  'browser users cannot claim alerts'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'd1111111-1111-4111-8111-111111111111',
    'flock-alert-owner@example.com',
    '{"display_name":"Flock Owner"}'
  ),
  (
    'd2222222-2222-4222-8222-222222222222',
    'flock-alert-member@example.com',
    '{"display_name":"Current Member"}'
  ),
  (
    'd3333333-3333-4333-8333-333333333333',
    'flock-alert-later@example.com',
    '{"display_name":"Later Member"}'
  ),
  (
    'd4444444-4444-4444-8444-444444444444',
    'flock-alert-admin@example.com',
    '{"display_name":"Super Admin"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'd1111111-1111-4111-8111-111111111111',
  'Harbor Long Run'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'd2222222-2222-4222-8222-222222222222',
  'member'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

select public.register_push_subscription(
  'https://push.example/flock-alert-owner',
  'flock-alert-owner-p256dh',
  'flock-alert-owner-auth',
  null
);

create temporary table created_flock_event as
select *
from public.create_flock_event(
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Saturday Long Run',
  clock_timestamp() + interval '7 days',
  'Harbor Trail',
  'Conversational miles.',
  '[{"distanceLabel":"10 miles","paceLabel":"Conversational"}]'::jsonb
);

reset role;

select is(
  (
    select count(*)
    from private.flock_event_notification_activities
    where event_id = (select id from created_flock_event)
      and kind = 'created'
  ),
  1::bigint,
  'creating a future flock event records one activity'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and activity.kind = 'created'
  ),
  1::bigint,
  'creation queues each current non-acting member'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and job.user_id = 'd1111111-1111-4111-8111-111111111111'
  ),
  0::bigint,
  'the acting owner does not receive their own creation alert'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'd3333333-3333-4333-8333-333333333333',
  'member'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and activity.kind = 'created'
      and job.user_id = 'd3333333-3333-4333-8333-333333333333'
  ),
  0::bigint,
  'a later member does not receive historical flock activity'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd3333333-3333-4333-8333-333333333333';

select public.register_push_subscription(
  'https://push.example/flock-alert-later',
  'flock-alert-later-p256dh',
  'flock-alert-later-auth',
  null
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

select public.update_flock_event(
  (select id from created_flock_event),
  'Saturday Long Run',
  (select starts_at from created_flock_event) + interval '1 hour',
  'Harbor Trail North Gate',
  'Meet ten minutes early.',
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', option.id,
        'distanceLabel', option.distance_label,
        'paceLabel', option.pace_label
      ) order by option.position
    )
    from public.flock_event_run_options as option
    where option.event_id = (select id from created_flock_event)
  )
);

reset role;

select is(
  (
    select count(*)
    from private.flock_event_notification_activities
    where event_id = (select id from created_flock_event)
      and kind = 'updated'
  ),
  1::bigint,
  'changing a flock event records one update activity'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and activity.kind = 'updated'
  ),
  2::bigint,
  'an update queues the current non-acting members'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and activity.kind = 'updated'
      and job.user_id = 'd3333333-3333-4333-8333-333333333333'
  ),
  1::bigint,
  'a later member receives changes that occur after joining'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd1111111-1111-4111-8111-111111111111';

select public.update_flock_event(
  event.id,
  event.title,
  event.starts_at,
  event.location,
  event.description,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', option.id,
        'distanceLabel', option.distance_label,
        'paceLabel', option.pace_label
      ) order by option.position
    )
    from public.flock_event_run_options as option
    where option.event_id = event.id
  )
)
from public.flock_events as event
where event.id = (select id from created_flock_event);

reset role;

select is(
  (
    select count(*)
    from private.flock_event_notification_activities
    where event_id = (select id from created_flock_event)
      and kind = 'updated'
  ),
  1::bigint,
  'saving unchanged event details does not queue another alert'
);

create temporary table superseded_creation_job as
select job.id
from private.notification_jobs as job
join private.flock_event_notification_activities as activity
  on activity.id = job.event_activity_id
where activity.event_id = (select id from created_flock_event)
  and activity.kind = 'created'
  and job.user_id = 'd2222222-2222-4222-8222-222222222222';

grant select on superseded_creation_job to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification(
      (select id from superseded_creation_job)
    )
  ),
  0::bigint,
  'a newer event change suppresses an undelivered creation alert'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs
    where id = (select id from superseded_creation_job)
  ),
  'skipped',
  'a superseded creation job closes without sending'
);

delete from public.flock_members
where flock_id = 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = 'd2222222-2222-4222-8222-222222222222';

create temporary table update_job_ids as
select
  (array_agg(job.id) filter (
    where job.user_id = 'd2222222-2222-4222-8222-222222222222'
  ))[1] as former_member_job_id,
  (array_agg(job.id) filter (
    where job.user_id = 'd3333333-3333-4333-8333-333333333333'
  ))[1] as current_member_job_id
from private.notification_jobs as job
join private.flock_event_notification_activities as activity
  on activity.id = job.event_activity_id
where activity.event_id = (select id from created_flock_event)
  and activity.kind = 'updated';

grant select on update_job_ids to service_role;

set local role service_role;

select is(
  (
    select count(*)
    from public.claim_push_notification(
      (select former_member_job_id from update_job_ids)
    )
  ),
  0::bigint,
  'delivery rechecks flock membership after a member leaves'
);

reset role;

select is(
  (
    select status
    from private.notification_jobs
    where id = (select former_member_job_id from update_job_ids)
  ),
  'skipped',
  'a departed member job closes without sending'
);

set local role service_role;

create temporary table claimed_update_alert as
select *
from public.claim_push_notification(
  (select current_member_job_id from update_job_ids)
);

select is(
  (select count(*) from claimed_update_alert),
  1::bigint,
  'an eligible member receives the alert on every current subscription'
);

select is(
  (select notification_title from claimed_update_alert),
  'Flock event updated',
  'the update alert identifies its change type'
);

select is(
  (select notification_path from claimed_update_alert),
  '/flocks/daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa#flock-events',
  'the update alert deep-links to the flock event section'
);

select ok(
  (select notification_body like '%Harbor Long Run%Saturday Long Run%'
   from claimed_update_alert),
  'the alert names both the flock and event'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'd4444444-4444-4444-8444-444444444444';
set local request.jwt.claims = '{"sub":"d4444444-4444-4444-8444-444444444444","app_metadata":{"role":"superadmin"}}';

select public.cancel_flock_event((select id from created_flock_event));

reset role;

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and activity.kind = 'canceled'
  ),
  2::bigint,
  'a superadmin cancellation queues every current member including the owner'
);

select is(
  (
    select count(*)
    from private.notification_jobs as job
    join private.flock_event_notification_activities as activity
      on activity.id = job.event_activity_id
    where activity.event_id = (select id from created_flock_event)
      and activity.kind = 'canceled'
      and job.user_id = 'd1111111-1111-4111-8111-111111111111'
  ),
  1::bigint,
  'the flock owner receives a superadmin cancellation alert'
);

create temporary table cancellation_job as
select job.id
from private.notification_jobs as job
join private.flock_event_notification_activities as activity
  on activity.id = job.event_activity_id
where activity.event_id = (select id from created_flock_event)
  and activity.kind = 'canceled'
  and job.user_id = 'd1111111-1111-4111-8111-111111111111';

grant select on cancellation_job to service_role;

set local role service_role;

create temporary table claimed_cancellation_alert as
select *
from public.claim_push_notification((select id from cancellation_job));

reset role;

select is(
  (select notification_title from claimed_cancellation_alert),
  'Flock event canceled',
  'the cancellation alert identifies its change type'
);

select is(
  (select notification_tag from claimed_cancellation_alert),
  format('flock-event-%s', (select id from created_flock_event)),
  'all activity for one event uses a replacement notification tag'
);

select * from finish();

rollback;
