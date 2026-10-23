create function public.propagate_event_invitation(target_invitation_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_invitation private.event_invitations;
  actor_user_id uuid := (select auth.uid());
  copied_count integer := 0;
  occurrence record;
  invitation_token text;
  invitation_created_at timestamptz;
begin
  select invitation.*
  into source_invitation
  from private.event_invitations as invitation
  join public.flock_events as event on event.id = invitation.event_id
  where invitation.id = target_invitation_id
    and event.created_by = actor_user_id;

  if source_invitation.id is null then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;
  if source_invitation.expires_at <= clock_timestamp() then
    raise check_violation using message = 'Invitation is expired.';
  end if;

  for occurrence in
    select event.id
    from public.flock_events as event
    where event.series_id = (select series_id from public.flock_events where id = source_invitation.event_id)
      and event.id <> source_invitation.event_id
  loop
    invitation_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
    invitation_created_at := clock_timestamp();

    insert into private.event_invitations (
      event_id, created_by, recipient_user_id, flock_id, token_hash,
      created_at, expires_at
    )
    values (
      occurrence.id, actor_user_id, source_invitation.recipient_user_id,
      source_invitation.flock_id, extensions.digest(invitation_token, 'sha256'),
      invitation_created_at, least(source_invitation.expires_at, invitation_created_at + interval '7 days')
    );
    copied_count := copied_count + 1;
  end loop;

  return copied_count;
end;
$$;

revoke execute on function public.propagate_event_invitation(uuid) from public, anon;
grant execute on function public.propagate_event_invitation(uuid) to authenticated;
