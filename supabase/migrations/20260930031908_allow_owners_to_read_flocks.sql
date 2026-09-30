create index flocks_owner_id_idx on public.flocks (owner_id);

drop policy "Members can read their flocks" on public.flocks;

create policy "Owners and members can read their flocks"
on public.flocks
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or id in (select private.user_flock_ids())
);
