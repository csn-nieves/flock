create function private.user_event_invitation_ids()
returns setof uuid
language sql
stable
security definer
set search_path = private
as $$
  select event_id
  from private.event_invitations
  where consumed_by = (select auth.uid());
$$;

revoke execute on function private.user_event_invitation_ids() from public, anon;
grant execute on function private.user_event_invitation_ids() to authenticated;

drop policy if exists "Authorized users can read events" on public.flock_events;
create policy "Authorized users can read events"
on public.flock_events for select to authenticated
using (
  created_by = (select auth.uid())
  or flock_id in (select private.user_flock_ids())
  or id in (select private.user_event_invitation_ids())
);

create or replace function public.set_flock_event_response(
  target_event_id uuid,
  next_response public.flock_event_response
)
returns public.flock_event_attendance
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.flock_events as event
    where event.id = target_event_id
      and (
        event.created_by = (select auth.uid())
        or event.flock_id in (select private.user_flock_ids())
        or event.id in (select private.user_event_invitation_ids())
      )
  ) then
    raise insufficient_privilege using message = 'Event access is required.';
  end if;

  insert into public.flock_event_attendance (event_id, user_id, response, updated_at)
  values (target_event_id, (select auth.uid()), next_response, clock_timestamp())
  on conflict on constraint flock_event_attendance_pkey do update
    set response = excluded.response, updated_at = excluded.updated_at;

  return (
    select attendance
    from public.flock_event_attendance as attendance
    where attendance.event_id = target_event_id
      and attendance.user_id = (select auth.uid())
  );
end;
$$;
