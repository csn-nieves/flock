create table private.flock_invitations (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid not null references public.flocks (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users (id) on delete set null,
  constraint flock_invitations_expiry_check check (expires_at > created_at),
  constraint flock_invitations_consumption_check check (
    consumed_at is not null or consumed_by is null
  ),
  constraint flock_invitations_consumed_before_expiry_check check (
    consumed_at is null or consumed_at <= expires_at
  )
);

create index flock_invitations_flock_expiry_idx
on private.flock_invitations (flock_id, expires_at);

revoke all on table private.flock_invitations from public, anon, authenticated;

create function public.create_flock_invitation(target_flock_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(
    extensions.gen_random_bytes(32),
    'hex'
  );
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '24 hours';
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from public.flock_members
    where flock_id = target_flock_id
      and user_id = (select auth.uid())
  ) then
    raise insufficient_privilege using message = 'Flock membership is required.';
  end if;

  insert into private.flock_invitations (
    flock_id,
    created_by,
    token_hash,
    created_at,
    expires_at
  )
  values (
    target_flock_id,
    (select auth.uid()),
    extensions.digest(invitation_token, 'sha256'),
    invitation_created_at,
    invitation_expires_at
  );

  return query
  select invitation_token, invitation_expires_at;
end;
$$;

revoke execute on function public.create_flock_invitation(uuid) from public, anon;
grant execute on function public.create_flock_invitation(uuid) to authenticated;

comment on table private.flock_invitations is
  'Hashed, single-use flock invitation tokens that expire 24 hours after creation.';

comment on function public.create_flock_invitation(uuid) is
  'Creates a 24-hour invitation for a flock visible to the current member and returns the raw token once.';
