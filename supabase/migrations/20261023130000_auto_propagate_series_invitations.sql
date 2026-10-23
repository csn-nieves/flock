create function private.auto_propagate_series_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_series_id uuid;
  occurrence record;
  invitation_token text;
  invitation_created_at timestamptz;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  select event.series_id
  into source_series_id
  from public.flock_events as event
  where event.id = new.event_id;

  if source_series_id is null or new.expires_at <= clock_timestamp() then
    return new;
  end if;

  for occurrence in
    select event.id
    from public.flock_events as event
    where event.series_id = source_series_id
      and event.id <> new.event_id
  loop
    invitation_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
    invitation_created_at := clock_timestamp();

    insert into private.event_invitations (
      event_id, created_by, recipient_user_id, flock_id, token_hash,
      created_at, expires_at
    )
    values (
      occurrence.id, new.created_by, new.recipient_user_id, new.flock_id,
      extensions.digest(invitation_token, 'sha256'), invitation_created_at,
      least(new.expires_at, invitation_created_at + interval '7 days')
    );
  end loop;

  return new;
end;
$$;

create trigger auto_propagate_series_invitation
after insert on private.event_invitations
for each row execute function private.auto_propagate_series_invitation();

revoke all on function private.auto_propagate_series_invitation() from public, anon, authenticated;
