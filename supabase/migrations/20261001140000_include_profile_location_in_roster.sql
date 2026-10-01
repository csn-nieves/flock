drop function public.list_flock_members(uuid);

create function public.list_flock_members(target_flock_id uuid)
returns table (
  user_id uuid,
  display_name text,
  location text,
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
    profile.location,
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

revoke execute on function public.list_flock_members(uuid) from public;
grant execute on function public.list_flock_members(uuid) to authenticated;

comment on function public.list_flock_members(uuid) is
  'Returns an ordered, RLS-filtered roster with display names and coarse locations.';
