begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'runner@flock.com',
    '',
    '2026-01-15 12:00:00+00',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Local Runner"}',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'organizer@flock.com',
    '',
    '2026-01-15 12:00:00+00',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Local Organizer"}',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  );

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '31111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"runner@flock.com","email_verified":true,"phone_verified":false}',
    'email',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '32222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"organizer@flock.com","email_verified":true,"phone_verified":false}',
    'email',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  );

insert into public.flocks (id, owner_id, name, created_at, updated_at)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'Sunrise Striders',
    '2026-01-16 12:00:00+00',
    '2026-01-16 12:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '11111111-1111-4111-8111-111111111111',
    'Riverside Tempo Club',
    '2026-01-17 12:00:00+00',
    '2026-01-17 12:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '22222222-2222-4222-8222-222222222222',
    'Harbor Long Run',
    '2026-01-18 12:00:00+00',
    '2026-01-18 12:00:00+00'
  );

insert into public.flock_members (flock_id, user_id, role, joined_at)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  '11111111-1111-4111-8111-111111111111',
  'member',
  '2026-01-19 12:00:00+00'
);

commit;
