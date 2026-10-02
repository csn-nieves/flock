alter table private.event_invitations
add column recipient_user_id uuid references auth.users (id) on delete cascade;

create or replace function public.create_targeted_event_invitation(
  target_event_id uuid,
  target_recipient_user_id uuid
)
returns table (token text, expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '24 hours';
begin
  if not exists (
    select 1 from public.flock_events as event
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  if not exists (select 1 from auth.users where id = target_recipient_user_id) then
    raise foreign_key_violation using message = 'Invitation recipient was not found.';
  end if;
  insert into private.event_invitations (event_id, created_by, recipient_user_id, token_hash, created_at, expires_at)
  values (target_event_id, (select auth.uid()), target_recipient_user_id, extensions.digest(invitation_token, 'sha256'), invitation_created_at, invitation_expires_at);
  return query select invitation_token, invitation_expires_at;
end;
$$;

create or replace function public.accept_event_invitation(invitation_token text)
returns public.flock_events language plpgsql volatile security definer set search_path = ''
as $$
declare accepted_event_id uuid;
begin
  if (select auth.uid()) is null then raise insufficient_privilege using message = 'Authentication is required.'; end if;
  update private.event_invitations
  set consumed_at = clock_timestamp(), consumed_by = (select auth.uid())
  where token_hash = extensions.digest(invitation_token, 'sha256')
    and consumed_at is null and expires_at > clock_timestamp()
    and (recipient_user_id is null or recipient_user_id = (select auth.uid()))
  returning event_id into accepted_event_id;
  if accepted_event_id is null then raise exception 'Invitation is unavailable.' using errcode = 'P0002'; end if;
  return (select event from public.flock_events as event where event.id = accepted_event_id);
end;
$$;

revoke execute on function public.create_targeted_event_invitation(uuid, uuid) from public, anon;
grant execute on function public.create_targeted_event_invitation(uuid, uuid) to authenticated;
