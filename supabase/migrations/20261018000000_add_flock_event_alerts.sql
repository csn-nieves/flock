create table private.flock_event_notification_activities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.flock_events (id) on delete cascade,
  flock_id uuid not null references public.flocks (id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint flock_event_notification_activities_kind_check check (
    kind in ('created', 'updated', 'canceled')
  )
);

create index flock_event_notification_activities_event_idx
on private.flock_event_notification_activities (event_id, created_at desc);

create index flock_event_notification_activities_flock_idx
on private.flock_event_notification_activities (flock_id, created_at desc);

alter table private.event_invitation_notification_jobs
rename to notification_jobs;

alter index private.event_invitation_notification_jobs_status_idx
rename to notification_jobs_status_idx;

alter table private.notification_jobs
alter column invitation_id drop not null;

alter table private.notification_jobs
add column event_activity_id uuid references private.flock_event_notification_activities (id) on delete cascade;

alter table private.notification_jobs
add constraint notification_jobs_one_source_check check (
  num_nonnulls(invitation_id, event_activity_id) = 1
);

create unique index notification_jobs_event_activity_user_idx
on private.notification_jobs (event_activity_id, user_id)
where event_activity_id is not null;

create index notification_jobs_user_status_idx
on private.notification_jobs (user_id, status);

revoke all on table private.flock_event_notification_activities
from public, anon, authenticated;

revoke all on table private.notification_jobs
from public, anon, authenticated;

create or replace function public.register_push_subscription(
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

  insert into private.notification_jobs (
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
  where notification_jobs.status in ('waiting_for_subscription', 'failed');

  update private.notification_jobs
  set
    status = 'pending',
    processing_at = null,
    completed_at = null,
    last_error = null
  where user_id = current_user_id
    and event_activity_id is not null
    and status in ('waiting_for_subscription', 'failed');
end;
$$;

create or replace function private.enqueue_event_invitation_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.recipient_user_id is not null
    and new.recipient_user_id <> new.created_by
  then
    insert into private.notification_jobs (invitation_id, user_id)
    values (new.id, new.recipient_user_id)
    on conflict (invitation_id, user_id) do nothing;
  elsif new.flock_id is not null then
    insert into private.notification_jobs (invitation_id, user_id)
    select new.id, member.user_id
    from public.flock_members as member
    where member.flock_id = new.flock_id
      and member.user_id <> new.created_by
    on conflict (invitation_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function private.enqueue_active_flock_invitations_for_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.notification_jobs (invitation_id, user_id)
  select invitation.id, new.user_id
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

create function private.enqueue_flock_event_notification(
  target_event_id uuid,
  activity_kind text,
  actor_user_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target_event public.flock_events;
  activity_id uuid;
begin
  if activity_kind not in ('created', 'updated', 'canceled') then
    raise check_violation using message = 'Unsupported flock event activity.';
  end if;

  select event.*
  into target_event
  from public.flock_events as event
  where event.id = target_event_id
    and event.flock_id is not null
    and event.starts_at >= clock_timestamp()
    and (
      (activity_kind = 'canceled' and event.canceled_at is not null)
      or (
        activity_kind in ('created', 'updated')
        and event.canceled_at is null
      )
    );

  if target_event.id is null then
    return;
  end if;

  insert into private.flock_event_notification_activities (
    event_id,
    flock_id,
    actor_user_id,
    kind
  )
  values (
    target_event.id,
    target_event.flock_id,
    actor_user_id,
    activity_kind
  )
  returning id into activity_id;

  insert into private.notification_jobs (event_activity_id, user_id)
  select activity_id, member.user_id
  from public.flock_members as member
  where member.flock_id = target_event.flock_id
    and member.user_id <> actor_user_id
  on conflict do nothing;
end;
$$;

create or replace function public.create_flock_event(
  target_flock_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns table (id uuid, flock_id uuid, created_by uuid, title text, starts_at timestamptz, location text, description text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  created_event public.flock_events;
begin
  if not exists (
    select 1 from public.flocks as flock
    where flock.id = target_flock_id
      and ((select private.is_superadmin()) or flock.owner_id = actor_user_id)
  ) then
    raise insufficient_privilege using message = 'Flock ownership is required.';
  end if;

  insert into public.flock_events (flock_id, created_by, title, starts_at, location, description)
  values (target_flock_id, actor_user_id, btrim(event_title), event_starts_at, btrim(event_location), btrim(event_description))
  returning * into created_event;

  perform private.enqueue_flock_event_notification(created_event.id, 'created', actor_user_id);

  return query select created_event.id, created_event.flock_id, created_event.created_by,
    created_event.title, created_event.starts_at, created_event.location,
    created_event.description, created_event.created_at;
end;
$$;

create or replace function public.update_flock_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns public.flock_events
language plpgsql security definer set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  previous_event public.flock_events;
  updated_event public.flock_events;
begin
  select event.*
  into previous_event
  from public.flock_events as event
  left join public.flocks as flock on flock.id = event.flock_id
  where event.id = target_event_id
    and ((select private.is_superadmin()) or event.created_by = actor_user_id or flock.owner_id = actor_user_id)
  for update of event;

  if previous_event.id is null then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;

  update public.flock_events
  set
    title = btrim(event_title),
    starts_at = event_starts_at,
    location = btrim(event_location),
    description = btrim(event_description)
  where id = target_event_id
  returning * into updated_event;

  if updated_event.flock_id is not null
    and (
      previous_event.title is distinct from updated_event.title
      or previous_event.starts_at is distinct from updated_event.starts_at
      or previous_event.location is distinct from updated_event.location
      or previous_event.description is distinct from updated_event.description
    )
  then
    perform private.enqueue_flock_event_notification(updated_event.id, 'updated', actor_user_id);
  end if;

  return updated_event;
end;
$$;

create or replace function public.cancel_flock_event(target_event_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  canceled_event public.flock_events;
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = actor_user_id or flock.owner_id = actor_user_id)
  ) then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;

  update public.flock_events
  set canceled_at = clock_timestamp()
  where id = target_event_id
    and canceled_at is null
  returning * into canceled_event;

  if canceled_event.id is not null and canceled_event.flock_id is not null then
    perform private.enqueue_flock_event_notification(canceled_event.id, 'canceled', actor_user_id);
  end if;
end;
$$;

create function public.claim_push_notification(target_job_id uuid)
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
  claimed_job private.notification_jobs;
  claimed_invitation private.event_invitations;
  claimed_activity private.flock_event_notification_activities;
  claimed_event public.flock_events;
  creator_name text;
  flock_name text;
  is_eligible boolean := false;
  push_title text;
  push_body text;
  push_path text;
  push_tag text;
  push_ttl integer;
begin
  select candidate.*
  into claimed_job
  from private.notification_jobs as candidate
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

  if claimed_job.invitation_id is not null then
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

    select profile.display_name
    into creator_name
    from public.profiles as profile
    where profile.user_id = claimed_event.created_by;

    push_title := 'New event invitation';
    push_body := format('%s invited you to %s.', coalesce(creator_name, 'A runner'), claimed_event.title);
    push_path := '/events#event-invitations';
    push_tag := format('event-invitation-%s', claimed_event.id);
    push_ttl := greatest(0, least(604800,
      floor(extract(epoch from claimed_invitation.expires_at - clock_timestamp()))::integer));
  else
    select activity.*
    into claimed_activity
    from private.flock_event_notification_activities as activity
    where activity.id = claimed_job.event_activity_id;

    select event.*
    into claimed_event
    from public.flock_events as event
    where event.id = claimed_activity.event_id;

    select flock.name
    into flock_name
    from public.flocks as flock
    where flock.id = claimed_activity.flock_id;

    is_eligible := claimed_activity.id is not null
      and claimed_event.id is not null
      and claimed_event.starts_at >= clock_timestamp()
      and claimed_job.user_id <> claimed_activity.actor_user_id
      and exists (
        select 1
        from public.flock_members as member
        where member.flock_id = claimed_activity.flock_id
          and member.user_id = claimed_job.user_id
      )
      and (
        (claimed_activity.kind = 'canceled' and claimed_event.canceled_at is not null)
        or (
          claimed_activity.kind in ('created', 'updated')
          and claimed_event.canceled_at is null
          and not exists (
            select 1
            from private.flock_event_notification_activities as newer_activity
            where newer_activity.event_id = claimed_activity.event_id
              and newer_activity.created_at > claimed_activity.created_at
          )
        )
      );

    push_title := case claimed_activity.kind
      when 'created' then 'New flock event'
      when 'updated' then 'Flock event updated'
      else 'Flock event canceled'
    end;
    push_body := case claimed_activity.kind
      when 'created' then format('%s added a new event: %s.', flock_name, claimed_event.title)
      when 'updated' then format('%s updated %s.', flock_name, claimed_event.title)
      else format('%s canceled %s.', flock_name, claimed_event.title)
    end;
    push_path := format('/flocks/%s#flock-events', claimed_activity.flock_id);
    push_tag := format('flock-event-%s', claimed_event.id);
    push_ttl := greatest(0, least(604800,
      floor(extract(epoch from claimed_event.starts_at - clock_timestamp()))::integer));
  end if;

  if is_eligible is not true then
    update private.notification_jobs
    set status = 'skipped', completed_at = clock_timestamp(), last_error = null
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
    update private.notification_jobs
    set status = 'waiting_for_subscription', completed_at = clock_timestamp(), last_error = null
    where id = claimed_job.id;
    return;
  end if;

  update private.notification_jobs
  set status = 'processing', processing_at = clock_timestamp(), completed_at = null, last_error = null
  where id = claimed_job.id;

  return query
  select
    claimed_job.id,
    subscription.id,
    subscription.endpoint,
    subscription.p256dh,
    subscription.auth_key,
    push_title,
    push_body,
    push_path,
    push_tag,
    push_ttl
  from private.push_subscriptions as subscription
  where subscription.user_id = claimed_job.user_id
    and (
      subscription.expiration_time is null
      or subscription.expiration_time > floor(extract(epoch from clock_timestamp()) * 1000)
    );
end;
$$;

create function public.complete_push_notification(
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
  from private.notification_jobs
  where id = target_job_id
    and status = 'processing'
  for update;

  if job_user_id is null then
    return;
  end if;

  delete from private.push_subscriptions
  where user_id = job_user_id
    and id = any(stale_subscription_ids);

  update private.notification_jobs
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

revoke execute on function private.enqueue_flock_event_notification(uuid, text, uuid)
from public, anon, authenticated;

revoke execute on function public.claim_push_notification(uuid)
from public, anon, authenticated;

revoke execute on function public.complete_push_notification(uuid, integer, uuid[], text)
from public, anon, authenticated;

grant execute on function public.claim_push_notification(uuid)
to service_role;

grant execute on function public.complete_push_notification(uuid, integer, uuid[], text)
to service_role;

drop function public.claim_event_invitation_notification(uuid);
drop function public.complete_event_invitation_notification(uuid, integer, uuid[], text);

comment on table private.flock_event_notification_activities is
  'Immutable flock-event changes that fan out to members present when the change occurs.';

comment on table private.notification_jobs is
  'Idempotent per-recipient Web Push jobs for invitations and flock-event activity.';

comment on function public.register_push_subscription(text, text, text, bigint) is
  'Registers the current browser subscription and requeues eligible waiting alerts for that user.';

comment on function public.claim_push_notification(uuid) is
  'Claims one eligible notification job and returns its current device subscriptions to the service role.';
