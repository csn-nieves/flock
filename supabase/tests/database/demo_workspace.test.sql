begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '99999999-9999-4999-8999-999999999999',
  null,
  '{"is_anonymous": true}'::jsonb
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-999999999999","is_anonymous":true}';

select lives_ok(
  $$select public.initialize_demo_workspace()$$,
  'an anonymous user can initialize a demo without seeded production records'
);

select is(
  (select count(*) from public.flocks where owner_id = '99999999-9999-4999-8999-999999999999'),
  3::bigint,
  'demo initialization creates three demo flocks for the session'
);

select is(
  (select count(*) from public.flock_events where created_by = '99999999-9999-4999-8999-999999999999'),
  5::bigint,
  'demo initialization creates flock and personal events'
);

select ok(
  (select count(*) > 0
   from public.flock_event_run_options as option
   join public.flock_events as event on event.id = option.event_id
   where event.created_by = '99999999-9999-4999-8999-999999999999'
     and option.route_coordinates is not null),
  'demo events include a route-backed run option'
);

select lives_ok(
  $$select public.initialize_demo_workspace()$$,
  'demo initialization is idempotent for the same anonymous session'
);

select is(
  (select count(*) from public.flock_events where created_by = '99999999-9999-4999-8999-999999999999'),
  5::bigint,
  'reinitializing does not duplicate demo events'
);

select * from finish();
rollback;
