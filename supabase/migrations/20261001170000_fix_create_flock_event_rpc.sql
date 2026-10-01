drop function public.create_flock_event(uuid, text, timestamptz, text, text);

create function public.create_flock_event(
  target_flock_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns table (
  id uuid,
  flock_id uuid,
  created_by uuid,
  title text,
  starts_at timestamptz,
  location text,
  description text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flocks
    where id = target_flock_id and owner_id = (select auth.uid())
  ) then
    raise exception 'Only the flock owner can create events.' using errcode = '42501';
  end if;

  return query
  insert into public.flock_events (flock_id, created_by, title, starts_at, location, description)
  values (
    target_flock_id,
    (select auth.uid()),
    btrim(event_title),
    event_starts_at,
    btrim(event_location),
    btrim(event_description)
  )
  returning flock_events.id, flock_events.flock_id, flock_events.created_by,
    flock_events.title, flock_events.starts_at, flock_events.location,
    flock_events.description, flock_events.created_at;
end;
$$;

revoke execute on function public.create_flock_event(uuid, text, timestamptz, text, text) from public;
grant execute on function public.create_flock_event(uuid, text, timestamptz, text, text) to authenticated;
