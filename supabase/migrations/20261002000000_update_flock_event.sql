create function public.update_flock_event(
  target_event_id uuid,
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
begin
  if not exists (
    select 1
    from public.flock_events as event
    join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id and flock.owner_id = (select auth.uid())
  ) then
    raise exception 'Only the flock owner can update events.' using errcode = '42501';
  end if;

  update public.flock_events
  set title = btrim(event_title),
      starts_at = event_starts_at,
      location = btrim(event_location),
      description = btrim(event_description)
  where id = target_event_id
  returning *;
end;
$$;

revoke execute on function public.update_flock_event(uuid, text, timestamptz, text, text) from public;
grant execute on function public.update_flock_event(uuid, text, timestamptz, text, text) to authenticated;
