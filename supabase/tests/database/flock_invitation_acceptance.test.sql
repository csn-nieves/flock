begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select has_function(
  'public',
  'accept_flock_invitation',
  array['text'],
  'invitation acceptance function exists'
);

select is_definer(
  'public',
  'accept_flock_invitation',
  array['text'],
  'invitation acceptance is enforced through a security definer'
);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'invitee@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'replay@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'expired@example.com');

insert into public.flocks (id, owner_id, name)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Morning Miles'
);

set local role anon;

select throws_ok(
  $$
    select *
    from public.accept_flock_invitation(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    )
  $$,
  '42501',
  null,
  'anonymous users cannot accept invitations'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$
    select * from public.accept_flock_invitation('not-a-token')
  $$,
  'P0002',
  'Invitation is unavailable.',
  'malformed invitations use the same unavailable result'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table valid_invitation as
select *
from public.create_flock_invitation(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

create temporary table accepted_flock as
select *
from public.accept_flock_invitation(
  (select token from valid_invitation)
);

select is(
  (select id::text from accepted_flock),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'acceptance returns the joined flock identifier'
);

select is(
  (select name from accepted_flock),
  'Morning Miles',
  'acceptance returns the joined flock name'
);

reset role;

select ok(
  exists (
    select 1
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '22222222-2222-2222-2222-222222222222'
  ),
  'acceptance creates membership'
);

select is(
  (
    select role
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '22222222-2222-2222-2222-222222222222'
  ),
  'member',
  'accepted runners receive the member role'
);

select is(
  (
    select consumed_by::text
    from private.flock_invitations invitation
    join valid_invitation result
      on invitation.token_hash = extensions.digest(result.token, 'sha256')
  ),
  '22222222-2222-2222-2222-222222222222',
  'the invitation records its consuming runner'
);

select ok(
  (
    select consumed_at is not null
    from private.flock_invitations invitation
    join valid_invitation result
      on invitation.token_hash = extensions.digest(result.token, 'sha256')
  ),
  'the invitation records when it was consumed'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  format(
    'select * from public.accept_flock_invitation(%L)',
    (select token from valid_invitation)
  ),
  'P0002',
  'Invitation is unavailable.',
  'the consuming runner cannot reuse an invitation'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select throws_ok(
  format(
    'select * from public.accept_flock_invitation(%L)',
    (select token from valid_invitation)
  ),
  'P0002',
  'Invitation is unavailable.',
  'a consumed invitation cannot add another runner'
);

reset role;

select ok(
  not exists (
    select 1
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '33333333-3333-3333-3333-333333333333'
  ),
  'replaying an invitation creates no membership'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table expired_invitation as
select *
from public.create_flock_invitation(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

reset role;

update private.flock_invitations invitation
set
  created_at = clock_timestamp() - interval '48 hours',
  expires_at = clock_timestamp() - interval '24 hours'
from expired_invitation result
where invitation.token_hash = extensions.digest(result.token, 'sha256');

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select throws_ok(
  format(
    'select * from public.accept_flock_invitation(%L)',
    (select token from expired_invitation)
  ),
  'P0002',
  'Invitation is unavailable.',
  'expired invitations cannot be accepted'
);

reset role;

select ok(
  (
    select consumed_at is null and consumed_by is null
    from private.flock_invitations invitation
    join expired_invitation result
      on invitation.token_hash = extensions.digest(result.token, 'sha256')
  ),
  'an expired invitation remains unconsumed'
);

select ok(
  not exists (
    select 1
    from public.flock_members
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '44444444-4444-4444-4444-444444444444'
  ),
  'an expired invitation creates no membership'
);

select * from finish();
rollback;
