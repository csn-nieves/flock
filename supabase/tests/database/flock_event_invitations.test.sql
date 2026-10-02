begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

select has_function(
  'public',
  'create_flock_event_invitation',
  array['uuid', 'uuid'],
  'live whole-flock personal-event invitation creation exists'
);

select is_definer(
  'public',
  'create_flock_event_invitation',
  array['uuid', 'uuid'],
  'whole-flock invitation authorization is enforced server-side'
);

select has_function(
  'public',
  'list_pending_event_invitations',
  array[]::text[],
  'pending in-app event invitations can be listed'
);

select has_function(
  'public',
  'accept_event_invitation_by_id',
  array['uuid'],
  'in-app event invitations can be accepted without a link'
);

select has_table(
  'private',
  'event_invitation_acceptances',
  'per-runner universal invitation acceptances are stored privately'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_flock_event_invitation(uuid, uuid)',
    'execute'
  ),
  'authenticated users can create whole-flock invitations'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_flock_event_invitation(uuid, uuid)',
    'execute'
  ),
  'anonymous users cannot create whole-flock invitations'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'event-owner@example.com',
    '{"display_name":"Event Owner"}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'flock-owner@example.com',
    '{"display_name":"Flock Owner"}'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'current-member@example.com',
    '{"display_name":"Current Member"}'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'later-member@example.com',
    '{"display_name":"Later Member"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Harbor Long Run'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  'member'
);

insert into public.flock_events (
  id,
  flock_id,
  created_by,
  title,
  starts_at,
  location,
  description
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  null,
  '11111111-1111-1111-1111-111111111111',
  'Cross-flock social run',
  clock_timestamp() + interval '7 days',
  'Riverside Park',
  'Easy miles together.'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select throws_ok(
  $$
    select *
    from public.create_flock_event_invitation(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )
  $$,
  '42501',
  'Personal event ownership is required.',
  'a non-owner cannot invite a flock to another runner’s event'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table live_flock_invitation as
select *
from public.create_flock_event_invitation(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

create temporary table targeted_invitation as
select *
from public.create_targeted_event_invitation(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111'
);

create temporary table open_invitation as
select *
from public.create_event_invitation(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

select is(
  (select count(*) from live_flock_invitation),
  1::bigint,
  'one universal invitation is returned for the flock'
);

select ok(
  (
    select expires_at > clock_timestamp() + interval '6 days 23 hours 59 minutes'
      and expires_at <= clock_timestamp() + interval '7 days'
    from live_flock_invitation
  ),
  'the universal invitation expires after approximately seven days'
);

select ok(
  (
    select expires_at > clock_timestamp() + interval '6 days 23 hours 59 minutes'
      and expires_at <= clock_timestamp() + interval '7 days'
    from targeted_invitation
  ),
  'a targeted runner invitation expires after approximately seven days'
);

select ok(
  (
    select expires_at > clock_timestamp() + interval '6 days 23 hours 59 minutes'
      and expires_at <= clock_timestamp() + interval '7 days'
    from open_invitation
  ),
  'an open event invitation expires after approximately seven days'
);

reset role;

select is(
  (
    select count(*)
    from private.event_invitations as invitation
    join live_flock_invitation as result
      on invitation.token_hash = extensions.digest(result.token, 'sha256')
    where invitation.flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and invitation.recipient_user_id is null
  ),
  1::bigint,
  'the private invitation binds the event to the flock rather than its roster'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*) from public.list_pending_event_invitations()),
  1::bigint,
  'a current member sees the invitation in app'
);

select is(
  (select audience_name from public.list_pending_event_invitations()),
  'Harbor Long Run',
  'the in-app invitation identifies its flock audience'
);

reset role;

delete from public.flock_members
where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and user_id = '33333333-3333-3333-3333-333333333333';

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*) from public.list_pending_event_invitations()),
  0::bigint,
  'a runner who leaves before accepting no longer sees the invitation'
);

select throws_ok(
  format(
    'select * from public.accept_event_invitation(%L)',
    (select token from live_flock_invitation)
  ),
  'P0002',
  'Invitation is unavailable.',
  'a runner who leaves before accepting cannot use the universal link'
);

reset role;

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '44444444-4444-4444-4444-444444444444',
  'member'
);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is(
  (select count(*) from public.list_pending_event_invitations()),
  1::bigint,
  'a runner who joins while the invitation is active becomes eligible'
);

create temporary table accepted_in_app as
select *
from public.accept_event_invitation_by_id(
  (select invitation_id from public.list_pending_event_invitations())
);

select is(
  (select id::text from accepted_in_app),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'a newly eligible member can accept directly in app'
);

select is(
  (select count(*) from public.list_pending_event_invitations()),
  0::bigint,
  'an accepted invitation leaves the runner’s pending list'
);

reset role;

delete from public.flock_members
where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and user_id = '44444444-4444-4444-4444-444444444444';

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is(
  (
    select count(*)
    from public.flock_events
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  1::bigint,
  'an accepted runner keeps event access after leaving the flock'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

create temporary table accepted_by_link as
select *
from public.accept_event_invitation(
  (select token from live_flock_invitation)
);

select is(
  (select id::text from accepted_by_link),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'another current member can accept the same universal link'
);

select throws_ok(
  format(
    'select * from public.accept_event_invitation(%L)',
    (select token from live_flock_invitation)
  ),
  'P0002',
  'Invitation is unavailable.',
  'each member can accept the universal invitation only once'
);

select * from finish();

rollback;
