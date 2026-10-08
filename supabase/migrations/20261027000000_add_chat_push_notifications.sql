alter table private.notification_jobs
drop constraint notification_jobs_one_source_check;

alter table private.notification_jobs
add column flock_message_id uuid references public.flock_messages (id) on delete cascade;

alter table private.notification_jobs
add column direct_message_id uuid references public.direct_messages (id) on delete cascade;

alter table private.notification_jobs
add constraint notification_jobs_one_source_check check (
  num_nonnulls(
    invitation_id,
    event_activity_id,
    flock_message_id,
    direct_message_id
  ) = 1
);

create unique index notification_jobs_flock_message_user_idx
on private.notification_jobs (flock_message_id, user_id)
where flock_message_id is not null;

create unique index notification_jobs_direct_message_user_idx
on private.notification_jobs (direct_message_id, user_id)
where direct_message_id is not null;

create or replace function public.send_flock_message(
  target_flock_id uuid,
  message_body text
)
returns table (
  id uuid,
  flock_id uuid,
  sender_id uuid,
  sender_display_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  created_message public.flock_messages;
begin
  if actor_user_id is null or not exists (
    select 1
    from public.flock_members as membership
    where membership.flock_id = target_flock_id
      and membership.user_id = actor_user_id
  ) then
    raise insufficient_privilege using message = 'Flock membership is required.';
  end if;

  insert into public.flock_messages (flock_id, sender_id, body)
  values (target_flock_id, actor_user_id, btrim(message_body))
  returning * into created_message;

  insert into private.notification_jobs (flock_message_id, user_id)
  select created_message.id, membership.user_id
  from public.flock_members as membership
  where membership.flock_id = target_flock_id
    and membership.user_id <> actor_user_id
    and exists (
      select 1
      from private.push_subscriptions as subscription
      where subscription.user_id = membership.user_id
        and (
          subscription.expiration_time is null
          or subscription.expiration_time > floor(
            extract(epoch from clock_timestamp()) * 1000
          )
        )
    )
  on conflict do nothing;

  return query
  select
    created_message.id,
    created_message.flock_id,
    created_message.sender_id,
    profile.display_name,
    created_message.body,
    created_message.created_at
  from public.profiles as profile
  where profile.user_id = created_message.sender_id;
end;
$$;

create or replace function public.send_direct_message(
  target_conversation_id uuid,
  message_body text
)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  sender_display_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  created_message public.direct_messages;
  target_conversation public.direct_conversations;
  recipient_user_id uuid;
begin
  select conversation.*
  into target_conversation
  from public.direct_conversations as conversation
  where conversation.id = target_conversation_id
    and actor_user_id in (
      conversation.participant_one_id,
      conversation.participant_two_id
    );

  if actor_user_id is null or target_conversation.id is null then
    raise insufficient_privilege using message = 'Conversation access is required.';
  end if;

  recipient_user_id := case
    when target_conversation.participant_one_id = actor_user_id
      then target_conversation.participant_two_id
    else target_conversation.participant_one_id
  end;

  insert into public.direct_messages (conversation_id, sender_id, body)
  values (target_conversation_id, actor_user_id, btrim(message_body))
  returning * into created_message;

  if exists (
    select 1
    from private.push_subscriptions as subscription
    where subscription.user_id = recipient_user_id
      and (
        subscription.expiration_time is null
        or subscription.expiration_time > floor(
          extract(epoch from clock_timestamp()) * 1000
        )
      )
  ) then
    insert into private.notification_jobs (direct_message_id, user_id)
    values (created_message.id, recipient_user_id)
    on conflict do nothing;
  end if;

  return query
  select
    created_message.id,
    created_message.conversation_id,
    created_message.sender_id,
    profile.display_name,
    created_message.body,
    created_message.created_at
  from public.profiles as profile
  where profile.user_id = created_message.sender_id;
end;
$$;

create or replace function public.claim_push_notification(target_job_id uuid)
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
  claimed_flock_message public.flock_messages;
  claimed_direct_message public.direct_messages;
  claimed_direct_conversation public.direct_conversations;
  creator_name text;
  flock_name text;
  sender_name text;
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
    push_body := format(
      '%s invited you to %s.',
      coalesce(creator_name, 'A runner'),
      claimed_event.title
    );
    push_path := '/events#event-invitations';
    push_tag := format('event-invitation-%s', claimed_event.id);
    push_ttl := greatest(
      0,
      least(
        604800,
        floor(
          extract(epoch from claimed_invitation.expires_at - clock_timestamp())
        )::integer
      )
    );
  elsif claimed_job.event_activity_id is not null then
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
    push_ttl := greatest(
      0,
      least(
        604800,
        floor(
          extract(epoch from claimed_event.starts_at - clock_timestamp())
        )::integer
      )
    );
  elsif claimed_job.flock_message_id is not null then
    select message.*
    into claimed_flock_message
    from public.flock_messages as message
    where message.id = claimed_job.flock_message_id;

    select flock.name
    into flock_name
    from public.flocks as flock
    where flock.id = claimed_flock_message.flock_id;

    select profile.display_name
    into sender_name
    from public.profiles as profile
    where profile.user_id = claimed_flock_message.sender_id;

    is_eligible := claimed_flock_message.id is not null
      and claimed_job.user_id <> claimed_flock_message.sender_id
      and exists (
        select 1
        from public.flock_members as member
        where member.flock_id = claimed_flock_message.flock_id
          and member.user_id = claimed_job.user_id
          and member.joined_at <= claimed_flock_message.created_at
      )
      and not exists (
        select 1
        from public.flock_chat_reads as read_cursor
        where read_cursor.flock_id = claimed_flock_message.flock_id
          and read_cursor.user_id = claimed_job.user_id
          and (
            read_cursor.last_read_created_at,
            read_cursor.last_read_message_id
          ) >= (
            claimed_flock_message.created_at,
            claimed_flock_message.id
          )
      )
      and not exists (
        select 1
        from public.flock_messages as newer_message
        where newer_message.flock_id = claimed_flock_message.flock_id
          and newer_message.sender_id <> claimed_job.user_id
          and (newer_message.created_at, newer_message.id) > (
            claimed_flock_message.created_at,
            claimed_flock_message.id
          )
      );

    push_title := format('New message in %s', flock_name);
    push_body := format('%s sent a message.', coalesce(sender_name, 'A runner'));
    push_path := format('/chats/%s', claimed_flock_message.flock_id);
    push_tag := format('flock-chat-%s', claimed_flock_message.flock_id);
    push_ttl := 86400;
  else
    select message.*
    into claimed_direct_message
    from public.direct_messages as message
    where message.id = claimed_job.direct_message_id;

    select conversation.*
    into claimed_direct_conversation
    from public.direct_conversations as conversation
    where conversation.id = claimed_direct_message.conversation_id;

    select profile.display_name
    into sender_name
    from public.profiles as profile
    where profile.user_id = claimed_direct_message.sender_id;

    is_eligible := claimed_direct_message.id is not null
      and claimed_job.user_id <> claimed_direct_message.sender_id
      and claimed_job.user_id in (
        claimed_direct_conversation.participant_one_id,
        claimed_direct_conversation.participant_two_id
      )
      and not exists (
        select 1
        from public.direct_conversation_reads as read_cursor
        where read_cursor.conversation_id = claimed_direct_message.conversation_id
          and read_cursor.user_id = claimed_job.user_id
          and (
            read_cursor.last_read_created_at,
            read_cursor.last_read_message_id
          ) >= (
            claimed_direct_message.created_at,
            claimed_direct_message.id
          )
      )
      and not exists (
        select 1
        from public.direct_messages as newer_message
        where newer_message.conversation_id = claimed_direct_message.conversation_id
          and newer_message.sender_id <> claimed_job.user_id
          and (newer_message.created_at, newer_message.id) > (
            claimed_direct_message.created_at,
            claimed_direct_message.id
          )
      );

    push_title := 'New direct message';
    push_body := format('%s sent you a message.', coalesce(sender_name, 'A runner'));
    push_path := format(
      '/chats/direct/%s',
      claimed_direct_message.conversation_id
    );
    push_tag := format(
      'direct-chat-%s',
      claimed_direct_message.conversation_id
    );
    push_ttl := 86400;
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
        or subscription.expiration_time > floor(
          extract(epoch from clock_timestamp()) * 1000
        )
      )
  ) then
    update private.notification_jobs
    set
      status = 'waiting_for_subscription',
      completed_at = clock_timestamp(),
      last_error = null
    where id = claimed_job.id;
    return;
  end if;

  update private.notification_jobs
  set
    status = 'processing',
    processing_at = clock_timestamp(),
    completed_at = null,
    last_error = null
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
      or subscription.expiration_time > floor(
        extract(epoch from clock_timestamp()) * 1000
      )
    );
end;
$$;

comment on table private.notification_jobs is
  'Idempotent per-recipient Web Push jobs for invitations, flock-event activity, and unread chat messages.';

comment on function public.send_flock_message(uuid, text) is
  'Creates a trimmed flock message and queues privacy-conscious alerts for subscribed current members other than the sender.';

comment on function public.send_direct_message(uuid, text) is
  'Creates a trimmed direct message and queues a privacy-conscious alert for a subscribed other participant.';

comment on function public.claim_push_notification(uuid) is
  'Claims one eligible notification job after rechecking event or chat access, unread state, and current device subscriptions.';
