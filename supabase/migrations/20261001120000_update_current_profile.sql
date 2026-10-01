create function public.update_my_profile(next_display_name text)
returns table (
  user_id uuid,
  display_name text,
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
    updated_at = clock_timestamp()
  where profile.user_id = (select auth.uid())
  returning profile.user_id, profile.display_name, profile.updated_at;
end;
$$;

revoke execute on function public.update_my_profile(text) from public;
grant execute on function public.update_my_profile(text) to authenticated;

comment on function public.update_my_profile(text) is
  'Updates only the authenticated runner profile display name.';
