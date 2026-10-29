begin;

select plan(4);

select has_function(
  'public', 'cancel_event_series', array['uuid'],
  'recurring series cancellation has a protected RPC'
);

insert into auth.users (id, email, raw_user_meta_data)
values ('f2222222-2222-4222-8222-222222222222', 'series-owner@example.com', '{"display_name":"Series Owner"}');

set local role authenticated;
set local request.jwt.claim.sub = 'f2222222-2222-4222-8222-222222222222';

select public.create_event_series(
  null, 'Cancelable Series', '2099-10-23 09:00:00-04'::timestamptz,
  'Riverside', '', '[{"distanceTenths":50,"unit":"mi","paceSeconds":480}]'::jsonb,
  'America/New_York', 'daily', 1::smallint, '{}'::smallint[], null,
  null, null, null, 2::smallint, null
) as series_id \gset

select is(
  public.cancel_event_series(:'series_id'::uuid), 2::smallint,
  'series cancellation returns and cancels every future occurrence'
);

select is(
  (select count(*) from public.flock_events where series_id = :'series_id'::uuid and canceled_at is not null),
  2::bigint,
  'series cancellation marks every occurrence canceled'
);

select is(
  public.cancel_event_series(:'series_id'::uuid), 0::smallint,
  'repeating series cancellation is idempotent'
);

select * from finish();
rollback;
