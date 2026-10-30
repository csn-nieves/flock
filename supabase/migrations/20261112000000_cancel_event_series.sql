create function public.cancel_event_series(target_series_id uuid)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  canceled_count smallint := 0;
  event_row public.flock_events;
begin
  if not exists (
    select 1
    from public.event_series as series
    left join public.flocks as flock on flock.id = series.flock_id
    where series.id = target_series_id
      and (
        (select private.is_superadmin())
        or series.created_by = actor_user_id
        or flock.owner_id = actor_user_id
      )
  ) then
    raise insufficient_privilege using message = 'Event series ownership is required.';
  end if;

  for event_row in
    update public.flock_events
    set canceled_at = clock_timestamp()
    where series_id = target_series_id
      and canceled_at is null
      and starts_at >= clock_timestamp()
    returning *
  loop
    canceled_count := canceled_count + 1;
    if event_row.flock_id is not null then
      perform private.enqueue_flock_event_notification(
        event_row.id, 'canceled', actor_user_id
      );
    end if;
  end loop;

  return canceled_count;
end;
$$;

revoke execute on function public.cancel_event_series(uuid) from public, anon;
grant execute on function public.cancel_event_series(uuid) to authenticated;
