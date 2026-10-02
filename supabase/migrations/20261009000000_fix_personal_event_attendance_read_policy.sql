drop policy if exists "Flock members can read event attendance"
on public.flock_event_attendance;

create policy "Authorized users can read event attendance"
on public.flock_event_attendance for select to authenticated
using (
  event_id in (
    select event.id
    from public.flock_events as event
    where event.created_by = (select auth.uid())
      or event.flock_id in (select private.user_flock_ids())
      or event.id in (select private.user_event_invitation_ids())
  )
);
