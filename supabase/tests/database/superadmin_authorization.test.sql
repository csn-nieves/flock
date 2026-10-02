begin;

select plan(7);

select has_function('private', 'is_superadmin', array[]::text[], 'superadmin checks are centralized');
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'flocks'
      and policyname = 'Members and superadmins can read flocks'
  ),
  'superadmins can read every flock'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'flock_members'
      and policyname = 'Members and superadmins can read flock rosters'
  ),
  'superadmins can read every roster'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'flock_events'
      and policyname = 'Authorized users can read events'
  ),
  'superadmins can read every event'
);
select is(
  (select raw_app_meta_data ->> 'role' from auth.users where email = 'organizer@flock.com'),
  'superadmin',
  'the local organizer fixture is the superadmin account'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","app_metadata":{"role":"superadmin"}}';

select lives_ok(
  format(
    'select public.cancel_flock_event(%L::uuid)',
    md5('seed-personal-event-1')::uuid
  ),
  'a superadmin can cancel an event created by another runner'
);

select ok(
  (
    select canceled_at is not null
    from public.flock_events
    where id = md5('seed-personal-event-1')::uuid
  ),
  'superadmin cancellation preserves the event as a canceled record'
);

reset role;

select * from finish();

rollback;
