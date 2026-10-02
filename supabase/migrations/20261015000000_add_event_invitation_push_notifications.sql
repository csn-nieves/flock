create table private.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  expiration_time bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_check check (
    endpoint = btrim(endpoint)
    and endpoint like 'https://%'
    and char_length(endpoint) between 1 and 2048
  ),
  constraint push_subscriptions_p256dh_check check (
    p256dh = btrim(p256dh)
    and char_length(p256dh) between 1 and 512
  ),
  constraint push_subscriptions_auth_key_check check (
    auth_key = btrim(auth_key)
    and char_length(auth_key) between 1 and 512
  )
);

create index push_subscriptions_user_idx
on private.push_subscriptions (user_id, updated_at desc);

create table private.event_invitation_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references private.event_invitations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processing_at timestamptz,
  completed_at timestamptz,
  last_error text,
  unique (invitation_id, user_id),
  constraint event_invitation_notification_jobs_status_check check (
    status in (
      'pending',
      'processing',
      'waiting_for_subscription',
      'sent',
      'failed',
      'skipped'
    )
  )
);

create index event_invitation_notification_jobs_status_idx
on private.event_invitation_notification_jobs (status, created_at)
where status in ('pending', 'processing', 'failed');

revoke all on table private.push_subscriptions
from public, anon, authenticated;

revoke all on table private.event_invitation_notification_jobs
from public, anon, authenticated;

create function public.register_push_subscription(
  subscription_endpoint text,
  subscription_p256dh text,
  subscription_auth_key text,
  subscription_expiration_time bigint default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  insert into private.push_subscriptions (
    user_id,
    endpoint,
    p256dh,
    auth_key,
    expiration_time
  )
  values (
    current_user_id,
    subscription_endpoint,
    subscription_p256dh,
    subscription_auth_key,
    subscription_expiration_time
  )
  on conflict (endpoint) do update
  set
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth_key = excluded.auth_key,
    expiration_time = excluded.expiration_time,
    updated_at = clock_timestamp();

  insert into private.event_invitation_notification_jobs (
    invitation_id,
    user_id
  )
  select
    invitation.id,
    current_user_id
  from private.event_invitations as invitation
  join public.flock_events as event on event.id = invitation.event_id
  where invitation.expires_at > clock_timestamp()
    and event.starts_at >= clock_timestamp()
    and event.canceled_at is null
    and event.created_by <> current_user_id
    and (
      (
        invitation.recipient_user_id = current_user_id
        and invitation.consumed_at is null
      )
      or (
        invitation.flock_id is not null
        and exists (
          select 1
          from public.flock_members as member
          where member.flock_id = invitation.flock_id
            and member.user_id = current_user_id
        )
        and not exists (
          select 1
          from private.event_invitation_acceptances as acceptance
          where acceptance.invitation_id = invitation.id
            and acceptance.user_id = current_user_id
        )
      )
    )
  on conflict (invitation_id, user_id) do update
  set
    status = 'pending',
    processing_at = null,
    completed_at = null,
    last_error = null
  where event_invitation_notification_jobs.status in (
    'waiting_for_subscription',
    'failed'
  );
end;
$$;

create function public.unregister_push_subscription(subscription_endpoint text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from private.push_subscriptions
  where user_id = (select auth.uid())
    and endpoint = subscription_endpoint;
$$;

revoke execute on function public.register_push_subscription(text, text, text, bigint)
from public, anon;

revoke execute on function public.unregister_push_subscription(text)
from public, anon;

grant execute on function public.register_push_subscription(text, text, text, bigint)
to authenticated;

grant execute on function public.unregister_push_subscription(text)
to authenticated;

create function private.enqueue_event_invitation_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.recipient_user_id is not null
    and new.recipient_user_id <> new.created_by
  then
    insert into private.event_invitation_notification_jobs (
      invitation_id,
      user_id
    )
    values (new.id, new.recipient_user_id)
    on conflict (invitation_id, user_id) do nothing;
  elsif new.flock_id is not null then
    insert into private.event_invitation_notification_jobs (
      invitation_id,
      user_id
    )
    select
      new.id,
      member.user_id
    from public.flock_members as member
    where member.flock_id = new.flock_id
      and member.user_id <> new.created_by
    on conflict (invitation_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger enqueue_event_invitation_notifications
after insert on private.event_invitations
for each row
execute function private.enqueue_event_invitation_notifications();

create function private.enqueue_active_flock_invitations_for_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.event_invitation_notification_jobs (
    invitation_id,
    user_id
  )
  select
    invitation.id,
    new.user_id
  from private.event_invitations as invitation
  join public.flock_events as event on event.id = invitation.event_id
  where invitation.flock_id = new.flock_id
    and invitation.created_by <> new.user_id
    and invitation.expires_at > clock_timestamp()
    and event.starts_at >= clock_timestamp()
    and event.canceled_at is null
    and not exists (
      select 1
      from private.event_invitation_acceptances as acceptance
      where acceptance.invitation_id = invitation.id
        and acceptance.user_id = new.user_id
    )
  on conflict (invitation_id, user_id) do nothing;

  return new;
end;
$$;

create trigger enqueue_active_flock_invitations_for_member
after insert on public.flock_members
for each row
execute function private.enqueue_active_flock_invitations_for_member();

create function public.claim_event_invitation_notification(target_job_id uuid)
returns table (
  job_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth_key text,
  notification_title text,
  notification_body text,
  notification_path text,
  notification_tag text,
  ttl_seconds integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  claimed_job private.event_invitation_notification_jobs;
  claimed_invitation private.event_invitations;
  claimed_event public.flock_events;
  creator_name text;
  is_eligible boolean;
begin
  select candidate.*
  into claimed_job
  from private.event_invitation_notification_jobs as candidate
  where candidate.id = target_job_id
    and (
      candidate.status in ('pending', 'failed')
      or (
        candidate.status = 'processing'
        and candidate.processing_at < clock_timestamp() - interval '5 minutes'
      )
    )
  for update;

  if claimed_job.id is null then
    return;
  end if;

  select invitation.*
  into claimed_invitation
  from private.event_invitations as invitation
  where invitation.id = claimed_job.invitation_id;

  select event.*
  into claimed_event
  from public.flock_events as event
  where event.id = claimed_invitation.event_id;

  is_eligible := claimed_invitation.id is not null
    and claimed_invitation.expires_at > clock_timestamp()
    and claimed_event.starts_at >= clock_timestamp()
    and claimed_event.canceled_at is null
    and claimed_event.created_by <> claimed_job.user_id
    and (
      (
        claimed_invitation.recipient_user_id = claimed_job.user_id
        and claimed_invitation.consumed_at is null
      )
      or (
        claimed_invitation.flock_id is not null
        and exists (
          select 1
          from public.flock_members as member
          where member.flock_id = claimed_invitation.flock_id
            and member.user_id = claimed_job.user_id
        )
        and not exists (
          select 1
          from private.event_invitation_acceptances as acceptance
          where acceptance.invitation_id = claimed_invitation.id
            and acceptance.user_id = claimed_job.user_id
        )
      )
    );

  if is_eligible is not true then
    update private.event_invitation_notification_jobs
    set
      status = 'skipped',
      completed_at = clock_timestamp(),
      last_error = null
    where id = claimed_job.id;
    return;
  end if;

  if not exists (
    select 1
    from private.push_subscriptions as subscription
    where subscription.user_id = claimed_job.user_id
      and (
        subscription.expiration_time is null
        or subscription.expiration_time > floor(extract(epoch from clock_timestamp()) * 1000)
      )
  ) then
    update private.event_invitation_notification_jobs
    set
      status = 'waiting_for_subscription',
      completed_at = clock_timestamp(),
      last_error = null
    where id = claimed_job.id;
    return;
  end if;

  update private.event_invitation_notification_jobs
  set
    status = 'processing',
    processing_at = clock_timestamp(),
    completed_at = null,
    last_error = null
  where id = claimed_job.id;

  select profile.display_name
  into creator_name
  from public.profiles as profile
  where profile.user_id = claimed_event.created_by;

  return query
  select
    claimed_job.id,
    subscription.id,
    subscription.endpoint,
    subscription.p256dh,
    subscription.auth_key,
    'New event invitation'::text,
    format(
      '%s invited you to %s.',
      coalesce(creator_name, 'A runner'),
      claimed_event.title
    ),
    '/events#event-invitations'::text,
    format('event-invitation-%s', claimed_event.id),
    greatest(
      0,
      least(
        604800,
        floor(extract(epoch from claimed_invitation.expires_at - clock_timestamp()))::integer
      )
    )
  from private.push_subscriptions as subscription
  where subscription.user_id = claimed_job.user_id
    and (
      subscription.expiration_time is null
      or subscription.expiration_time > floor(extract(epoch from clock_timestamp()) * 1000)
    );
end;
$$;

create function public.complete_event_invitation_notification(
  target_job_id uuid,
  delivered_count integer,
  stale_subscription_ids uuid[] default array[]::uuid[],
  failure_message text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  job_user_id uuid;
begin
  select user_id
  into job_user_id
  from private.event_invitation_notification_jobs
  where id = target_job_id
    and status = 'processing'
  for update;

  if job_user_id is null then
    return;
  end if;

  delete from private.push_subscriptions
  where user_id = job_user_id
    and id = any(stale_subscription_ids);

  update private.event_invitation_notification_jobs
  set
    status = case
      when delivered_count > 0 then 'sent'
      when failure_message is not null then 'failed'
      else 'waiting_for_subscription'
    end,
    completed_at = clock_timestamp(),
    last_error = left(failure_message, 500)
  where id = target_job_id;
end;
$$;

revoke execute on function public.claim_event_invitation_notification(uuid)
from public, anon, authenticated;

revoke execute on function public.complete_event_invitation_notification(uuid, integer, uuid[], text)
from public, anon, authenticated;

grant execute on function public.claim_event_invitation_notification(uuid)
to service_role;

grant execute on function public.complete_event_invitation_notification(uuid, integer, uuid[], text)
to service_role;

revoke execute on function private.enqueue_event_invitation_notifications()
from public;

revoke execute on function private.enqueue_active_flock_invitations_for_member()
from public;

comment on table private.push_subscriptions is
  'Per-browser Web Push subscriptions owned by authenticated Flock users.';

comment on table private.event_invitation_notification_jobs is
  'Idempotent push-delivery jobs for targeted and live-flock event invitations.';

comment on function public.register_push_subscription(text, text, text, bigint) is
  'Registers the current browser push subscription and requeues still-pending invitations for that user.';

comment on function public.claim_event_invitation_notification(uuid) is
  'Claims one eligible invitation-notification job and returns its current device subscriptions to the service role.';
