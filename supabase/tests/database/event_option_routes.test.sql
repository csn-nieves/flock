begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select has_column('public', 'flock_event_run_options', 'route_coordinates', 'run options can store a normalized route line');
select has_column('public', 'flock_event_run_options', 'route_distance_meters', 'run options can store a calculated route distance');

insert into auth.users (id, email, raw_user_meta_data)
values
  ('f1111111-1111-4111-8111-111111111111', 'route-owner@example.com', '{"display_name":"Route Owner"}'),
  ('f2222222-2222-4222-8222-222222222222', 'route-outsider@example.com', '{"display_name":"Route Outsider"}');

set local role authenticated;
set local request.jwt.claim.sub = 'f1111111-1111-4111-8111-111111111111';

create temporary table mapped_event as
select * from public.create_user_event(
  'Mapped long run', clock_timestamp() + interval '7 days', 'River trail', 'Follow the mapped route.',
  '[{"distanceTenths":50,"paceSeconds":480,"unit":"mi","routeCoordinates":[[-74.01,40.7],[-74.009,40.701],[-74.008,40.702]],"routeDistanceMeters":280}]'::jsonb
);

select is(
  (select route_distance_meters from public.flock_event_run_options where event_id = (select id from mapped_event)),
  280,
  'event creation stores route distance'
);

select is(
  (select jsonb_array_length(route_coordinates) from public.flock_event_run_options where event_id = (select id from mapped_event)),
  3,
  'event creation stores normalized route coordinates'
);

select lives_ok(
  format(
    'select public.update_flock_event(%L, %L, %L, %L, %L, %L::jsonb)',
    (select id from mapped_event), 'Mapped long run', (select starts_at from mapped_event), 'River trail', 'Updated route.',
    (select jsonb_build_array(jsonb_build_object(
      'id', option.id, 'distanceTenths', 50, 'paceSeconds', 480, 'unit', 'mi',
      'routeCoordinates', jsonb_build_array(jsonb_build_array(-74.02, 40.71), jsonb_build_array(-74.01, 40.72)),
      'routeDistanceMeters', 1400
    ))::text from public.flock_event_run_options as option where option.event_id = (select id from mapped_event))
  ),
  'event updates can replace a route'
);

select is(
  (select route_distance_meters from public.flock_event_run_options where event_id = (select id from mapped_event)),
  1400,
  'route replacement persists'
);

select throws_ok(
  $$select public.create_user_event('Missing route distance', clock_timestamp() + interval '7 days', 'Trail', '', '[{"distanceTenths":50,"paceSeconds":480,"unit":"mi","routeCoordinates":[[-74,40],[-73,41]]}]'::jsonb)$$,
  '23514', 'Provide between one and eight valid run options.', 'a route line requires its calculated distance'
);

select throws_ok(
  $$select public.create_user_event('Invalid latitude', clock_timestamp() + interval '7 days', 'Trail', '', '[{"distanceTenths":50,"paceSeconds":480,"unit":"mi","routeCoordinates":[[-74,95],[-73,41]],"routeDistanceMeters":1000}]'::jsonb)$$,
  '23514', 'Provide between one and eight valid run options.', 'route coordinates must stay inside geographic bounds'
);

select throws_ok(
  $$select public.create_user_event('One point', clock_timestamp() + interval '7 days', 'Trail', '', '[{"distanceTenths":50,"paceSeconds":480,"unit":"mi","routeCoordinates":[[-74,40]],"routeDistanceMeters":1000}]'::jsonb)$$,
  '23514', 'Provide between one and eight valid run options.', 'a route requires at least two points'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'f2222222-2222-4222-8222-222222222222';

select is(
  (select count(*) from public.flock_event_run_options where event_id = (select id from mapped_event)),
  0::bigint,
  'event route coordinates remain hidden from unauthorized users'
);

select is(
  (select count(*) from public.flock_events where id = (select id from mapped_event)),
  0::bigint,
  'the unauthorized user cannot read the parent personal event'
);

select * from finish();

rollback;
