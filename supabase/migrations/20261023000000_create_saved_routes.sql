create table public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  route_coordinates jsonb not null,
  route_distance_meters integer not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint saved_routes_name_check check (
    name = btrim(name)
    and char_length(name) between 1 and 80
  ),
  constraint saved_routes_geometry_check check (
    private.valid_route_coordinates(route_coordinates)
    and route_distance_meters between 1 and 1000000
  )
);

create unique index saved_routes_owner_name_idx
on public.saved_routes (owner_id, lower(name));

create index saved_routes_owner_updated_idx
on public.saved_routes (owner_id, updated_at desc);

alter table public.saved_routes enable row level security;

revoke all on table public.saved_routes from anon, authenticated;
grant select on table public.saved_routes to authenticated;

create policy "runners read their saved routes"
on public.saved_routes for select to authenticated
using (owner_id = (select auth.uid()));

create function public.create_saved_route(
  route_name text,
  route_coordinates jsonb,
  route_distance_meters integer
)
returns public.saved_routes
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  saved_route public.saved_routes;
begin
  if actor_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if (
    select count(*)
    from public.saved_routes as existing_route
    where existing_route.owner_id = actor_user_id
  ) >= 100 then
    raise check_violation using message = 'A runner can save up to 100 routes.';
  end if;

  insert into public.saved_routes (
    owner_id,
    name,
    route_coordinates,
    route_distance_meters
  ) values (
    actor_user_id,
    btrim(route_name),
    route_coordinates,
    route_distance_meters
  )
  returning * into saved_route;

  return saved_route;
end;
$$;

create function public.rename_saved_route(target_route_id uuid, route_name text)
returns public.saved_routes
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  saved_route public.saved_routes;
begin
  update public.saved_routes
  set name = btrim(route_name), updated_at = clock_timestamp()
  where id = target_route_id
    and owner_id = actor_user_id
  returning * into saved_route;

  if saved_route.id is null then
    raise insufficient_privilege using message = 'Saved route ownership is required.';
  end if;

  return saved_route;
end;
$$;

create function public.delete_saved_route(target_route_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  deleted_route_id uuid;
begin
  delete from public.saved_routes
  where id = target_route_id
    and owner_id = actor_user_id
  returning id into deleted_route_id;

  if deleted_route_id is null then
    raise insufficient_privilege using message = 'Saved route ownership is required.';
  end if;

  return deleted_route_id;
end;
$$;

revoke all on function public.create_saved_route(text, jsonb, integer) from public;
revoke all on function public.rename_saved_route(uuid, text) from public;
revoke all on function public.delete_saved_route(uuid) from public;
grant execute on function public.create_saved_route(text, jsonb, integer) to authenticated;
grant execute on function public.rename_saved_route(uuid, text) to authenticated;
grant execute on function public.delete_saved_route(uuid) to authenticated;
