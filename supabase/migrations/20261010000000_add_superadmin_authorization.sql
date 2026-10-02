create or replace function private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false)
$$;

revoke execute on function private.is_superadmin() from public, anon;
grant execute on function private.is_superadmin() to authenticated;

drop policy if exists "Owners and members can read their flocks" on public.flocks;
drop policy if exists "Members can read their flocks" on public.flocks;
create policy "Members and superadmins can read flocks"
on public.flocks for select to authenticated
using (
  (select private.is_superadmin())
  or owner_id = (select auth.uid())
  or id in (select private.user_flock_ids())
);

drop policy if exists "Owners can update their flocks" on public.flocks;
create policy "Owners and superadmins can update flocks"
on public.flocks for update to authenticated
using ((select private.is_superadmin()) or owner_id = (select auth.uid()))
with check ((select private.is_superadmin()) or owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their flocks" on public.flocks;
create policy "Owners and superadmins can delete flocks"
on public.flocks for delete to authenticated
using ((select private.is_superadmin()) or owner_id = (select auth.uid()));

drop policy if exists "Members can read their flock roster" on public.flock_members;
create policy "Members and superadmins can read flock rosters"
on public.flock_members for select to authenticated
using ((select private.is_superadmin()) or flock_id in (select private.user_flock_ids()));

drop policy if exists "Authorized users can read events" on public.flock_events;
create policy "Authorized users can read events"
on public.flock_events for select to authenticated
using (
  (select private.is_superadmin())
  or created_by = (select auth.uid())
  or flock_id in (select private.user_flock_ids())
  or id in (select private.user_event_invitation_ids())
);

drop policy if exists "Authorized users can read event attendance" on public.flock_event_attendance;
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

create or replace function public.create_flock_event(
  target_flock_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns table (id uuid, flock_id uuid, created_by uuid, title text, starts_at timestamptz, location text, description text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flocks as flock
    where flock.id = target_flock_id
      and ((select private.is_superadmin()) or flock.owner_id = (select auth.uid()))
  ) then
    raise insufficient_privilege using message = 'Flock ownership is required.';
  end if;
  return query
  insert into public.flock_events (flock_id, created_by, title, starts_at, location, description)
  values (target_flock_id, (select auth.uid()), btrim(event_title), event_starts_at, btrim(event_location), btrim(event_description))
  returning flock_events.id, flock_events.flock_id, flock_events.created_by, flock_events.title,
    flock_events.starts_at, flock_events.location, flock_events.description, flock_events.created_at;
end;
$$;

create or replace function public.update_flock_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns public.flock_events
language plpgsql security definer set search_path = ''
as $$
declare updated_event public.flock_events;
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = (select auth.uid()) or flock.owner_id = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  update public.flock_events set title = btrim(event_title), starts_at = event_starts_at,
    location = btrim(event_location), description = btrim(event_description)
  where id = target_event_id returning * into updated_event;
  return updated_event;
end;
$$;

create or replace function public.cancel_flock_event(target_event_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = (select auth.uid()) or flock.owner_id = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  update public.flock_events set canceled_at = clock_timestamp()
  where id = target_event_id and canceled_at is null;
end;
$$;

create or replace function public.create_flock_invitation(target_flock_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '24 hours';
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;
  if not exists (
    select 1 from public.flocks as flock
    where flock.id = target_flock_id
      and ((select private.is_superadmin()) or flock.owner_id = (select auth.uid())
        or exists (select 1 from public.flock_members where flock_id = target_flock_id and user_id = (select auth.uid())))
  ) then
    raise insufficient_privilege using message = 'Flock membership is required.';
  end if;
  insert into private.flock_invitations (flock_id, created_by, token_hash, created_at, expires_at)
  values (target_flock_id, (select auth.uid()), extensions.digest(invitation_token, 'sha256'), invitation_created_at, invitation_expires_at);
  return query select invitation_token, invitation_expires_at;
end;
$$;

create or replace function public.create_event_invitation(target_event_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '24 hours';
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;
  if not exists (
    select 1 from public.flock_events as event
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = (select auth.uid()))
  ) then
    raise insufficient_privilege using message = 'Event ownership is required.';
  end if;
  insert into private.event_invitations (event_id, created_by, token_hash, created_at, expires_at)
  values (target_event_id, (select auth.uid()), extensions.digest(invitation_token, 'sha256'), invitation_created_at, invitation_expires_at);
  return query select invitation_token, invitation_expires_at;
end;
$$;

create or replace function public.update_flock_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text default ''
)
returns public.flock_events
language plpgsql security definer set search_path = ''
as $$
declare updated_event public.flock_events;
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = (select auth.uid()) or flock.owner_id = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  update public.flock_events set title = btrim(event_title), starts_at = event_starts_at,
    location = btrim(event_location), description = btrim(event_description)
  where id = target_event_id returning * into updated_event;
  return updated_event;
end;
$$;

create or replace function public.cancel_flock_event(target_event_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.flock_events as event
    left join public.flocks as flock on flock.id = event.flock_id
    where event.id = target_event_id
      and ((select private.is_superadmin()) or event.created_by = (select auth.uid()) or flock.owner_id = (select auth.uid()))
  ) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  update public.flock_events set canceled_at = clock_timestamp()
  where id = target_event_id and canceled_at is null;
end;
$$;
