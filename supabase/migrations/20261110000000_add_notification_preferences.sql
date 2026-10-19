create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  event_invitations boolean not null default true,
  flock_events boolean not null default true,
  chat_messages boolean not null default true,
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.notification_preferences enable row level security;
revoke all on table public.notification_preferences from public, anon, authenticated;

create policy "Runners can read their notification preferences"
on public.notification_preferences
for select to authenticated
using (user_id = (select auth.uid()));

create policy "Runners can update their notification preferences"
on public.notification_preferences
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create function public.get_notification_preferences()
returns public.notification_preferences
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  preferences public.notification_preferences;
begin
  if current_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  insert into public.notification_preferences (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select * into preferences
  from public.notification_preferences
  where user_id = current_user_id;

  return preferences;
end;
$$;

create function public.update_notification_preferences(
  target_event_invitations boolean,
  target_flock_events boolean,
  target_chat_messages boolean
)
returns public.notification_preferences
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  preferences public.notification_preferences;
begin
  if current_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  insert into public.notification_preferences (
    user_id,
    event_invitations,
    flock_events,
    chat_messages,
    updated_at
  )
  values (
    current_user_id,
    target_event_invitations,
    target_flock_events,
    target_chat_messages,
    clock_timestamp()
  )
  on conflict (user_id) do update
  set
    event_invitations = excluded.event_invitations,
    flock_events = excluded.flock_events,
    chat_messages = excluded.chat_messages,
    updated_at = clock_timestamp()
  returning * into preferences;

  delete from private.notification_jobs as job
  where job.user_id = current_user_id
    and job.status in ('pending', 'waiting_for_subscription', 'failed')
    and (
      (not target_event_invitations and job.invitation_id is not null)
      or (not target_flock_events and job.event_activity_id is not null)
      or (not target_chat_messages and (
        job.flock_message_id is not null or job.direct_message_id is not null
      ))
    );

  return preferences;
end;
$$;

create function private.notification_kind_enabled(
  target_user_id uuid,
  target_kind text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case target_kind
    when 'event_invitation' then coalesce(preferences.event_invitations, true)
    when 'flock_event' then coalesce(preferences.flock_events, true)
    when 'flock_message' then coalesce(preferences.chat_messages, true)
    when 'direct_message' then coalesce(preferences.chat_messages, true)
    else true
  end
  from public.notification_preferences as preferences
  where preferences.user_id = target_user_id;
$$;

create or replace function private.insert_in_app_notification(
  target_user_id uuid,
  target_kind text,
  target_title text,
  target_body text,
  target_path text,
  target_source_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.notification_kind_enabled(target_user_id, target_kind) then
    return;
  end if;

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
end;
$$;

revoke execute on function public.get_notification_preferences() from public, anon;
revoke execute on function public.update_notification_preferences(boolean, boolean, boolean) from public, anon;
grant execute on function public.get_notification_preferences() to authenticated;
grant execute on function public.update_notification_preferences(boolean, boolean, boolean) to authenticated;

revoke all on function private.notification_kind_enabled(uuid, text) from public, anon, authenticated;
revoke all on function private.insert_in_app_notification(uuid, text, text, text, text, uuid) from public, anon, authenticated;

comment on table public.notification_preferences is
  'Runner-owned categories controlling in-app notification fan-out.';

create or replace function private.fan_out_invitation_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row public.flock_events;
  creator_name text;
  member_row public.flock_members;
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
    for member_row in
      select member.*
      from public.flock_members as member
      where member.flock_id = new.flock_id
        and member.user_id <> new.created_by
    loop
      perform private.insert_in_app_notification(
        member_row.user_id,
        'event_invitation',
        'New event invitation',
        format('%s invited your flock to %s.', coalesce(creator_name, 'A runner'), event_row.title),
        '/events#event-invitations',
        new.id
      );
    end loop;
  end if;

  return new;
end;
$$;

create or replace function private.fan_out_flock_event_notification()
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
  member_row public.flock_members;
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

  for member_row in
    select member.*
    from public.flock_members as member
    where member.flock_id = new.flock_id
      and member.user_id <> new.actor_user_id
  loop
    perform private.insert_in_app_notification(
      member_row.user_id,
      'flock_event',
      notification_title,
      notification_body,
      format('/flocks/%s#flock-events', new.flock_id),
      new.id
    );
  end loop;

  return new;
end;
$$;

create or replace function private.fan_out_flock_message_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
  flock_name text;
  member_row public.flock_members;
begin
  select profile.display_name into sender_name
  from public.profiles as profile
  where profile.user_id = new.sender_id;

  select flock.name into flock_name
  from public.flocks as flock
  where flock.id = new.flock_id;

  for member_row in
    select member.*
    from public.flock_members as member
    where member.flock_id = new.flock_id
      and member.user_id <> new.sender_id
  loop
    perform private.insert_in_app_notification(
      member_row.user_id,
      'flock_message',
      format('New message in %s', flock_name),
      format('%s: %s', coalesce(sender_name, 'A runner'), left(new.body, 320)),
      format('/chats/%s', new.flock_id),
      new.id
    );
  end loop;

  return new;
end;
$$;

create function private.filter_notification_job_by_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind text;
begin
  target_kind := case
    when new.invitation_id is not null then 'event_invitation'
    when new.event_activity_id is not null then 'flock_event'
    when new.flock_message_id is not null then 'flock_message'
    when new.direct_message_id is not null then 'direct_message'
    else null
  end;

  if target_kind is not null
    and not private.notification_kind_enabled(new.user_id, target_kind)
  then
    return null;
  end if;

  return new;
end;
$$;

create trigger filter_notification_job_by_preferences
before insert on private.notification_jobs
for each row execute function private.filter_notification_job_by_preferences();

revoke all on function private.filter_notification_job_by_preferences() from public, anon, authenticated;
