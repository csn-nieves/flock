begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

select has_table('public', 'profiles', 'profiles table exists');
select has_function(
  'public',
  'list_flock_members',
  array['uuid'],
  'the member-list function exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has row level security enabled'
);

select hasnt_column(
  'public',
  'profiles',
  'email',
  'public profiles do not expose email addresses'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select,insert,update,delete'),
  'anonymous users hold no profile privileges'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated users can select RLS-visible profiles'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.profiles',
    'insert,update,delete'
  ),
  'authenticated users cannot write profiles directly'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'owner@example.com',
    '{"display_name":"Local Organizer"}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'member@example.com',
    '{"full_name":"Local Runner"}'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'outsider@example.com',
    '{}'
  );

select results_eq(
  $$
    select display_name
    from public.profiles
    where user_id in (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333'
    )
    order by user_id
  $$,
  array['Local Organizer', 'Local Runner', 'Runner'],
  'new users receive a display-only public profile with safe fallbacks'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.flocks (id, name)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning Miles');

reset role;

insert into public.flock_members (flock_id, user_id, role, joined_at)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'member',
  '2026-01-02 12:00:00+00'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'an owner can read only profiles belonging to flockmates'
);

select results_eq(
  $$
    select display_name || ':' || role
    from public.list_flock_members('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  $$,
  array['Local Organizer:owner', 'Local Runner:member'],
  'the roster returns owner first and includes each member role'
);

select throws_ok(
  $$update public.profiles set display_name = 'Changed' where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'an authenticated user cannot update a profile directly'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'a member can read the complete shared roster identity set'
);

select is(
  (
    select count(*)
    from public.list_flock_members('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  ),
  2::bigint,
  'a member can load the shared flock roster'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select results_eq(
  $$select display_name from public.profiles$$,
  array['Runner'],
  'a runner without a flock can read only their own profile'
);

select is_empty(
  $$select * from public.list_flock_members('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,
  'a non-member cannot read a flock roster'
);

reset role;

update auth.users
set raw_user_meta_data = '{"display_name":"Updated Runner"}'
where id = '22222222-2222-2222-2222-222222222222';

select results_eq(
  $$
    select display_name
    from public.profiles
    where user_id = '22222222-2222-2222-2222-222222222222'
  $$,
  array['Updated Runner'],
  'changing authentication display metadata keeps the profile in sync'
);

select throws_ok(
  $$insert into public.profiles (user_id, display_name) values ('44444444-4444-4444-4444-444444444444', 'Missing User')$$,
  '23503',
  null,
  'a profile must belong to an authentication user'
);

select throws_ok(
  $$update public.profiles set display_name = '' where user_id = '33333333-3333-3333-3333-333333333333'$$,
  '23514',
  null,
  'the database rejects an empty display name'
);

select lives_ok(
  $$delete from auth.users where id = '33333333-3333-3333-3333-333333333333'$$,
  'deleting an authentication user cascades to their profile'
);

select is(
  (
    select count(*)
    from public.profiles
    where user_id = '33333333-3333-3333-3333-333333333333'
  ),
  0::bigint,
  'the deleted authentication user has no remaining profile'
);

select * from finish();
rollback;
