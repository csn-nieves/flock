begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

select has_table('public', 'flocks', 'flocks table exists');
select has_table('public', 'flock_members', 'flock_members table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.flocks'::regclass),
  'flocks has row level security enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.flock_members'::regclass),
  'flock_members has row level security enabled'
);

select has_index(
  'public',
  'flock_members',
  'flock_members_user_flock_idx',
  'membership lookups by user are indexed'
);

select has_index(
  'public',
  'flock_members',
  'flock_members_one_owner_idx',
  'each flock has at most one owner membership'
);

select has_index(
  'public',
  'flocks',
  'flocks_owner_id_idx',
  'owner-backed authorization lookups are indexed'
);

select ok(
  not has_table_privilege('anon', 'public.flocks', 'select,insert,update,delete'),
  'anonymous users hold no flock privileges'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.flock_members',
    'select,insert,update,delete'
  ),
  'anonymous users hold no membership privileges'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.flock_members',
    'insert,update,delete'
  ),
  'authenticated users cannot write memberships directly'
);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'member@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'outsider@example.com');

set local role anon;

select throws_ok(
  $$select * from public.flocks$$,
  '42501',
  null,
  'anonymous users cannot read flocks'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$
    insert into public.flocks (id, name)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning Miles')
    returning owner_id::text
  $$,
  array['11111111-1111-1111-1111-111111111111'],
  'an authenticated user creates a flock they own'
);

select results_eq(
  $$
    select role
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '11111111-1111-1111-1111-111111111111'
  $$,
  array['owner'],
  'creating a flock atomically creates its owner membership'
);

select is(
  (select count(*) from public.flock_members),
  1::bigint,
  'the owner can read their flock roster'
);

reset role;

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'member'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.flocks),
  1::bigint,
  'a member can read their flock'
);

select is(
  (select count(*) from public.flock_members),
  2::bigint,
  'a member can read the complete flock roster'
);

select is_empty(
  $$
    update public.flocks
    set name = 'Changed by member'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning name
  $$,
  'a member cannot update a flock they do not own'
);

select is_empty(
  $$
    delete from public.flocks
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning id
  $$,
  'a member cannot delete a flock they do not own'
);

select throws_ok(
  $$
    insert into public.flock_members (flock_id, user_id)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '33333333-3333-3333-3333-333333333333'
    )
  $$,
  '42501',
  null,
  'a member cannot add another member directly'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*) from public.flocks),
  0::bigint,
  'a non-member cannot read a flock'
);

select is(
  (select count(*) from public.flock_members),
  0::bigint,
  'a non-member cannot read a flock roster'
);

select throws_ok(
  $$
    insert into public.flocks (id, owner_id, name)
    values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      '11111111-1111-1111-1111-111111111111',
      'Someone Else''s Flock'
    )
  $$,
  '42501',
  null,
  'an authenticated user cannot create a flock for another owner'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$
    update public.flocks
    set name = 'Sunrise Miles'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning name
  $$,
  array['Sunrise Miles'],
  'the owner can update their flock'
);

select throws_ok(
  $$
    update public.flocks
    set owner_id = '22222222-2222-2222-2222-222222222222'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  '42501',
  null,
  'the owner cannot transfer ownership through a direct update'
);

reset role;

select throws_ok(
  $$
    update public.flock_members
    set role = 'owner'
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '22222222-2222-2222-2222-222222222222'
  $$,
  '23505',
  null,
  'the database rejects a second owner membership'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$
    delete from public.flocks
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning id::text
  $$,
  array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
  'the owner can delete their flock'
);

reset role;

select is(
  (
    select count(*)
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'deleting a flock removes its memberships'
);

select * from finish();
rollback;
