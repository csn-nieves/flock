begin;

select plan(8);

select has_function(
  'public',
  'remove_flock_member',
  array['uuid', 'uuid'],
  'superadmin membership removal is available through a reviewed function'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.remove_flock_member(uuid, uuid)',
    'execute'
  ),
  'authenticated sessions can call the membership removal boundary'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.remove_flock_member(uuid, uuid)',
    'execute'
  ),
  'anonymous sessions cannot call membership removal'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{}}';

select throws_ok(
  $$
    select public.remove_flock_member(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      '33333333-3333-4333-8333-333333333333'
    )
  $$,
  '42501',
  'Superadmin access is required.',
  'a regular authenticated runner cannot remove a flock member'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","app_metadata":{"role":"superadmin"}}';

select throws_ok(
  $$
    select public.remove_flock_member(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      '22222222-2222-4222-8222-222222222222'
    )
  $$,
  '23514',
  'Flock owners cannot be removed.',
  'a superadmin cannot remove the canonical flock owner'
);

select lives_ok(
  $$
    select public.remove_flock_member(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      '33333333-3333-4333-8333-333333333333'
    )
  $$,
  'a superadmin can remove an ordinary flock member'
);

select is(
  (
    select count(*)
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
      and user_id = '33333333-3333-4333-8333-333333333333'
  ),
  0::bigint,
  'membership removal deletes only the selected membership'
);

select lives_ok(
  $$
    select public.remove_flock_member(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      '33333333-3333-4333-8333-333333333333'
    )
  $$,
  'repeating a completed membership removal is safe'
);

reset role;

select * from finish();

rollback;
