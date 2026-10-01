create table public.flock_events (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  starts_at timestamptz not null,
  location text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  constraint flock_events_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint flock_events_location_length check (char_length(btrim(location)) between 1 and 120),
  constraint flock_events_description_length check (char_length(description) <= 500)
);

create index flock_events_upcoming_idx on public.flock_events (flock_id, starts_at);

alter table public.flock_events enable row level security;
revoke all on table public.flock_events from anon, authenticated;
grant select on table public.flock_events to authenticated;

create policy "Flock members can read events"
on public.flock_events for select to authenticated
using (flock_id in (select private.user_flock_ids()));

create function public.create_flock_event(
  target_flock_id uuid,
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
    select 1 from public.flocks
    where id = target_flock_id and owner_id = (select auth.uid())
  ) then
    raise exception 'Only the flock owner can create events.' using errcode = '42501';
  end if;

  insert into public.flock_events (flock_id, created_by, title, starts_at, location, description)
  values (
    target_flock_id,
    (select auth.uid()),
    btrim(event_title),
    event_starts_at,
    btrim(event_location),
    btrim(event_description)
  )
  returning *;
end;
$$;

revoke execute on function public.create_flock_event(uuid, text, timestamptz, text, text) from public;
grant execute on function public.create_flock_event(uuid, text, timestamptz, text, text) to authenticated;
