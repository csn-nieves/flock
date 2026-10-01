create type public.flock_event_response as enum ('in', 'out', 'maybe');

create table public.flock_event_attendance (
  event_id uuid not null references public.flock_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  response public.flock_event_response not null,
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.flock_event_attendance enable row level security;
revoke all on table public.flock_event_attendance from anon, authenticated;
grant select on table public.flock_event_attendance to authenticated;

create policy "Flock members can read event attendance"
on public.flock_event_attendance for select to authenticated
using (event_id in (select id from public.flock_events where flock_id in (select private.user_flock_ids())));

create function public.set_flock_event_response(
  target_event_id uuid,
  next_response public.flock_event_response
)
returns public.flock_event_attendance
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flock_events
    where id = target_event_id
      and flock_id in (select private.user_flock_ids())
  ) then
    raise exception 'You must belong to the flock to respond.' using errcode = '42501';
  end if;

  insert into public.flock_event_attendance (event_id, user_id, response, updated_at)
  values (target_event_id, (select auth.uid()), next_response, clock_timestamp())
  on conflict (event_id, user_id) do update
  set response = excluded.response, updated_at = excluded.updated_at
  returning *;
end;
$$;

revoke execute on function public.set_flock_event_response(uuid, public.flock_event_response) from public;
grant execute on function public.set_flock_event_response(uuid, public.flock_event_response) to authenticated;
