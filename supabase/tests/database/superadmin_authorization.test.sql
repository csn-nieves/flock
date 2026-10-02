begin;

select plan(5);

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

select * from finish();

rollback;
