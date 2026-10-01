alter table public.profiles
  add column location text,
  add constraint profiles_location_length_check
    check (location is null or char_length(btrim(location)) between 1 and 120);

drop function public.update_my_profile(text);

create function public.update_my_profile(
  next_display_name text,
  next_location text default null
)
returns table (
  user_id uuid,
  display_name text,
  location text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'An authenticated user is required.';
  end if;

  return query
  update public.profiles as profile
  set
    display_name = btrim(next_display_name),
    location = nullif(btrim(next_location), ''),
    updated_at = clock_timestamp()
  where profile.user_id = (select auth.uid())
  returning profile.user_id, profile.display_name, profile.location, profile.updated_at;
end;
$$;

revoke execute on function public.update_my_profile(text, text) from public;
grant execute on function public.update_my_profile(text, text) to authenticated;

comment on function public.update_my_profile(text, text) is
  'Updates only the authenticated runner display name and general location.';
