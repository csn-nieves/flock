drop function public.set_flock_event_response(uuid, public.flock_event_response);

create function public.set_flock_event_response(
  target_event_id uuid,
  next_response public.flock_event_response
)
returns table (
  event_id uuid,
  user_id uuid,
  response public.flock_event_response,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flock_events as event
    where event.id = target_event_id
      and event.flock_id in (select private.user_flock_ids())
  ) then
    raise exception 'You must belong to the flock to respond.' using errcode = '42501';
  end if;

  return query
  insert into public.flock_event_attendance (event_id, user_id, response, updated_at)
  values (target_event_id, (select auth.uid()), next_response, clock_timestamp())
  on conflict (event_id, user_id) do update
  set response = excluded.response, updated_at = excluded.updated_at
  returning flock_event_attendance.event_id, flock_event_attendance.user_id,
    flock_event_attendance.response, flock_event_attendance.updated_at;
end;
$$;

revoke execute on function public.set_flock_event_response(uuid, public.flock_event_response) from public;
grant execute on function public.set_flock_event_response(uuid, public.flock_event_response) to authenticated;
