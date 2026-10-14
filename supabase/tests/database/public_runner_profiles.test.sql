begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select has_function(
  'public',
  'get_runner_profile',
  array['uuid'],
  'the public runner profile function exists'
);
select ok(
  has_function_privilege('authenticated', 'public.get_runner_profile(uuid)', 'execute'),
  'authenticated users can read public runner profiles'
);
select ok(
  not has_function_privilege('anon', 'public.get_runner_profile(uuid)', 'execute'),
  'anonymous users cannot read runner profiles'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '11111111-1111-1111-1111-111111111111',
  'profile-owner@example.com',
  '{"display_name":"Profile Runner"}'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$
    select display_name
    from public.get_runner_profile('11111111-1111-1111-1111-111111111111')
  $$,
  array['Profile Runner'::text],
  'an authenticated runner can read the requested public identity'
);
select results_eq(
  $$
    select location
    from public.get_runner_profile('11111111-1111-1111-1111-111111111111')
  $$,
  array[null::text],
  'public profiles keep coarse location optional'
);
select is(
  (select count(*) from public.get_runner_profile('22222222-2222-2222-2222-222222222222')),
  0::bigint,
  'missing runner profiles return no rows'
);

reset role;

select * from finish();
rollback;
