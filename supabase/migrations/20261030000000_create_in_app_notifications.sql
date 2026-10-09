create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  path text not null,
  source_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  read_at timestamptz,
  constraint notifications_kind_check check (
    kind in ('event_invitation', 'flock_event', 'flock_message', 'direct_message')
  ),
  constraint notifications_title_check check (char_length(btrim(title)) between 1 and 160),
  constraint notifications_body_check check (char_length(btrim(body)) between 1 and 500),
  constraint notifications_path_check check (path like '/%'),
  unique (user_id, kind, source_id)
);

create index notifications_user_created_idx
on public.notifications (user_id, created_at desc, id desc);

create index notifications_user_unread_idx
on public.notifications (user_id, created_at desc)
where read_at is null;

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;

create policy "Runners can read their notifications"
on public.notifications
for select
to authenticated
using (user_id = (select auth.uid()));

create function public.mark_notification_read(target_notification_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.notifications
  set read_at = coalesce(read_at, clock_timestamp())
  where id = target_notification_id
    and user_id = (select auth.uid());
$$;

create function public.mark_all_notifications_read()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.notifications
  set read_at = coalesce(read_at, clock_timestamp())
  where user_id = (select auth.uid())
    and read_at is null;
$$;

revoke execute on function public.mark_notification_read(uuid)
from public, anon;
revoke execute on function public.mark_all_notifications_read()
from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;

create function private.insert_in_app_notification(
  target_user_id uuid,
  target_kind text,
  target_title text,
  target_body text,
  target_path text,
  target_source_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, path, source_id)
  values (
    target_user_id,
    target_kind,
    btrim(target_title),
    btrim(target_body),
    target_path,
    target_source_id
  )
  on conflict (user_id, kind, source_id) do nothing;
$$;

create function private.fan_out_invitation_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row public.flock_events;
  creator_name text;
begin
  select event.* into event_row
  from public.flock_events as event
  where event.id = new.event_id;

  select profile.display_name into creator_name
  from public.profiles as profile
  where profile.user_id = new.created_by;

  if new.recipient_user_id is not null then
    perform private.insert_in_app_notification(
      new.recipient_user_id,
      'event_invitation',
      'New event invitation',
      format('%s invited you to %s.', coalesce(creator_name, 'A runner'), event_row.title),
      '/events#event-invitations',
      new.id
    );
  elsif new.flock_id is not null then
    insert into public.notifications (user_id, kind, title, body, path, source_id)
    select
      member.user_id,
      'event_invitation',
      'New event invitation',
      format('%s invited your flock to %s.', coalesce(creator_name, 'A runner'), event_row.title),
      '/events#event-invitations',
      new.id
    from public.flock_members as member
    where member.flock_id = new.flock_id
      and member.user_id <> new.created_by
    on conflict (user_id, kind, source_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger fan_out_in_app_invitation_notification
after insert on private.event_invitations
for each row execute function private.fan_out_invitation_notification();

create function private.fan_out_active_invitation_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_row private.event_invitations;
  event_title text;
  creator_name text;
begin
  select invitation.* into invitation_row
  from private.event_invitations as invitation
  join public.flock_events as event on event.id = invitation.event_id
  where invitation.flock_id = new.flock_id
    and invitation.expires_at > clock_timestamp()
    and event.starts_at >= clock_timestamp()
    and event.canceled_at is null
    and invitation.created_by <> new.user_id
    and not exists (
      select 1
      from private.event_invitation_acceptances as acceptance
      where acceptance.invitation_id = invitation.id
        and acceptance.user_id = new.user_id
    )
  order by invitation.created_at desc
  limit 1;

  if invitation_row.id is null then return new; end if;

  select event.title into event_title
  from public.flock_events as event
  where event.id = invitation_row.event_id;
  select profile.display_name into creator_name
  from public.profiles as profile
  where profile.user_id = invitation_row.created_by;

  perform private.insert_in_app_notification(
    new.user_id,
    'event_invitation',
    'New event invitation',
    format('%s invited your flock to %s.', coalesce(creator_name, 'A runner'), event_title),
    '/events#event-invitations',
    invitation_row.id
  );
  return new;
end;
$$;

create trigger fan_out_active_in_app_invitation_notification
after insert on public.flock_members
for each row execute function private.fan_out_active_invitation_notification();

create function private.fan_out_flock_event_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_title text;
  flock_name text;
  notification_title text;
  notification_body text;
begin
  select event.title, flock.name
  into event_title, flock_name
  from public.flock_events as event
  join public.flocks as flock on flock.id = new.flock_id
  where event.id = new.event_id;

  notification_title := case new.kind
    when 'created' then 'New flock event'
    when 'updated' then 'Flock event updated'
    else 'Flock event canceled'
  end;
  notification_body := case new.kind
    when 'created' then format('%s added a new event: %s.', flock_name, event_title)
    when 'updated' then format('%s updated %s.', flock_name, event_title)
    else format('%s canceled %s.', flock_name, event_title)
  end;

  insert into public.notifications (user_id, kind, title, body, path, source_id)
  select
    member.user_id,
    'flock_event',
    notification_title,
    notification_body,
    format('/flocks/%s#flock-events', new.flock_id),
    new.id
  from public.flock_members as member
  where member.flock_id = new.flock_id
    and member.user_id <> new.actor_user_id
  on conflict (user_id, kind, source_id) do nothing;

  return new;
end;
$$;

create trigger fan_out_in_app_flock_event_notification
after insert on private.flock_event_notification_activities
for each row execute function private.fan_out_flock_event_notification();

create function private.fan_out_flock_message_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
  flock_name text;
begin
  select profile.display_name into sender_name
  from public.profiles as profile
  where profile.user_id = new.sender_id;

  select flock.name into flock_name
  from public.flocks as flock
  where flock.id = new.flock_id;

  insert into public.notifications (user_id, kind, title, body, path, source_id)
  select
    member.user_id,
    'flock_message',
    format('New message in %s', flock_name),
    format('%s: %s', coalesce(sender_name, 'A runner'), left(new.body, 320)),
    format('/chats/%s', new.flock_id),
    new.id
  from public.flock_members as member
  where member.flock_id = new.flock_id
    and member.user_id <> new.sender_id
  on conflict (user_id, kind, source_id) do nothing;

  return new;
end;
$$;

create trigger fan_out_in_app_flock_message_notification
after insert on public.flock_messages
for each row execute function private.fan_out_flock_message_notification();

create function private.fan_out_direct_message_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  select case
    when conversation.participant_one_id = new.sender_id then conversation.participant_two_id
    else conversation.participant_one_id
  end
  into recipient_id
  from public.direct_conversations as conversation
  where conversation.id = new.conversation_id;

  select profile.display_name into sender_name
  from public.profiles as profile
  where profile.user_id = new.sender_id;

  if recipient_id is not null then
    perform private.insert_in_app_notification(
      recipient_id,
      'direct_message',
      'New direct message',
      format('%s: %s', coalesce(sender_name, 'A runner'), left(new.body, 320)),
      format('/chats/direct/%s', new.conversation_id),
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger fan_out_in_app_direct_message_notification
after insert on public.direct_messages
for each row execute function private.fan_out_direct_message_notification();

alter publication supabase_realtime add table public.notifications;

revoke all on function private.insert_in_app_notification(uuid, text, text, text, text, uuid)
from public, anon, authenticated;
revoke all on function private.fan_out_invitation_notification()
from public, anon, authenticated;
revoke all on function private.fan_out_active_invitation_notification()
from public, anon, authenticated;
revoke all on function private.fan_out_flock_event_notification()
from public, anon, authenticated;
revoke all on function private.fan_out_flock_message_notification()
from public, anon, authenticated;
revoke all on function private.fan_out_direct_message_notification()
from public, anon, authenticated;

comment on table public.notifications is
  'Durable, per-runner in-app alerts. Push delivery jobs remain private and separate.';
