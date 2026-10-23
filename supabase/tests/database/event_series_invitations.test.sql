begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

grant select on private.event_invitations to authenticated;

select has_function(
  'public',
  'propagate_event_invitation',
  array['uuid'],
  'series invitations can be propagated through a protected function'
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  'f1111111-1111-4111-8111-111111111111',
  'series-inviter@example.com',
  '{"display_name":"Series Inviter"}'
);

set local role authenticated;
set local request.jwt.claim.sub = 'f1111111-1111-4111-8111-111111111111';

select public.create_event_series(
  null,
  'Recurring Invite Run',
  '2026-10-23 09:00:00-04'::timestamptz,
  'Riverside',
  '',
  '[{"distanceTenths":50,"unit":"mi","paceSeconds":480}]'::jsonb,
  'America/New_York',
  'daily',
  1::smallint,
  '{}'::smallint[],
  null,
  null,
  null,
  null,
  3::smallint,
  null
) as series_id \gset

select is(
  (select count(*) from public.flock_events where series_id = :'series_id'::uuid),
  3::bigint,
  'series creation materializes three independent events'
);

select public.create_event_invitation(
  (select id from public.flock_events where series_id = :'series_id'::uuid and series_position = 1)
) as invitation \gset

select is(
  public.propagate_event_invitation(
    (select id from private.event_invitations where event_id = (select id from public.flock_events where series_id = :'series_id'::uuid and series_position = 1))
  ),
  2,
  'source invitations propagate to the other occurrences'
);

select is(
  (select count(*) from private.event_invitations where event_id in (select id from public.flock_events where series_id = :'series_id'::uuid)),
  3::bigint,
  'each occurrence has an independent invitation record'
);

select is(
  (select count(distinct token_hash) from private.event_invitations where event_id in (select id from public.flock_events where series_id = :'series_id'::uuid)),
  3::bigint,
  'each occurrence receives a fresh invitation token hash'
);

select is(
  (select count(*) from public.flock_event_attendance where event_id in (select id from public.flock_events where series_id = :'series_id'::uuid)),
  0::bigint,
  'invitation propagation does not copy RSVP state'
);

select * from finish();
rollback;
