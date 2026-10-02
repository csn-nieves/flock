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
    '{"provider":"email","providers":["email"],"role":"superadmin"}',
    '{"display_name":"Local Organizer"}',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'maya.chen@flock.com',
    '',
    '2026-01-15 12:00:00+00',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Maya Chen"}',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'jordan.alvarez@flock.com',
    '',
    '2026-01-15 12:00:00+00',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Jordan Alvarez"}',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'alexandria.montgomery@flock.com',
    '',
    '2026-01-15 12:00:00+00',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Alexandria Montgomery-Rutherford"}',
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
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    '{"sub":"33333333-3333-4333-8333-333333333333","email":"maya.chen@flock.com","email_verified":true,"phone_verified":false}',
    'email',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '44444444-4444-4444-8444-444444444444',
    '44444444-4444-4444-8444-444444444444',
    '{"sub":"44444444-4444-4444-8444-444444444444","email":"jordan.alvarez@flock.com","email_verified":true,"phone_verified":false}',
    'email',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00',
    '2026-01-15 12:00:00+00'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '55555555-5555-4555-8555-555555555555',
    '55555555-5555-4555-8555-555555555555',
    '{"sub":"55555555-5555-4555-8555-555555555555","email":"alexandria.montgomery@flock.com","email_verified":true,"phone_verified":false}',
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
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '33333333-3333-4333-8333-333333333333',
    'member',
    '2026-01-19 11:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '11111111-1111-4111-8111-111111111111',
    'member',
    '2026-01-19 12:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '33333333-3333-4333-8333-333333333333',
    'member',
    '2026-01-19 13:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '44444444-4444-4444-8444-444444444444',
    'member',
    '2026-01-19 14:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '55555555-5555-4555-8555-555555555555',
    'member',
    '2026-01-19 15:00:00+00'
  );

-- Add a larger deterministic local dataset for exercising search, rosters,
-- event lists, attendance, and invitation flows without manual setup.
do $$
declare
  seed_user_id uuid;
begin
  for user_number in 6..50 loop
    seed_user_id := md5('seed-user-' || user_number)::uuid;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      seed_user_id,
      'authenticated',
      'authenticated',
      format('runner%02s@flock.com', user_number),
      '',
      '2026-01-15 12:00:00+00',
      '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', format('Runner %02s', user_number)),
      '2026-01-15 12:00:00+00',
      '2026-01-15 12:00:00+00'
    );
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      md5('seed-identity-' || user_number)::uuid,
      seed_user_id,
      seed_user_id,
      jsonb_build_object(
        'sub', seed_user_id::text,
        'email', format('runner%02s@flock.com', user_number),
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      '2026-01-15 12:00:00+00',
      '2026-01-15 12:00:00+00',
      '2026-01-15 12:00:00+00'
    );
  end loop;
end;
$$;

do $$
declare
  seed_flock_id uuid;
  owner_id uuid;
begin
  for flock_number in 4..10 loop
    seed_flock_id := md5('seed-flock-' || flock_number)::uuid;
    owner_id := md5('seed-user-' || (flock_number + 5))::uuid;
    insert into public.flocks (id, owner_id, name, created_at, updated_at)
    values (
      seed_flock_id,
      owner_id,
      format('Neighborhood Run Club %02s', flock_number),
      '2026-02-01 12:00:00+00'::timestamptz + make_interval(days => flock_number),
      '2026-02-01 12:00:00+00'::timestamptz + make_interval(days => flock_number)
    );

    for member_number in 1..5 loop
      insert into public.flock_members (flock_id, user_id, role, joined_at)
      values (
        seed_flock_id,
        md5('seed-user-' || (((flock_number + member_number) % 45) + 6))::uuid,
        'member',
        '2026-02-10 12:00:00+00'::timestamptz + make_interval(days => member_number)
      );
    end loop;
  end loop;
end;
$$;

do $$
declare
  event_id uuid;
  flock_id uuid;
  owner_id uuid;
begin
  for event_number in 1..20 loop
    if event_number <= 3 then
      flock_id := format('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa%s', event_number)::uuid;
      select flocks.owner_id into owner_id from public.flocks where id = flock_id;
    else
      flock_id := md5('seed-flock-' || (((event_number - 1) % 7) + 4))::uuid;
      select flocks.owner_id into owner_id from public.flocks where id = flock_id;
    end if;
    event_id := md5('seed-flock-event-' || event_number)::uuid;
    insert into public.flock_events (
      id, flock_id, created_by, title, starts_at, location, description
    ) values (
      event_id,
      flock_id,
      owner_id,
      format('Group run %02s', event_number),
      '2026-10-03 08:00:00+00'::timestamptz + make_interval(days => event_number),
      format('Park %02s', event_number),
      'A seeded group run for local development.'
    );
  end loop;
end;
$$;

do $$
declare
  event_id uuid;
  owner_id uuid;
  invitee_id uuid;
begin
  for event_number in 1..15 loop
    event_id := md5('seed-personal-event-' || event_number)::uuid;
    owner_id := md5('seed-user-' || (((event_number - 1) % 45) + 6))::uuid;
    invitee_id := md5('seed-user-' || (((event_number + 10) % 45) + 6))::uuid;
    insert into public.flock_events (
      id, flock_id, created_by, title, starts_at, location, description
    ) values (
      event_id,
      null,
      owner_id,
      format('Personal run %02s', event_number),
      '2026-10-04 07:30:00+00'::timestamptz + make_interval(days => event_number),
      format('Trailhead %02s', event_number),
      'A seeded personal event for local development.'
    );
    insert into private.event_invitations (
      event_id, created_by, token_hash, created_at, expires_at, consumed_at, consumed_by
    ) values (
      event_id,
      owner_id,
      extensions.digest(format('seed-event-token-%s', event_number), 'sha256'),
      '2026-10-01 12:00:00+00',
      '2026-10-02 12:00:00+00'::timestamptz + make_interval(days => event_number + 1),
      '2026-10-02 12:00:00+00',
      invitee_id
    );
    insert into public.flock_event_attendance (event_id, user_id, response)
    values
      (event_id, owner_id, case event_number % 3 when 0 then 'in'::public.flock_event_response when 1 then 'maybe'::public.flock_event_response else 'out'::public.flock_event_response end),
      (event_id, invitee_id, case event_number % 2 when 0 then 'in'::public.flock_event_response else 'maybe'::public.flock_event_response end);
  end loop;
end;
$$;

commit;
