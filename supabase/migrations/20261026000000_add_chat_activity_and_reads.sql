create table public.flock_chat_reads (
  flock_id uuid not null,
  user_id uuid not null,
  last_read_message_id uuid not null,
  last_read_created_at timestamptz not null,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (flock_id, user_id),
  constraint flock_chat_reads_membership_fkey
    foreign key (flock_id, user_id)
    references public.flock_members (flock_id, user_id)
    on delete cascade
);

create index flock_chat_reads_user_idx
on public.flock_chat_reads (user_id);

create table public.direct_conversation_reads (
  conversation_id uuid not null references public.direct_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  last_read_message_id uuid not null,
  last_read_created_at timestamptz not null,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (conversation_id, user_id)
);

create index direct_conversation_reads_user_idx
on public.direct_conversation_reads (user_id);

alter table public.flock_chat_reads enable row level security;
alter table public.direct_conversation_reads enable row level security;

revoke all on table public.flock_chat_reads from anon, authenticated;
revoke all on table public.direct_conversation_reads from anon, authenticated;
grant select on table public.flock_chat_reads to authenticated;
grant select on table public.direct_conversation_reads to authenticated;

create policy "Runners can read their flock chat cursors"
on public.flock_chat_reads
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Runners can read their direct conversation cursors"
on public.direct_conversation_reads
for select
to authenticated
using (user_id = (select auth.uid()));

drop function public.list_my_flock_chats();

create function public.list_my_flock_chats()
returns table (
  flock_id uuid,
  flock_name text,
  latest_message_body text,
  latest_message_created_at timestamptz,
  latest_sender_id uuid,
  latest_sender_display_name text,
  unread_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    flock.id as flock_id,
    flock.name as flock_name,
    latest_message.body as latest_message_body,
    latest_message.created_at as latest_message_created_at,
    latest_message.sender_id as latest_sender_id,
    latest_message.sender_display_name as latest_sender_display_name,
    coalesce(unread.unread_count, 0)::integer as unread_count
  from public.flock_members as membership
  join public.flocks as flock
    on flock.id = membership.flock_id
  left join public.flock_chat_reads as read_cursor
    on read_cursor.flock_id = membership.flock_id
    and read_cursor.user_id = membership.user_id
  left join lateral (
    select
      message.body,
      message.created_at,
      message.sender_id,
      profile.display_name as sender_display_name
    from public.flock_messages as message
    join public.profiles as profile
      on profile.user_id = message.sender_id
    where message.flock_id = membership.flock_id
    order by message.created_at desc, message.id desc
    limit 1
  ) as latest_message on true
  left join lateral (
    select count(*) as unread_count
    from public.flock_messages as message
    where message.flock_id = membership.flock_id
      and message.sender_id <> membership.user_id
      and (
        (
          read_cursor.last_read_message_id is not null
          and (message.created_at, message.id) > (
            read_cursor.last_read_created_at,
            read_cursor.last_read_message_id
          )
        )
        or (
          read_cursor.last_read_message_id is null
          and message.created_at > membership.joined_at
        )
      )
  ) as unread on true
  where membership.user_id = (select auth.uid())
  order by latest_message.created_at desc nulls last, lower(flock.name), flock.id
$$;

drop function public.list_my_direct_conversations();

create function public.list_my_direct_conversations()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_display_name text,
  latest_message_body text,
  latest_message_created_at timestamptz,
  latest_sender_id uuid,
  latest_sender_display_name text,
  unread_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    conversation.id as conversation_id,
    other_profile.user_id as other_user_id,
    other_profile.display_name as other_display_name,
    latest_message.body as latest_message_body,
    latest_message.created_at as latest_message_created_at,
    latest_message.sender_id as latest_sender_id,
    latest_message.sender_display_name as latest_sender_display_name,
    coalesce(unread.unread_count, 0)::integer as unread_count
  from public.direct_conversations as conversation
  join public.profiles as other_profile
    on other_profile.user_id = case
      when conversation.participant_one_id = (select auth.uid())
        then conversation.participant_two_id
      else conversation.participant_one_id
    end
  left join public.direct_conversation_reads as read_cursor
    on read_cursor.conversation_id = conversation.id
    and read_cursor.user_id = (select auth.uid())
  left join lateral (
    select
      message.body,
      message.created_at,
      message.sender_id,
      profile.display_name as sender_display_name
    from public.direct_messages as message
    join public.profiles as profile
      on profile.user_id = message.sender_id
    where message.conversation_id = conversation.id
    order by message.created_at desc, message.id desc
    limit 1
  ) as latest_message on true
  left join lateral (
    select count(*) as unread_count
    from public.direct_messages as message
    where message.conversation_id = conversation.id
      and message.sender_id <> (select auth.uid())
      and (
        (
          read_cursor.last_read_message_id is not null
          and (message.created_at, message.id) > (
            read_cursor.last_read_created_at,
            read_cursor.last_read_message_id
          )
        )
        or (
          read_cursor.last_read_message_id is null
          and message.created_at > conversation.created_at
        )
      )
  ) as unread on true
  where (select auth.uid()) in (
    conversation.participant_one_id,
    conversation.participant_two_id
  )
  order by latest_message.created_at desc nulls last,
    lower(other_profile.display_name),
    conversation.id
$$;

create function public.mark_flock_chat_read(
  target_flock_id uuid,
  target_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  target_message public.flock_messages;
begin
  if actor_user_id is null or not exists (
    select 1
    from public.flock_members as membership
    where membership.flock_id = target_flock_id
      and membership.user_id = actor_user_id
  ) then
    raise insufficient_privilege using message = 'Flock membership is required.';
  end if;

  select message.*
  into target_message
  from public.flock_messages as message
  where message.id = target_message_id
    and message.flock_id = target_flock_id;

  if not found then
    raise no_data_found using message = 'Flock message not found.';
  end if;

  insert into public.flock_chat_reads (
    flock_id,
    user_id,
    last_read_message_id,
    last_read_created_at
  )
  values (
    target_flock_id,
    actor_user_id,
    target_message.id,
    target_message.created_at
  )
  on conflict (flock_id, user_id) do update
  set
    last_read_message_id = excluded.last_read_message_id,
    last_read_created_at = excluded.last_read_created_at,
    updated_at = clock_timestamp()
  where (
    public.flock_chat_reads.last_read_created_at,
    public.flock_chat_reads.last_read_message_id
  ) < (
    excluded.last_read_created_at,
    excluded.last_read_message_id
  );
end;
$$;

create function public.mark_direct_conversation_read(
  target_conversation_id uuid,
  target_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  target_message public.direct_messages;
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

  select message.*
  into target_message
  from public.direct_messages as message
  where message.id = target_message_id
    and message.conversation_id = target_conversation_id;

  if not found then
    raise no_data_found using message = 'Direct message not found.';
  end if;

  insert into public.direct_conversation_reads (
    conversation_id,
    user_id,
    last_read_message_id,
    last_read_created_at
  )
  values (
    target_conversation_id,
    actor_user_id,
    target_message.id,
    target_message.created_at
  )
  on conflict (conversation_id, user_id) do update
  set
    last_read_message_id = excluded.last_read_message_id,
    last_read_created_at = excluded.last_read_created_at,
    updated_at = clock_timestamp()
  where (
    public.direct_conversation_reads.last_read_created_at,
    public.direct_conversation_reads.last_read_message_id
  ) < (
    excluded.last_read_created_at,
    excluded.last_read_message_id
  );
end;
$$;

revoke execute on function public.list_my_flock_chats() from public, anon;
revoke execute on function public.list_my_direct_conversations() from public, anon;
revoke execute on function public.mark_flock_chat_read(uuid, uuid) from public, anon;
revoke execute on function public.mark_direct_conversation_read(uuid, uuid) from public, anon;
grant execute on function public.list_my_flock_chats() to authenticated;
grant execute on function public.list_my_direct_conversations() to authenticated;
grant execute on function public.mark_flock_chat_read(uuid, uuid) to authenticated;
grant execute on function public.mark_direct_conversation_read(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.flock_chat_reads;
alter publication supabase_realtime add table public.direct_conversation_reads;

comment on table public.flock_chat_reads is
  'Per-runner, server-backed read cursor for each current flock membership.';

comment on table public.direct_conversation_reads is
  'Per-participant, server-backed read cursor for each direct conversation.';

comment on function public.list_my_flock_chats() is
  'Lists current flock chats by recent activity with latest-message context and unread counts after the runner read cursor or join time.';

comment on function public.list_my_direct_conversations() is
  'Lists participant-only direct conversations by recent activity with latest-message context and unread counts.';

comment on function public.mark_flock_chat_read(uuid, uuid) is
  'Advances the authenticated flock member read cursor monotonically to a verified message in that flock.';

comment on function public.mark_direct_conversation_read(uuid, uuid) is
  'Advances the authenticated participant read cursor monotonically to a verified message in that direct conversation.';
