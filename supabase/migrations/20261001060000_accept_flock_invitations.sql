create function public.accept_flock_invitation(invitation_token text)
returns table (id uuid, name text, owner_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  accepting_user_id uuid := (select auth.uid());
  accepted_flock_id uuid;
  acceptance_time timestamptz := clock_timestamp();
  invitation_token_hash bytea;
begin
  if accepting_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if invitation_token is null
    or invitation_token !~ '^[0-9a-f]{64}$'
  then
    raise no_data_found using message = 'Invitation is unavailable.';
  end if;

  invitation_token_hash := extensions.digest(invitation_token, 'sha256');

  update private.flock_invitations
  set
    consumed_at = acceptance_time,
    consumed_by = accepting_user_id
  where token_hash = invitation_token_hash
    and consumed_at is null
    and expires_at > acceptance_time
  returning flock_id into accepted_flock_id;

  if accepted_flock_id is null then
    raise no_data_found using message = 'Invitation is unavailable.';
  end if;

  insert into public.flock_members (flock_id, user_id, role)
  values (accepted_flock_id, accepting_user_id, 'member')
  on conflict (flock_id, user_id) do nothing;

  return query
  select flock.id, flock.name, flock.owner_id
  from public.flocks flock
  where flock.id = accepted_flock_id;
end;
$$;

revoke execute on function public.accept_flock_invitation(text) from public, anon;
grant execute on function public.accept_flock_invitation(text) to authenticated;

comment on function public.accept_flock_invitation(text) is
  'Atomically consumes one valid invitation and adds the authenticated runner to its flock.';
