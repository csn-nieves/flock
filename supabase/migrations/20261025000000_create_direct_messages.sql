create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references public.profiles (user_id) on delete cascade,
  participant_two_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default clock_timestamp(),
  constraint direct_conversations_distinct_participants_check check (
    participant_one_id < participant_two_id
  ),
  constraint direct_conversations_participants_key unique (
    participant_one_id,
    participant_two_id
  )
);

create index direct_conversations_participant_two_idx
on public.direct_conversations (participant_two_id);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint direct_messages_body_check check (
    body = btrim(body)
    and char_length(body) between 1 and 2000
  )
);

create index direct_messages_conversation_created_id_idx
on public.direct_messages (conversation_id, created_at desc, id desc);

create index direct_messages_sender_idx
on public.direct_messages (sender_id);

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;

revoke all on table public.direct_conversations from anon, authenticated;
revoke all on table public.direct_messages from anon, authenticated;
grant select on table public.direct_conversations to authenticated;
grant select on table public.direct_messages to authenticated;

create function private.user_direct_conversation_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select conversation.id
  from public.direct_conversations as conversation
  where (select auth.uid()) in (
    conversation.participant_one_id,
    conversation.participant_two_id
  )
$$;

revoke execute on function private.user_direct_conversation_ids() from public;
grant execute on function private.user_direct_conversation_ids() to authenticated;

create policy "Participants can read direct conversations"
on public.direct_conversations
for select
to authenticated
using (id in (select private.user_direct_conversation_ids()));

create policy "Participants can read direct messages"
on public.direct_messages
for select
to authenticated
using (conversation_id in (select private.user_direct_conversation_ids()));

create or replace function private.visible_profile_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid())
  where (select auth.uid()) is not null

  union

  select target_membership.user_id
  from public.flock_members as viewer_membership
  join public.flock_members as target_membership
    on target_membership.flock_id = viewer_membership.flock_id
  where viewer_membership.user_id = (select auth.uid())

  union

  select
    case
      when conversation.participant_one_id = (select auth.uid())
        then conversation.participant_two_id
      else conversation.participant_one_id
    end
  from public.direct_conversations as conversation
  where (select auth.uid()) in (
    conversation.participant_one_id,
    conversation.participant_two_id
  )
$$;

create function public.list_my_direct_conversations()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    conversation.id as conversation_id,
    other_profile.user_id as other_user_id,
    other_profile.display_name as other_display_name
  from public.direct_conversations as conversation
  join public.profiles as other_profile
    on other_profile.user_id = case
      when conversation.participant_one_id = (select auth.uid())
        then conversation.participant_two_id
      else conversation.participant_one_id
    end
  where (select auth.uid()) in (
    conversation.participant_one_id,
    conversation.participant_two_id
  )
  order by lower(other_profile.display_name), conversation.id
$$;

create function public.get_or_create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  first_participant_id uuid;
  second_participant_id uuid;
  conversation_id uuid;
begin
  if actor_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;
  if target_user_id = actor_user_id then
    raise check_violation using message = 'Choose another runner.';
  end if;
  if not exists (
    select 1
    from public.profiles as profile
    where profile.user_id = target_user_id
  ) then
    raise no_data_found using message = 'Runner not found.';
  end if;

  first_participant_id := least(actor_user_id, target_user_id);
  second_participant_id := greatest(actor_user_id, target_user_id);

  insert into public.direct_conversations (
    participant_one_id,
    participant_two_id
  )
  values (first_participant_id, second_participant_id)
  on conflict (participant_one_id, participant_two_id) do update
  set participant_one_id = excluded.participant_one_id
  returning id into conversation_id;

  return conversation_id;
end;
$$;

create function public.list_direct_messages(
  target_conversation_id uuid,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size integer default 31
)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  sender_display_name text,
  body text,
  created_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    message.id,
    message.conversation_id,
    message.sender_id,
    profile.display_name as sender_display_name,
    message.body,
    message.created_at
  from public.direct_messages as message
  join public.profiles as profile
    on profile.user_id = message.sender_id
  where message.conversation_id = target_conversation_id
    and (
      before_created_at is null
      or (message.created_at, message.id) < (before_created_at, before_id)
    )
  order by message.created_at desc, message.id desc
  limit least(greatest(page_size, 1), 51)
$$;

create function public.send_direct_message(
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
begin
  if actor_user_id is null or not exists (
    select 1
    from public.direct_conversations as conversation
    where conversation.id = target_conversation_id
      and actor_user_id in (
        conversation.participant_one_id,
        conversation.participant_two_id
      )
  ) then
    raise insufficient_privilege using message = 'Conversation access is required.';
  end if;

  insert into public.direct_messages (conversation_id, sender_id, body)
  values (target_conversation_id, actor_user_id, btrim(message_body))
  returning * into created_message;

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

revoke execute on function public.list_my_direct_conversations() from public, anon;
revoke execute on function public.get_or_create_direct_conversation(uuid) from public, anon;
revoke execute on function public.list_direct_messages(uuid, timestamptz, uuid, integer) from public, anon;
revoke execute on function public.send_direct_message(uuid, text) from public, anon;
grant execute on function public.list_my_direct_conversations() to authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function public.list_direct_messages(uuid, timestamptz, uuid, integer) to authenticated;
grant execute on function public.send_direct_message(uuid, text) to authenticated;

alter publication supabase_realtime add table public.direct_messages;

comment on table public.direct_conversations is
  'Canonical participant pair for one private runner-to-runner conversation.';

comment on table public.direct_messages is
  'Persistent participant-only history for one direct conversation.';

comment on function public.get_or_create_direct_conversation(uuid) is
  'Returns the canonical direct conversation between the authenticated runner and another runner.';

comment on function public.list_direct_messages(uuid, timestamptz, uuid, integer) is
  'Returns one RLS-filtered reverse-chronological direct-message window for cursor-backed infinite scrolling.';

comment on function public.list_my_direct_conversations() is
  'Lists only direct conversations where the authenticated runner is a participant.';

comment on function public.send_direct_message(uuid, text) is
  'Creates a trimmed direct message while deriving and verifying the participant sender.';
