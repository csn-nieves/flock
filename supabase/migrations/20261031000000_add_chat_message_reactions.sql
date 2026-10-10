create table public.chat_message_reactions (
  id uuid primary key default gen_random_uuid(),
  flock_message_id uuid references public.flock_messages (id) on delete cascade,
  direct_message_id uuid references public.direct_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  reaction_key text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint chat_message_reactions_one_source_check check (
    num_nonnulls(flock_message_id, direct_message_id) = 1
  ),
  constraint chat_message_reactions_key_check check (
    reaction_key in ('thumbs_up', 'heart', 'laugh', 'celebrate', 'fire', 'eyes')
  )
);

create unique index chat_message_reactions_flock_unique_idx
on public.chat_message_reactions (flock_message_id, user_id, reaction_key)
where flock_message_id is not null;

create unique index chat_message_reactions_direct_unique_idx
on public.chat_message_reactions (direct_message_id, user_id, reaction_key)
where direct_message_id is not null;

create index chat_message_reactions_flock_idx
on public.chat_message_reactions (flock_message_id, reaction_key)
where flock_message_id is not null;

create index chat_message_reactions_direct_idx
on public.chat_message_reactions (direct_message_id, reaction_key)
where direct_message_id is not null;

alter table public.chat_message_reactions enable row level security;
revoke all on table public.chat_message_reactions from anon, authenticated;
grant select on table public.chat_message_reactions to authenticated;

create policy "Members can read flock message reactions"
on public.chat_message_reactions
for select
to authenticated
using (
  flock_message_id is not null
  and exists (
    select 1
    from public.flock_messages as message
    where message.id = chat_message_reactions.flock_message_id
      and message.flock_id in (select private.user_flock_ids())
  )
);

create policy "Participants can read direct message reactions"
on public.chat_message_reactions
for select
to authenticated
using (
  direct_message_id is not null
  and exists (
    select 1
    from public.direct_messages as message
    where message.id = chat_message_reactions.direct_message_id
      and message.conversation_id in (select private.user_direct_conversation_ids())
  )
);

create function public.toggle_flock_message_reaction(
  target_message_id uuid,
  target_reaction_key text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  existing_id uuid;
begin
  if target_reaction_key not in ('thumbs_up', 'heart', 'laugh', 'celebrate', 'fire', 'eyes') then
    raise check_violation using message = 'Unsupported reaction.';
  end if;

  if actor_user_id is null or not exists (
    select 1
    from public.flock_messages as message
    join public.flock_members as membership on membership.flock_id = message.flock_id
    where message.id = target_message_id
      and membership.user_id = actor_user_id
  ) then
    raise insufficient_privilege using message = 'Flock membership is required.';
  end if;

  select reaction.id into existing_id
  from public.chat_message_reactions as reaction
  where reaction.flock_message_id = target_message_id
    and reaction.user_id = actor_user_id
    and reaction.reaction_key = target_reaction_key
  for update;

  if existing_id is null then
    insert into public.chat_message_reactions (
      flock_message_id,
      user_id,
      reaction_key
    )
    values (target_message_id, actor_user_id, target_reaction_key);
    return true;
  end if;

  delete from public.chat_message_reactions where id = existing_id;
  return false;
end;
$$;

create function public.toggle_direct_message_reaction(
  target_message_id uuid,
  target_reaction_key text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  existing_id uuid;
begin
  if target_reaction_key not in ('thumbs_up', 'heart', 'laugh', 'celebrate', 'fire', 'eyes') then
    raise check_violation using message = 'Unsupported reaction.';
  end if;

  if actor_user_id is null or not exists (
    select 1
    from public.direct_messages as message
    join public.direct_conversations as conversation
      on conversation.id = message.conversation_id
    where message.id = target_message_id
      and actor_user_id in (
        conversation.participant_one_id,
        conversation.participant_two_id
      )
  ) then
    raise insufficient_privilege using message = 'Conversation access is required.';
  end if;

  select reaction.id into existing_id
  from public.chat_message_reactions as reaction
  where reaction.direct_message_id = target_message_id
    and reaction.user_id = actor_user_id
    and reaction.reaction_key = target_reaction_key
  for update;

  if existing_id is null then
    insert into public.chat_message_reactions (
      direct_message_id,
      user_id,
      reaction_key
    )
    values (target_message_id, actor_user_id, target_reaction_key);
    return true;
  end if;

  delete from public.chat_message_reactions where id = existing_id;
  return false;
end;
$$;

revoke execute on function public.toggle_flock_message_reaction(uuid, text)
from public, anon;
revoke execute on function public.toggle_direct_message_reaction(uuid, text)
from public, anon;
grant execute on function public.toggle_flock_message_reaction(uuid, text)
to authenticated;
grant execute on function public.toggle_direct_message_reaction(uuid, text)
to authenticated;

alter table public.chat_message_reactions replica identity full;
alter publication supabase_realtime add table public.chat_message_reactions;

comment on table public.chat_message_reactions is
  'Small, server-authorized reactions for flock and direct chat messages.';
