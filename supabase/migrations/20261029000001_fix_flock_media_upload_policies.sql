drop policy if exists "Flock owners can manage flock media"
on storage.objects;

create policy "Flock owners can upload flock media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flock_members as membership
    where membership.flock_id::text = split_part(name, '/', 2)
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  )
  and name like 'flocks/%/cover'
);

create policy "Flock owners can replace flock media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flock_members as membership
    where membership.flock_id::text = split_part(name, '/', 2)
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  )
  and name like 'flocks/%/cover'
)
with check (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flock_members as membership
    where membership.flock_id::text = split_part(name, '/', 2)
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  )
  and name like 'flocks/%/cover'
);

create policy "Flock owners can delete flock media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flock_members as membership
    where membership.flock_id::text = split_part(name, '/', 2)
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  )
  and name like 'flocks/%/cover'
);
