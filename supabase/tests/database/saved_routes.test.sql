begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select has_table('public', 'saved_routes', 'saved routes are stored publicly behind RLS');
select has_column('public', 'saved_routes', 'owner_id', 'saved routes belong to one runner');
select has_column('public', 'saved_routes', 'route_coordinates', 'saved routes keep normalized geometry');
select has_column('public', 'saved_routes', 'route_distance_meters', 'saved routes keep calculated distance');
select has_function('public', 'create_saved_route', array['text', 'jsonb', 'integer'], 'saved routes are created through a protected function');
select has_function('public', 'rename_saved_route', array['uuid', 'text'], 'saved routes can be renamed through a protected function');
select has_function('public', 'delete_saved_route', array['uuid'], 'saved routes can be deleted through a protected function');

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'saved-route-owner@example.com',
    '{"display_name":"Route Owner"}'
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'saved-route-other@example.com',
    '{"display_name":"Other Runner"}'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-4111-8111-111111111111';

create temporary table created_saved_route as
select *
from public.create_saved_route(
  '  Riverside Loop  ',
  '[[ -74.01, 40.70 ], [ -74.00, 40.71 ]]'::jsonb,
  1609
);

select is(
  (select name from created_saved_route),
  'Riverside Loop',
  'route creation normalizes the private route name'
);

select is(
  (select count(*) from public.saved_routes),
  1::bigint,
  'the owner can read their saved route'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a2222222-2222-4222-8222-222222222222';

select is(
  (select count(*) from public.saved_routes),
  0::bigint,
  'another runner cannot read saved routes they do not own'
);

select throws_ok(
  format(
    'select public.rename_saved_route(%L, %L)',
    (select id from created_saved_route),
    'Stolen route'
  ),
  '42501',
  'Saved route ownership is required.',
  'another runner cannot rename a saved route'
);

select throws_ok(
  format(
    'select public.delete_saved_route(%L)',
    (select id from created_saved_route)
  ),
  '42501',
  'Saved route ownership is required.',
  'another runner cannot delete a saved route'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-4111-8111-111111111111';

select is(
  (
    select name
    from public.rename_saved_route(
      (select id from created_saved_route),
      'Morning River Loop'
    )
  ),
  'Morning River Loop',
  'the owner can rename a saved route'
);

select is(
  public.delete_saved_route((select id from created_saved_route))::text,
  (select id::text from created_saved_route),
  'the owner can delete a saved route'
);

select is(
  (select count(*) from public.saved_routes),
  0::bigint,
  'deleting a saved route removes it from the owner library'
);

select * from finish();

rollback;
