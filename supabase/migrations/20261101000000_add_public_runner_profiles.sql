create function public.get_runner_profile(target_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  location text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.user_id,
    profile.display_name,
    profile.location,
    profile.updated_at
  from public.profiles as profile
  where profile.user_id = target_user_id
    and (select auth.uid()) is not null
$$;

revoke execute on function public.get_runner_profile(uuid) from public, anon;
grant execute on function public.get_runner_profile(uuid) to authenticated;

comment on function public.get_runner_profile(uuid) is
  'Returns the intentionally public identity fields for an authenticated runner profile.';

create policy "Authenticated runners can read public profile media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'flock-media'
  and name like 'profiles/%'
);
