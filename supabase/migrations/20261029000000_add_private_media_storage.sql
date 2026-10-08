insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flock-media',
  'flock-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Members can read profile media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'flock-media'
  and (
    name like 'profiles/' || (select auth.uid())::text || '/%'
    or exists (
      select 1
      from public.flock_members as viewer_membership
      join public.flock_members as target_membership
        on target_membership.flock_id = viewer_membership.flock_id
      where viewer_membership.user_id = (select auth.uid())
        and name like 'profiles/' || target_membership.user_id::text || '/%'
    )
  )
);

create policy "Runners can manage their profile media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'flock-media'
  and name like 'profiles/' || (select auth.uid())::text || '/%'
);

create policy "Runners can replace their profile media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'flock-media'
  and name like 'profiles/' || (select auth.uid())::text || '/%'
)
with check (
  bucket_id = 'flock-media'
  and name like 'profiles/' || (select auth.uid())::text || '/%'
);

create policy "Runners can delete their profile media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'flock-media'
  and name like 'profiles/' || (select auth.uid())::text || '/%'
);

create policy "Authorized runners can read flock and event media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'flock-media'
  and (
    exists (
      select 1
      from public.flock_members as membership
      where name like 'flocks/' || membership.flock_id::text || '/%'
        and membership.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.flock_events as event
      where name like 'events/' || event.id::text || '/%'
        and (
          event.created_by = (select auth.uid())
          or event.flock_id in (select private.user_flock_ids())
        )
    )
  )
);

create policy "Flock owners can manage flock media"
on storage.objects for all
to authenticated
using (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flocks as flock
    where name like 'flocks/' || flock.id::text || '/%'
      and flock.owner_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flocks as flock
    where name like 'flocks/' || flock.id::text || '/%'
      and flock.owner_id = (select auth.uid())
  )
);

create policy "Event creators can manage event media"
on storage.objects for all
to authenticated
using (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flock_events as event
    where name like 'events/' || event.id::text || '/%'
      and event.created_by = (select auth.uid())
  )
)
with check (
  bucket_id = 'flock-media'
  and exists (
    select 1
    from public.flock_events as event
    where name like 'events/' || event.id::text || '/%'
      and event.created_by = (select auth.uid())
  )
);

comment on table storage.buckets is
  'Flock media uses a private bucket; resource-specific policies govern access.';
