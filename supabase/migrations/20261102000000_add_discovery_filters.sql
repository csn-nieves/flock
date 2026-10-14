drop function public.search_runners(text);
drop function public.search_flocks(text);

create function public.search_runners(search_term text, location_term text)
returns table (user_id uuid, display_name text, location text)
language sql stable security definer set search_path = ''
as $$
  select profile.user_id, profile.display_name, profile.location
  from public.profiles as profile
  where char_length(btrim(search_term)) >= 2
    and profile.display_name ilike '%' || btrim(search_term) || '%'
    and (
      nullif(btrim(location_term), '') is null
      or profile.location ilike '%' || btrim(location_term) || '%'
    )
  order by lower(profile.display_name), profile.user_id
  limit 20;
$$;

create function public.search_flocks(search_term text, location_term text)
returns table (
  id uuid,
  name text,
  owner_id uuid,
  location text,
  description text
)
language sql stable security definer set search_path = ''
as $$
  select flock.id, flock.name, flock.owner_id, flock.location, flock.description
  from public.flocks as flock
  where char_length(btrim(search_term)) >= 2
    and flock.name ilike '%' || btrim(search_term) || '%'
    and (
      nullif(btrim(location_term), '') is null
      or flock.location ilike '%' || btrim(location_term) || '%'
    )
  order by lower(flock.name), flock.id
  limit 20;
$$;

revoke execute on function public.search_runners(text, text) from public, anon;
revoke execute on function public.search_flocks(text, text) from public, anon;
grant execute on function public.search_runners(text, text) to authenticated;
grant execute on function public.search_flocks(text, text) to authenticated;

comment on function public.search_runners(text, text) is
  'Searches bounded public runner identity by name and optional coarse location.';
comment on function public.search_flocks(text, text) is
  'Searches bounded flock identity and details by name and optional location.';
