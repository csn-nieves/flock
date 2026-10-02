create table private.event_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.flock_events (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users (id) on delete set null,
  constraint event_invitations_expiry_check check (expires_at > created_at),
  constraint event_invitations_consumption_check check (consumed_at is not null or consumed_by is null)
);

create index event_invitations_event_expiry_idx on private.event_invitations (event_id, expires_at);
revoke all on table private.event_invitations from public, anon, authenticated;

create function public.create_event_invitation(target_event_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  invitation_token text := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  invitation_created_at timestamptz := clock_timestamp();
  invitation_expires_at timestamptz := invitation_created_at + interval '24 hours';
begin
  if (select auth.uid()) is null then raise insufficient_privilege using message = 'Authentication is required.'; end if;
  if not exists (select 1 from public.flock_events where id = target_event_id and created_by = (select auth.uid())) then raise insufficient_privilege using message = 'Event ownership is required.'; end if;
  insert into private.event_invitations (event_id, created_by, token_hash, created_at, expires_at)
  values (target_event_id, (select auth.uid()), extensions.digest(invitation_token, 'sha256'), invitation_created_at, invitation_expires_at);
  return query select invitation_token, invitation_expires_at;
end;
$$;

create function public.accept_event_invitation(invitation_token text)
returns public.flock_events
language plpgsql volatile security definer set search_path = ''
as $$
declare accepted_event_id uuid;
begin
  if (select auth.uid()) is null then raise insufficient_privilege using message = 'Authentication is required.'; end if;
  update private.event_invitations
  set consumed_at = clock_timestamp(), consumed_by = (select auth.uid())
  where token_hash = extensions.digest(invitation_token, 'sha256') and consumed_at is null and expires_at > clock_timestamp()
  returning event_id into accepted_event_id;
  if accepted_event_id is null then raise exception 'Invitation is unavailable.' using errcode = 'P0002'; end if;
  return (select event from public.flock_events as event where event.id = accepted_event_id);
end;
$$;

drop policy if exists "Authorized users can read events" on public.flock_events;
create policy "Authorized users can read events" on public.flock_events for select to authenticated
using (created_by = (select auth.uid()) or flock_id in (select private.user_flock_ids()) or exists (select 1 from private.event_invitations where event_id = flock_events.id and consumed_by = (select auth.uid())));

drop function public.set_flock_event_response(uuid, public.flock_event_response);
create function public.set_flock_event_response(target_event_id uuid, next_response public.flock_event_response)
returns public.flock_event_attendance language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.flock_events as event where event.id = target_event_id and (event.created_by = (select auth.uid()) or event.flock_id in (select private.user_flock_ids()) or exists (select 1 from private.event_invitations where event_id = event.id and consumed_by = (select auth.uid())))) then raise insufficient_privilege using message = 'Event access is required.'; end if;
  insert into public.flock_event_attendance (event_id, user_id, response, updated_at) values (target_event_id, (select auth.uid()), next_response, clock_timestamp()) on conflict on constraint flock_event_attendance_pkey do update set response = excluded.response, updated_at = excluded.updated_at;
  return (select attendance from public.flock_event_attendance as attendance where attendance.event_id = target_event_id and attendance.user_id = (select auth.uid()));
end;
$$;

revoke execute on function public.create_event_invitation(uuid) from public, anon;
revoke execute on function public.accept_event_invitation(text) from public, anon;
revoke execute on function public.set_flock_event_response(uuid, public.flock_event_response) from public;
grant execute on function public.create_event_invitation(uuid) to authenticated;
grant execute on function public.accept_event_invitation(text) to authenticated;
grant execute on function public.set_flock_event_response(uuid, public.flock_event_response) to authenticated;
