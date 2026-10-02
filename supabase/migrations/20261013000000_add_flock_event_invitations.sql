create function public.create_flock_event_invitations(
  target_event_id uuid,
  target_flock_id uuid
)
returns table (
  recipient_user_id uuid,
  recipient_display_name text,
  token text,
  expires_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '24 hours';
begin
  if not exists (
    select 1
    from public.flock_events as event
    where event.id = target_event_id
      and event.flock_id is null
      and (
        (select private.is_superadmin())
        or event.created_by = (select auth.uid())
      )
  ) then
    raise insufficient_privilege using message = 'Personal event ownership is required.';
  end if;

  if not exists (
    select 1
    from public.flocks as flock
    where flock.id = target_flock_id
  ) then
    raise foreign_key_violation using message = 'Invitation flock was not found.';
  end if;

  return query
  with recipient_tokens as materialized (
    select
      member.user_id as recipient_user_id,
      profile.display_name as recipient_display_name,
      pg_catalog.encode(extensions.gen_random_bytes(32), 'hex') as token
    from public.flock_members as member
    join public.profiles as profile on profile.user_id = member.user_id
    where member.flock_id = target_flock_id
  ),
  created_invitations as (
    insert into private.event_invitations (
      event_id,
      created_by,
      recipient_user_id,
      token_hash,
      created_at,
      expires_at
    )
    select
      target_event_id,
      (select auth.uid()),
      recipient.recipient_user_id,
      extensions.digest(recipient.token, 'sha256'),
      invitation_created_at,
      invitation_expires_at
    from recipient_tokens as recipient
    returning private.event_invitations.recipient_user_id as inserted_recipient_user_id
  )
  select
    recipient.recipient_user_id,
    recipient.recipient_display_name,
    recipient.token,
    invitation_expires_at
  from recipient_tokens as recipient
  join created_invitations as invitation
    on invitation.inserted_recipient_user_id = recipient.recipient_user_id
  order by lower(recipient.recipient_display_name), recipient.recipient_user_id;
end;
$$;

revoke execute on function public.create_flock_event_invitations(uuid, uuid)
from public, anon;

grant execute on function public.create_flock_event_invitations(uuid, uuid)
to authenticated;

comment on function public.create_flock_event_invitations(uuid, uuid) is
  'Snapshots a flock roster and creates one recipient-bound, 24-hour personal-event invitation per current member.';
