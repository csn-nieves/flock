begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

select has_table(
  'private',
  'flock_invitations',
  'private flock invitations table exists'
);

select has_function(
  'public',
  'create_flock_invitation',
  array['uuid'],
  'invitation creation function exists'
);

select is_definer(
  'public',
  'create_flock_invitation',
  array['uuid'],
  'invitation creation enforces membership through a security definer'
);

select hasnt_column(
  'private',
  'flock_invitations',
  'token',
  'raw invitation tokens are not stored'
);

select has_column(
  'private',
  'flock_invitations',
  'consumed_at',
  'invitations record when they are consumed'
);

select has_column(
  'private',
  'flock_invitations',
  'consumed_by',
  'invitations record which runner consumed them'
);

select ok(
  not has_table_privilege(
    'anon',
    'private.flock_invitations',
    'select,insert,update,delete'
  ),
  'anonymous users hold no invitation table privileges'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'private.flock_invitations',
    'select,insert,update,delete'
  ),
  'authenticated users hold no direct invitation table privileges'
);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'member@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'outsider@example.com');

insert into public.flocks (id, owner_id, name)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Morning Miles'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'member'
);

set local role anon;

select throws_ok(
  $$
    select *
    from public.create_flock_invitation(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )
  $$,
  '42501',
  null,
  'anonymous users cannot create invitations'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select throws_ok(
  $$
    select *
    from public.create_flock_invitation(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )
  $$,
  '42501',
  'Flock membership is required.',
  'non-members cannot create invitations'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table owner_invitation_result as
select *
from public.create_flock_invitation(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

select is(
  (select char_length(token) from owner_invitation_result),
  64,
  'owner invitations return a 256-bit hexadecimal token'
);

select ok(
  (
    select abs(
      extract(epoch from (expires_at - clock_timestamp() - interval '24 hours'))
    ) < 5
    from owner_invitation_result
  ),
  'invitations expire 24 hours after creation'
);

reset role;

select is(
  (
    select count(*)
    from private.flock_invitations invitation
    join owner_invitation_result result
      on invitation.token_hash = extensions.digest(result.token, 'sha256')
  ),
  1::bigint,
  'only the invitation token hash is stored'
);

select is(
  (
    select created_by::text
    from private.flock_invitations
    limit 1
  ),
  '11111111-1111-1111-1111-111111111111',
  'the invitation records its creating member'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

create temporary table member_invitation_result as
select *
from public.create_flock_invitation(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

select isnt(
  (select token from member_invitation_result),
  (select token from owner_invitation_result),
  'members can create distinct invitation links'
);

reset role;

select is(
  (
    select count(*)
    from private.flock_invitations
    where flock_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  2::bigint,
  'members can create multiple distinct single-use invitations'
);

select is(
  (
    select count(*)
    from private.flock_invitations invitation
    where invitation.expires_at <= invitation.created_at
  ),
  0::bigint,
  'stored invitation expiry always follows creation'
);

select * from finish();
rollback;
