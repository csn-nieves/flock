create or replace function public.update_flock_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns public.flock_events
language plpgsql security definer set search_path = ''
as $$
declare updated_event public.flock_events;
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and (event.created_by = (select auth.uid()) or flock.owner_id = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  update public.flock_events
  set title = btrim(event_title), starts_at = event_starts_at,
      location = btrim(event_location), description = btrim(event_description)
  where id = target_event_id returning * into updated_event;
  return updated_event;
end;
$$;

create or replace function public.cancel_flock_event(target_event_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and (event.created_by = (select auth.uid()) or flock.owner_id = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  update public.flock_events set canceled_at = clock_timestamp()
  where id = target_event_id and canceled_at is null;
end;
$$;
