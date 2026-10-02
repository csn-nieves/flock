create or replace function public.create_user_event(
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns public.flock_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_event public.flock_events;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  insert into public.flock_events (
    flock_id, created_by, title, starts_at, location, description
  )
  values (
    null, (select auth.uid()), btrim(event_title), event_starts_at,
    btrim(event_location), btrim(event_description)
  )
  returning * into created_event;

  return created_event;
end;
$$;
