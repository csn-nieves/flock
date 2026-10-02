alter table private.event_invitations
add column flock_id uuid references public.flocks (id) on delete cascade;

alter table private.event_invitations
add constraint event_invitations_single_audience_check
check (recipient_user_id is null or flock_id is null);

create index event_invitations_flock_expiry_idx
on private.event_invitations (flock_id, expires_at)
where flock_id is not null;

create table private.event_invitation_acceptances (
  invitation_id uuid not null references private.event_invitations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  accepted_at timestamptz not null default now(),
  primary key (invitation_id, user_id)
);

create index event_invitation_acceptances_user_idx
on private.event_invitation_acceptances (user_id, invitation_id);

revoke all on table private.event_invitation_acceptances
from public, anon, authenticated;

drop function public.create_flock_event_invitations(uuid, uuid);

create or replace function public.create_event_invitation(target_event_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '7 days';
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from public.flock_events as event
    where event.id = target_event_id
      and (
        (select private.is_superadmin())
        or event.created_by = (select auth.uid())
      )
  ) then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;

  insert into private.event_invitations (
    event_id,
    created_by,
    token_hash,
    created_at,
    expires_at
  )
  values (
    target_event_id,
    (select auth.uid()),
    extensions.digest(invitation_token, 'sha256'),
    invitation_created_at,
    invitation_expires_at
  );

  return query select invitation_token, invitation_expires_at;
end;
$$;

create or replace function public.create_targeted_event_invitation(
  target_event_id uuid,
  target_recipient_user_id uuid
)
returns table (token text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '7 days';
begin
  if not exists (
    select 1
    from public.flock_events as event
    where event.id = target_event_id
      and (
        (select private.is_superadmin())
        or event.created_by = (select auth.uid())
      )
  ) then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = target_recipient_user_id
  ) then
    raise foreign_key_violation using message = 'Invitation recipient was not found.';
  end if;

  insert into private.event_invitations (
    event_id,
    created_by,
    recipient_user_id,
    token_hash,
    created_at,
    expires_at
  )
  values (
    target_event_id,
    (select auth.uid()),
    target_recipient_user_id,
    extensions.digest(invitation_token, 'sha256'),
    invitation_created_at,
    invitation_expires_at
  );

  return query select invitation_token, invitation_expires_at;
end;
$$;

create function public.create_flock_event_invitation(
  target_event_id uuid,
  target_flock_id uuid
)
returns table (token text, expires_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '7 days';
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

  insert into private.event_invitations (
    event_id,
    created_by,
    flock_id,
    token_hash,
    created_at,
    expires_at
  )
  values (
    target_event_id,
    (select auth.uid()),
    target_flock_id,
    extensions.digest(invitation_token, 'sha256'),
    invitation_created_at,
    invitation_expires_at
  );

  return query select invitation_token, invitation_expires_at;
end;
$$;

revoke execute on function public.create_flock_event_invitation(uuid, uuid)
from public, anon;

grant execute on function public.create_flock_event_invitation(uuid, uuid)
to authenticated;

comment on function public.create_flock_event_invitation(uuid, uuid) is
  'Creates one seven-day personal-event invitation for every eligible current member of a flock.';

create or replace function public.accept_event_invitation(invitation_token text)
returns public.flock_events
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation private.event_invitations;
  accepted_event public.flock_events;
  acceptance_created boolean;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  select candidate.*
  into invitation
  from private.event_invitations as candidate
  join public.flock_events as event on event.id = candidate.event_id
  where candidate.token_hash = extensions.digest(invitation_token, 'sha256')
    and candidate.expires_at > clock_timestamp()
    and event.canceled_at is null
  for update of candidate;

  if invitation.id is null then
    raise exception 'Invitation is unavailable.' using errcode = 'P0002';
  end if;

  if invitation.flock_id is not null then
    if not exists (
      select 1
      from public.flock_members as member
      where member.flock_id = invitation.flock_id
        and member.user_id = (select auth.uid())
    ) then
      raise exception 'Invitation is unavailable.' using errcode = 'P0002';
    end if;

    insert into private.event_invitation_acceptances (invitation_id, user_id)
    values (invitation.id, (select auth.uid()))
    on conflict do nothing
    returning true into acceptance_created;

    if acceptance_created is not true then
      raise exception 'Invitation is unavailable.' using errcode = 'P0002';
    end if;
  else
    if invitation.consumed_at is not null
      or (
        invitation.recipient_user_id is not null
        and invitation.recipient_user_id <> (select auth.uid())
      )
    then
      raise exception 'Invitation is unavailable.' using errcode = 'P0002';
    end if;

    update private.event_invitations
    set
      consumed_at = clock_timestamp(),
      consumed_by = (select auth.uid())
    where id = invitation.id;
  end if;

  select event.*
  into accepted_event
  from public.flock_events as event
  where event.id = invitation.event_id;

  return accepted_event;
end;
$$;

create function public.accept_event_invitation_by_id(target_invitation_id uuid)
returns public.flock_events
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  invitation private.event_invitations;
  accepted_event public.flock_events;
  acceptance_created boolean;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  select candidate.*
  into invitation
  from private.event_invitations as candidate
  join public.flock_events as event on event.id = candidate.event_id
  where candidate.id = target_invitation_id
    and candidate.expires_at > clock_timestamp()
    and event.canceled_at is null
    and (
      candidate.recipient_user_id = (select auth.uid())
      or (
        candidate.flock_id is not null
        and exists (
          select 1
          from public.flock_members as member
          where member.flock_id = candidate.flock_id
            and member.user_id = (select auth.uid())
        )
      )
    )
  for update of candidate;

  if invitation.id is null then
    raise exception 'Invitation is unavailable.' using errcode = 'P0002';
  end if;

  if invitation.flock_id is not null then
    insert into private.event_invitation_acceptances (invitation_id, user_id)
    values (invitation.id, (select auth.uid()))
    on conflict do nothing
    returning true into acceptance_created;

    if acceptance_created is not true then
      raise exception 'Invitation is unavailable.' using errcode = 'P0002';
    end if;
  else
    if invitation.consumed_at is not null then
      raise exception 'Invitation is unavailable.' using errcode = 'P0002';
    end if;

    update private.event_invitations
    set
      consumed_at = clock_timestamp(),
      consumed_by = (select auth.uid())
    where id = invitation.id;
  end if;

  select event.*
  into accepted_event
  from public.flock_events as event
  where event.id = invitation.event_id;

  return accepted_event;
end;
$$;

revoke execute on function public.accept_event_invitation_by_id(uuid)
from public, anon;

grant execute on function public.accept_event_invitation_by_id(uuid)
to authenticated;

create function public.list_pending_event_invitations()
returns table (
  invitation_id uuid,
  invitation_kind text,
  audience_name text,
  expires_at timestamptz,
  event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text
)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct on (event.id)
    invitation.id as invitation_id,
    case
      when invitation.flock_id is not null then 'flock'
      else 'runner'
    end as invitation_kind,
    flock.name as audience_name,
    invitation.expires_at,
    event.id as event_id,
    event.title as event_title,
    event.starts_at as event_starts_at,
    event.location as event_location,
    event.description as event_description
  from private.event_invitations as invitation
  join public.flock_events as event on event.id = invitation.event_id
  left join public.flocks as flock on flock.id = invitation.flock_id
  where (select auth.uid()) is not null
    and invitation.expires_at > clock_timestamp()
    and event.starts_at >= clock_timestamp()
    and event.canceled_at is null
    and event.created_by <> (select auth.uid())
    and (
      (
        invitation.recipient_user_id = (select auth.uid())
        and invitation.consumed_at is null
      )
      or (
        invitation.flock_id is not null
        and exists (
          select 1
          from public.flock_members as member
          where member.flock_id = invitation.flock_id
            and member.user_id = (select auth.uid())
        )
        and not exists (
          select 1
          from private.event_invitation_acceptances as acceptance
          where acceptance.invitation_id = invitation.id
            and acceptance.user_id = (select auth.uid())
        )
      )
    )
  order by event.id, invitation.created_at desc;
$$;

revoke execute on function public.list_pending_event_invitations()
from public, anon;

grant execute on function public.list_pending_event_invitations()
to authenticated;

create or replace function private.user_event_invitation_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select invitation.event_id
  from private.event_invitations as invitation
  where invitation.consumed_by = (select auth.uid())

  union

  select invitation.event_id
  from private.event_invitation_acceptances as acceptance
  join private.event_invitations as invitation
    on invitation.id = acceptance.invitation_id
  where acceptance.user_id = (select auth.uid());
$$;

drop policy if exists "Authorized users can read events"
on public.flock_events;

create policy "Authorized users can read events"
on public.flock_events for select to authenticated
using (
  (select private.is_superadmin())
  or created_by = (select auth.uid())
  or flock_id in (select private.user_flock_ids())
  or id in (select private.user_event_invitation_ids())
);

drop policy if exists "Authorized users can read event attendance"
on public.flock_event_attendance;

create policy "Authorized users can read event attendance"
on public.flock_event_attendance for select to authenticated
using (
  (select private.is_superadmin())
  or event_id in (
    select event.id
    from public.flock_events as event
    where event.created_by = (select auth.uid())
      or event.flock_id in (select private.user_flock_ids())
      or event.id in (select private.user_event_invitation_ids())
  )
);
