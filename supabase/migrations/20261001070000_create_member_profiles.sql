create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length_check check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 80
  ),
  constraint profiles_updated_at_check check (updated_at >= created_at)
);

create function private.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_display_name text;
begin
  profile_display_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      'Runner'
    ),
    80
  );

  insert into public.profiles (user_id, display_name)
  values (new.id, profile_display_name)
  on conflict (user_id) do update
  set
    display_name = excluded.display_name,
    updated_at = clock_timestamp();

  return new;
end;
$$;

create trigger sync_user_profile
after insert or update of raw_user_meta_data on auth.users
for each row
execute function private.sync_user_profile();

insert into public.profiles (user_id, display_name)
select
  id,
  left(
    coalesce(
      nullif(btrim(raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(raw_user_meta_data ->> 'name'), ''),
      'Runner'
    ),
    80
  )
from auth.users
on conflict (user_id) do nothing;

create function private.visible_profile_user_ids()
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
$$;

create function public.list_flock_members(target_flock_id uuid)
returns table (
  user_id uuid,
  display_name text,
  role text,
  joined_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    membership.user_id,
    profile.display_name,
    membership.role,
    membership.joined_at
  from public.flock_members as membership
  join public.profiles as profile
    on profile.user_id = membership.user_id
  where membership.flock_id = target_flock_id
  order by
    case membership.role when 'owner' then 0 else 1 end,
    lower(profile.display_name),
    membership.joined_at,
    membership.user_id
$$;

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

revoke execute on function private.sync_user_profile() from public;
revoke execute on function private.visible_profile_user_ids() from public;
revoke execute on function public.list_flock_members(uuid) from public;

grant execute on function private.visible_profile_user_ids() to authenticated;
grant execute on function public.list_flock_members(uuid) to authenticated;

create policy "Flockmates can read member profiles"
on public.profiles
for select
to authenticated
using (user_id in (select private.visible_profile_user_ids()));

comment on table public.profiles is
  'Public member identity kept separate from private authentication records.';

comment on column public.profiles.display_name is
  'Name visible to authenticated runners who share a flock with this user.';

comment on function public.list_flock_members(uuid) is
  'Returns an ordered, RLS-filtered roster without exposing authentication data.';
