create function public.search_runners(search_term text)
returns table (user_id uuid, display_name text)
language sql stable security definer set search_path = ''
as $$
  select profile.user_id, profile.display_name
  from public.profiles as profile
  where char_length(btrim(search_term)) >= 2
    and profile.display_name ilike '%' || btrim(search_term) || '%'
  order by lower(profile.display_name), profile.user_id
  limit 20;
$$;

create function public.search_flocks(search_term text)
returns table (id uuid, name text, owner_id uuid)
language sql stable security definer set search_path = ''
as $$
  select flock.id, flock.name, flock.owner_id
  from public.flocks as flock
  where char_length(btrim(search_term)) >= 2
    and flock.name ilike '%' || btrim(search_term) || '%'
  order by lower(flock.name), flock.id
  limit 20;
$$;

revoke execute on function public.search_runners(text) from public, anon;
revoke execute on function public.search_flocks(text) from public, anon;
grant execute on function public.search_runners(text) to authenticated;
grant execute on function public.search_flocks(text) to authenticated;
