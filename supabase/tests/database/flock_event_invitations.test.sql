begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select has_function(
  'public',
  'create_flock_event_invitations',
  array['uuid', 'uuid'],
  'whole-flock personal-event invitation creation exists'
);

select is_definer(
  'public',
  'create_flock_event_invitations',
  array['uuid', 'uuid'],
  'whole-flock invitation expansion is enforced server-side'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_flock_event_invitations(uuid, uuid)',
    'execute'
  ),
  'authenticated users can create whole-flock invitations'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_flock_event_invitations(uuid, uuid)',
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
  ''
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select throws_ok(
  $$
    select *
    from public.create_flock_event_invitations(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )
  $$,
  '42501',
  'Personal event ownership is required.',
  'a non-owner cannot invite a flock to another runner’s event'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table flock_invitation_snapshot as
select *
from public.create_flock_event_invitations(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

select is(
  (select count(*) from flock_invitation_snapshot),
  2::bigint,
  'one invitation is returned for every member in the creation-time roster'
);

select set_eq(
  $$select recipient_user_id from flock_invitation_snapshot$$,
  $$values
    ('22222222-2222-2222-2222-222222222222'::uuid),
    ('33333333-3333-3333-3333-333333333333'::uuid)$$,
  'the returned recipients match the complete current roster'
);

select is(
  (select count(distinct token) from flock_invitation_snapshot),
  2::bigint,
  'every snapshotted member receives a unique token'
);

select is(
  (select count(distinct expires_at) from flock_invitation_snapshot),
  1::bigint,
  'the invitation batch shares one expiration deadline'
);

select ok(
  (
    select bool_and(
      expires_at > clock_timestamp() + interval '23 hours 59 minutes'
      and expires_at <= clock_timestamp() + interval '24 hours'
    )
    from flock_invitation_snapshot
  ),
  'every invitation expires after approximately 24 hours'
);

reset role;

select is(
  (
    select count(*)
    from private.event_invitations as invitation
    join flock_invitation_snapshot as result
      on invitation.token_hash = extensions.digest(result.token, 'sha256')
    where invitation.recipient_user_id = result.recipient_user_id
  ),
  2::bigint,
  'private invitation rows bind each token to its intended recipient'
);

delete from public.flock_members
where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and user_id = '33333333-3333-3333-3333-333333333333';

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '44444444-4444-4444-4444-444444444444',
  'member'
);

select ok(
  exists (
    select 1
    from flock_invitation_snapshot
    where recipient_user_id = '33333333-3333-3333-3333-333333333333'
  )
  and not exists (
    select 1
    from flock_invitation_snapshot
    where recipient_user_id = '44444444-4444-4444-4444-444444444444'
  ),
  'later membership changes do not rewrite the invitation snapshot'
);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select throws_ok(
  format(
    'select * from public.accept_event_invitation(%L)',
    (
      select token
      from flock_invitation_snapshot
      where recipient_user_id = '33333333-3333-3333-3333-333333333333'
    )
  ),
  'P0002',
  'Invitation is unavailable.',
  'a runner who joins later cannot use a snapshotted member’s link'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

create temporary table accepted_event as
select *
from public.accept_event_invitation(
  (
    select token
    from flock_invitation_snapshot
    where recipient_user_id = '33333333-3333-3333-3333-333333333333'
  )
);

select is(
  (select id::text from accepted_event),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'a member who left after creation can still accept their invitation'
);

select throws_ok(
  format(
    'select * from public.accept_event_invitation(%L)',
    (
      select token
      from flock_invitation_snapshot
      where recipient_user_id = '33333333-3333-3333-3333-333333333333'
    )
  ),
  'P0002',
  'Invitation is unavailable.',
  'a whole-flock invitation remains single-use after acceptance'
);

select * from finish();

rollback;
