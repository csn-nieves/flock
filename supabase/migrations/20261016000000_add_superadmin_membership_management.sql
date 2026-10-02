create or replace function public.remove_flock_member(
  target_flock_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if not (select private.is_superadmin()) then
    raise insufficient_privilege using message = 'Superadmin access is required.';
  end if;

  if exists (
    select 1
    from public.flock_members
    where flock_id = target_flock_id
      and user_id = target_user_id
      and role = 'owner'
  ) then
    raise check_violation using message = 'Flock owners cannot be removed.';
  end if;

  delete from public.flock_members
  where flock_id = target_flock_id
    and user_id = target_user_id
    and role = 'member';
end;
$$;

revoke execute on function public.remove_flock_member(uuid, uuid) from public, anon;
grant execute on function public.remove_flock_member(uuid, uuid) to authenticated;

comment on function public.remove_flock_member(uuid, uuid) is
  'Allows a superadmin to remove a non-owner flock membership without deleting the runner or flock.';
