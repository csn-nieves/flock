create table public.flock_messages (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks (id) on delete cascade,
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint flock_messages_body_check check (
    body = btrim(body)
    and char_length(body) between 1 and 2000
  )
);

create index flock_messages_flock_created_id_idx
on public.flock_messages (flock_id, created_at desc, id desc);

alter table public.flock_messages enable row level security;

revoke all on table public.flock_messages from anon, authenticated;
grant select on table public.flock_messages to authenticated;

create policy "Members can read flock messages"
on public.flock_messages
for select
to authenticated
using (flock_id in (select private.user_flock_ids()));

create function public.list_my_flock_chats()
returns table (
  flock_id uuid,
  flock_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    flock.id as flock_id,
    flock.name as flock_name
  from public.flock_members as membership
  join public.flocks as flock
    on flock.id = membership.flock_id
  where membership.user_id = (select auth.uid())
  order by flock.name, flock.id
$$;

create function public.list_flock_messages(
  target_flock_id uuid,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size integer default 31
)
returns table (
  id uuid,
  flock_id uuid,
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
    message.flock_id,
    message.sender_id,
    profile.display_name as sender_display_name,
    message.body,
    message.created_at
  from public.flock_messages as message
  join public.profiles as profile
    on profile.user_id = message.sender_id
  where message.flock_id = target_flock_id
    and (
      before_created_at is null
      or (message.created_at, message.id) < (before_created_at, before_id)
    )
  order by message.created_at desc, message.id desc
  limit least(greatest(page_size, 1), 51)
$$;

create function public.send_flock_message(
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

revoke execute on function public.list_flock_messages(uuid, timestamptz, uuid, integer) from public, anon;
revoke execute on function public.list_my_flock_chats() from public, anon;
revoke execute on function public.send_flock_message(uuid, text) from public, anon;
grant execute on function public.list_flock_messages(uuid, timestamptz, uuid, integer) to authenticated;
grant execute on function public.list_my_flock_chats() to authenticated;
grant execute on function public.send_flock_message(uuid, text) to authenticated;

alter publication supabase_realtime add table public.flock_messages;

comment on table public.flock_messages is
  'Persistent member-only conversation history for one flock.';

comment on function public.list_flock_messages(uuid, timestamptz, uuid, integer) is
  'Returns one RLS-filtered reverse-chronological flock message window for cursor-backed infinite scrolling.';

comment on function public.list_my_flock_chats() is
  'Lists only the flocks where the authenticated runner is a current member, including when that runner is a superadmin.';

comment on function public.send_flock_message(uuid, text) is
  'Creates a trimmed flock message while deriving its sender from the authenticated session.';
