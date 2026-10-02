alter table public.flock_events
add column canceled_at timestamptz;

create function public.cancel_flock_event(target_event_id uuid)
returns void
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
    raise exception 'Only the flock owner can cancel events.' using errcode = '42501';
  end if;

  update public.flock_events
  set canceled_at = clock_timestamp()
  where id = target_event_id and canceled_at is null;
end;
$$;

revoke execute on function public.cancel_flock_event(uuid) from public;
grant execute on function public.cancel_flock_event(uuid) to authenticated;
