create schema if not exists private;

revoke all on schema private from public;

create table public.flocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flocks_name_length_check check (
    name = btrim(name)
    and char_length(name) between 1 and 80
  ),
  constraint flocks_updated_at_check check (updated_at >= created_at)
);

create table public.flock_members (
  flock_id uuid not null references public.flocks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (flock_id, user_id),
  constraint flock_members_role_check check (role in ('owner', 'member'))
);

create index flock_members_user_flock_idx
on public.flock_members (user_id, flock_id);

create unique index flock_members_one_owner_idx
on public.flock_members (flock_id)
where role = 'owner';

create function private.user_flock_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select flock_id
  from public.flock_members
  where user_id = (select auth.uid())
$$;

create function private.add_flock_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.flock_members (flock_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  return new;
end;
$$;

create function private.set_flock_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create trigger add_flock_owner_membership
after insert on public.flocks
for each row
execute function private.add_flock_owner_membership();

create trigger set_flock_updated_at
before update on public.flocks
for each row
execute function private.set_flock_updated_at();

alter table public.flocks enable row level security;
alter table public.flock_members enable row level security;

revoke all on table public.flocks from anon, authenticated;
revoke all on table public.flock_members from anon, authenticated;

grant select, delete on table public.flocks to authenticated;
grant insert (id, name) on table public.flocks to authenticated;
grant update (name) on table public.flocks to authenticated;
grant select on table public.flock_members to authenticated;

grant usage on schema private to authenticated;

revoke execute on function private.user_flock_ids() from public;
revoke execute on function private.add_flock_owner_membership() from public;
revoke execute on function private.set_flock_updated_at() from public;

grant execute on function private.user_flock_ids() to authenticated;

create policy "Members can read their flocks"
on public.flocks
for select
to authenticated
using (id in (select private.user_flock_ids()));

create policy "Authenticated users can create owned flocks"
on public.flocks
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
);

create policy "Owners can update their flocks"
on public.flocks
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Owners can delete their flocks"
on public.flocks
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "Members can read their flock roster"
on public.flock_members
for select
to authenticated
using (flock_id in (select private.user_flock_ids()));

comment on table public.flocks is
  'Run clubs owned by one authenticated user.';

comment on table public.flock_members is
  'Memberships connecting authenticated users to flocks.';

comment on column public.flocks.owner_id is
  'Canonical flock owner; mirrored by one owner membership created atomically.';
