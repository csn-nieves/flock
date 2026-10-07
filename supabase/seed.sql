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

insert into public.flocks (
  id, owner_id, name, location, description, created_at, updated_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'Sunrise Striders',
    'Eastbank Esplanade, Portland',
    'Easy sunrise miles with regroup points and room for every pace.',
    '2026-01-16 12:00:00+00',
    '2026-01-16 12:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '11111111-1111-4111-8111-111111111111',
    'Riverside Tempo Club',
    'Waterfront Park, Portland',
    'Structured weekday workouts for runners building speed together.',
    '2026-01-17 12:00:00+00',
    '2026-01-17 12:00:00+00'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '22222222-2222-4222-8222-222222222222',
    'Harbor Long Run',
    'Harbor Loop, Vancouver',
    'Conversational weekend long runs with water stops along the route.',
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
  seed_locations text[] := array[
    'Alberta Park, Portland',
    'Forest Park, Portland',
    'Sellwood Riverfront, Portland',
    'Mount Tabor, Portland',
    'Cully Park, Portland',
    'Lacamas Lake, Camas',
    'Downtown Beaverton'
  ];
  seed_descriptions text[] := array[
    'Social neighborhood miles followed by coffee nearby.',
    'Trail-focused runs with climbing options and regular regrouping.',
    'Flat river loops for new runners and returning regulars.',
    'Hill sessions that stay welcoming through every repeat.',
    'Family-friendly evening runs on quiet neighborhood routes.',
    'Mixed-surface weekend adventures at a relaxed pace.',
    'After-work runs connecting transit, parks, and local streets.'
  ];
begin
  for flock_number in 4..10 loop
    seed_flock_id := md5('seed-flock-' || flock_number)::uuid;
    owner_id := md5('seed-user-' || (flock_number + 5))::uuid;
    insert into public.flocks (
      id, owner_id, name, location, description, created_at, updated_at
    )
    values (
      seed_flock_id,
      owner_id,
      format('Neighborhood Run Club %02s', flock_number),
      seed_locations[flock_number - 3],
      seed_descriptions[flock_number - 3],
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
    insert into public.flock_event_run_options (
      id, event_id, distance_label, distance_tenths, distance_unit,
      pace_label, pace_seconds, pace_unit, position,
      route_coordinates, route_distance_meters
    ) values (
      md5('seed-flock-event-option-' || event_number)::uuid,
      event_id,
      case when event_number % 2 = 0 then '10 km' else '5 mi' end,
      case when event_number % 2 = 0 then 100 else 50 end,
      case when event_number % 2 = 0 then 'km' else 'mi' end,
      case when event_number % 2 = 0 then '5:30/km' else '8:30/mi' end,
      case when event_number % 2 = 0 then 330 else 510 end,
      case when event_number % 2 = 0 then 'km' else 'mi' end,
      0,
      case when event_number <= 3 then jsonb_build_array(
        jsonb_build_array(-74.0100, 40.7000),
        jsonb_build_array(-74.0050, 40.7040),
        jsonb_build_array(-73.9990, 40.7080),
        jsonb_build_array(-73.9940, 40.7030)
      ) else null end,
      case when event_number <= 3 then 8050 else null end
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
    insert into public.flock_event_run_options (
      id, event_id, distance_label, distance_tenths, distance_unit,
      pace_label, pace_seconds, pace_unit, position,
      route_coordinates, route_distance_meters
    ) values (
      md5('seed-personal-event-option-' || event_number)::uuid,
      event_id,
      case when event_number % 2 = 0 then '5 km' else '3.1 mi' end,
      case when event_number % 2 = 0 then 50 else 31 end,
      case when event_number % 2 = 0 then 'km' else 'mi' end,
      case when event_number % 2 = 0 then '5:45/km' else '9:00/mi' end,
      case when event_number % 2 = 0 then 345 else 540 end,
      case when event_number % 2 = 0 then 'km' else 'mi' end,
      0,
      case when event_number <= 3 then jsonb_build_array(
        jsonb_build_array(-71.0650, 42.3550),
        jsonb_build_array(-71.0580, 42.3580),
        jsonb_build_array(-71.0520, 42.3530),
        jsonb_build_array(-71.0600, 42.3490)
      ) else null end,
      case when event_number <= 3 then 5000 else null end
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
