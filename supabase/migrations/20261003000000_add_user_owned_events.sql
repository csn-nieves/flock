alter table public.flock_events
  alter column flock_id drop not null;

create index flock_events_created_by_idx
  on public.flock_events (created_by, starts_at);

drop policy if exists "Flock members can read events" on public.flock_events;

create policy "Authorized users can read events"
on public.flock_events for select to authenticated
using (
  created_by = (select auth.uid())
  or flock_id in (select private.user_flock_ids())
);

create function public.create_user_event(
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
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  insert into public.flock_events (
    flock_id,
    created_by,
    title,
    starts_at,
    location,
    description
  )
  values (
    null,
    (select auth.uid()),
    btrim(event_title),
    event_starts_at,
    btrim(event_location),
    btrim(event_description)
  )
  returning *;
end;
$$;

revoke execute on function public.create_user_event(text, timestamptz, text, text) from public;
grant execute on function public.create_user_event(text, timestamptz, text, text) to authenticated;
