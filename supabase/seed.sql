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
    '{"display_name":"Casey Morgan"}',
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
    '{"display_name":"Avery Bennett"}',
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
  seed_user_name text;
  seed_user_email text;
  seed_user_names text[] := array[
    'Priya Nair', 'Mateo Santos', 'Nina Okafor', 'Elliot Brooks',
    'Camila Rivera', 'Theo Laurent', 'Sofia Petrov', 'Marcus Lee',
    'Janelle Carter', 'Owen Fitzgerald', 'Leila Haddad', 'Rafael Costa',
    'Mei Tanaka', 'Jonah Williams', 'Amina Yusuf', 'Claire Donovan',
    'Andre Bell', 'Isabel Moreno', 'Samir Patel', 'Grace Kim',
    'Noah Whitaker', 'Valentina Rossi', 'Darius Coleman', 'Hannah Price',
    'Luca Bianchi', 'Tessa Nguyen', 'Malcolm Reed', 'Elena Vasquez',
    'Devon Sinclair', 'Rina Shah', 'Caleb Turner', 'Maya Brooks',
    'Iris Mensah', 'Julian Park', 'Sienna Grant', 'Arjun Mehta',
    'Naomi Flores', 'Benji Wallace', 'Lucia Marin', 'Kieran Osei',
    'Amara Johnson', 'Finn Gallagher', 'Yara Haddad', 'Miles Chen',
    'Celeste Monroe'
  ];
begin
  for user_number in 6..50 loop
    seed_user_id := md5('seed-user-' || user_number)::uuid;
    seed_user_name := seed_user_names[user_number - 5];
    seed_user_email := regexp_replace(lower(seed_user_name), '[^a-z0-9]+', '.', 'g') || '@flock.com';
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
      seed_user_email,
      '',
      '2026-01-15 12:00:00+00',
      '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', seed_user_name),
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
        'email', seed_user_email,
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
  seed_names text[] := array[
    'Laurelhurst Dawn Crew',
    'St. Johns Bridge Pacers',
    'Mt. Tabor Hill Club',
    'Sellwood Sunday Miles',
    'Forest Park Trail Table',
    'Vancouver Waterfront Striders',
    'Beaverton Sunset Runners'
  ];
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
      seed_names[flock_number - 3],
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
  event_titles text[] := array[
    'Bridge-to-Bank Recovery Run', 'Rainy Day Tempo', 'Eastbank 5K Social',
    'Alberta Park Sunrise Miles', 'Forest Park Climb Practice',
    'Sellwood River Loop', 'Tabor Ridge Repeats', 'Cully Neighborhood Jog',
    'Lacamas Lake Long Run', 'Beaverton Twilight Shakeout',
    'St. Johns Bridge Out-and-Back', 'Rose City Fall Preview',
    'Waterfront Fartlek Hour', 'Pine Street Progression',
    'Cathedral Park Easy Miles', 'Mt. Tabor Scenic Seven',
    'Riverside Threshold Session', 'Quiet Streets Recovery',
    'Forest-to-River Adventure', 'Sunday Coffee Finish'
  ];
  event_locations text[] := array[
    'Waterfront Park north lawn', 'Eastbank Esplanade under the Morrison Bridge',
    'Kelley Point Park boat launch', 'Alberta Park tennis courts',
    'Lower Macleay Trailhead', 'Sellwood Riverfront picnic shelter',
    'Mt. Tabor reservoir loop', 'Cully Park community garden',
    'Lacamas Lake Heritage Trail', 'Beaverton Central Park fountain',
    'Cathedral Park riverside', 'Laurelhurst Park east gate',
    'Waterfront Park Salmon Street Springs', 'Pine Street Market entrance',
    'Pier Park playground', 'Mt. Tabor summit road',
    'Eastbank Esplanade ramp', 'Irving Park rose garden',
    'Forest Park Leif Erikson gate', 'Sellwood coffee kiosk'
  ];
  event_descriptions text[] := array[
    'A gentle reset after the weekend with conversation-friendly miles.',
    'Short repeats and a relaxed cooldown for runners building rhythm.',
    'A welcoming five-kilometer loop with a social finish by the river.',
    'Start the day with an easy loop and plenty of regroup points.',
    'A steady forest climb for runners who enjoy a little elevation.',
    'Flat river miles at a pace that leaves room for good conversation.',
    'Rolling repeats with options to shorten the workout when needed.',
    'A neighborhood route designed for a relaxed after-work meetup.',
    'A scenic long run with water stops and a lakeside regroup.',
    'A low-key evening shakeout before the week gets busy.',
    'A bridge route with wide paths and a steady, friendly rhythm.',
    'A seasonal preview run for runners preparing for fall races.',
    'Playful pace changes on a flat route with a gentle cooldown.',
    'A controlled progression that finishes with a few quicker minutes.',
    'Easy miles through the park with a no-pressure start time.',
    'A scenic seven-mile loop with optional shorter turnarounds.',
    'A focused threshold session with recovery jogs between efforts.',
    'Quiet neighborhood roads and a relaxed pace for active recovery.',
    'A mixed-surface adventure from the trees to the riverfront.',
    'Finish the week with comfortable miles and coffee together.'
  ];
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
      event_titles[event_number],
      '2026-10-03 08:00:00+00'::timestamptz + make_interval(days => event_number),
      event_locations[event_number],
      event_descriptions[event_number]
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
  event_titles text[] := array[
    'Early Bird Waterfront Miles', 'Muddy Boots Trail Date',
    'Rose Garden Recovery', 'Sunrise Bridge Loop', 'Neighborhood Tempo Pair',
    'Cedar Mill Easy Run', 'Ladd’s Addition Evening Miles',
    'Forest Park Out-and-Back', 'Sunday Market Shakeout',
    'Lakeside Long Run', 'Alberta Coffee Run', 'Quiet River Progression',
    'Mt. Tabor Sunset Miles', 'Springwater Corridor Cruise',
    'Rain-or-Shine Five-Miler'
  ];
  event_locations text[] := array[
    'Tom McCall Waterfront Park south steps', 'Lower Macleay picnic table',
    'Washington Park rose garden gate', 'Tilikum Crossing east plaza',
    'Laurelhurst Park duck pond', 'Cedar Mill Library trail entrance',
    'Ladd’s Addition central fountain', 'Leif Erikson Drive gate',
    'Portland Farmers Market north entrance', 'Lacamas Lake picnic shelter',
    'Alberta Street coffee patio', 'Eastbank Esplanade floating dock',
    'Mt. Tabor west reservoir', 'Springwater Corridor Oaks Bottom gate',
    'Sellwood Park river stairs'
  ];
  event_descriptions text[] := array[
    'An easy start before the city wakes up, with time to chat afterward.',
    'A short forest route for two runners who do not mind a little mud.',
    'Gentle recovery miles through the roses and tree-lined paths.',
    'A sunrise loop across the river with a steady, comfortable pace.',
    'A friendly tempo session with clear options to ease back when needed.',
    'A low-key neighborhood run ending near a quiet trail and cafe.',
    'An after-work loop through the historic neighborhood and back.',
    'A shaded out-and-back with a few optional climbs for variety.',
    'A relaxed shakeout timed to finish near the weekend market.',
    'A longer lakeside route with water stops and a flexible turnaround.',
    'A conversational run that ends with a favorite local coffee.',
    'A smooth progression along the river with a relaxed first mile.',
    'A scenic sunset route with lights and a short hill finish.',
    'A flat cruise on the corridor for runners building steady volume.',
    'A flexible five-mile plan that works whether the weather cooperates.'
  ];
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
      event_titles[event_number],
      '2026-10-04 07:30:00+00'::timestamptz + make_interval(days => event_number),
      event_locations[event_number],
      event_descriptions[event_number]
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

insert into public.saved_routes (
  id,
  owner_id,
  name,
  route_coordinates,
  route_distance_meters,
  created_at,
  updated_at
)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Riverside five-mile loop',
    '[[ -74.0100, 40.7000 ], [ -74.0050, 40.7040 ], [ -73.9990, 40.7080 ], [ -73.9940, 40.7030 ]]'::jsonb,
    8050,
    '2026-10-01 12:00:00+00',
    '2026-10-01 12:00:00+00'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Harbor recovery loop',
    '[[ -71.0650, 42.3550 ], [ -71.0580, 42.3580 ], [ -71.0520, 42.3530 ], [ -71.0600, 42.3490 ]]'::jsonb,
    5000,
    '2026-10-02 12:00:00+00',
    '2026-10-02 12:00:00+00'
  );

insert into public.flock_messages (
  id,
  flock_id,
  sender_id,
  body,
  created_at
)
with seeded_messages(body) as (
  values
    ('Meet at the west entrance by the water fountain; I will bring the route notes.'),
    ('I can bring an extra reflective vest for anyone who needs one.'),
    ('The river path was clear this morning, even after the rain.'),
    ('I am planning to run the shorter loop today and regroup by the bridge.'),
    ('Coffee after the run sounds good. Any favorite spots nearby?'),
    ('See everyone at the trailhead a few minutes before the start.'),
    ('The north gate is open again, so we can use the usual entrance.'),
    ('I will carry a small first-aid kit and a couple of extra gels.'),
    ('The forecast looks cool and dry—perfect conditions for the long loop.'),
    ('Would anyone like to add one relaxed mile after the planned route?'),
    ('I ran the first section yesterday and the construction is finished.'),
    ('Let’s keep the first mile easy while everyone settles in.'),
    ('I can meet the group at the water stop if I am a few minutes late.'),
    ('The trail surface is a little soft, but it is still comfortable in trainers.'),
    ('I have mapped a shorter option for anyone who needs to leave early.'),
    ('Thanks for calling out the pace—this is exactly the effort I needed.'),
    ('The bridge overlook is a great regroup point at the halfway mark.'),
    ('I will bring bananas and orange slices for the finish.'),
    ('Is anyone interested in a gentle hill repeat after the main loop?'),
    ('The sunrise over the water was worth getting out early today.'),
    ('I am bringing a friend who is new to group running.'),
    ('The park restroom by the east gate is open now.'),
    ('I can sweep the back of the group so nobody has to run alone.'),
    ('The optional detour adds about a mile but has much better views.'),
    ('My watch is charged and ready to keep us on the planned route.'),
    ('Let’s check in about the pace before we head into the hills.'),
    ('I will post the coffee location once we know the group size.'),
    ('The path is busy near the market, so we may need to stay single file.'),
    ('I can arrive early to put out the regroup marker.'),
    ('A short walking break at the top sounds good to me.'),
    ('The weather turned out better than expected—glad we kept the plan.'),
    ('I am happy to take the flat route today and save hills for next week.'),
    ('The last mile is shaded, which should make the finish comfortable.'),
    ('Thanks for organizing this; the route felt welcoming for every pace.'),
    ('I will share a photo from the finish in the chat later.'),
    ('Great work, everyone. See you at the next sunrise start.')
), numbered_messages as (
  select row_number() over ()::int as message_number, body
  from seeded_messages
)
select
  md5('seed-flock-message-' || message_number)::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid,
  case message_number % 4
    when 0 then '22222222-2222-4222-8222-222222222222'::uuid
    when 1 then '11111111-1111-4111-8111-111111111111'::uuid
    when 2 then '33333333-3333-4333-8333-333333333333'::uuid
    else '44444444-4444-4444-8444-444444444444'::uuid
  end,
  numbered_messages.body,
  '2026-10-06 16:00:00+00'::timestamptz + make_interval(mins => message_number * 5)
from numbered_messages;

insert into public.direct_conversations (
  id,
  participant_one_id,
  participant_two_id,
  created_at
)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
  '11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333333',
  '2026-10-06 15:00:00+00'
);

insert into public.direct_messages (
  id,
  conversation_id,
  sender_id,
  body,
  created_at
)
with seeded_messages(body) as (
  values
    ('The trail loop sounds perfect for tomorrow morning.'),
    ('Are you still running before work tomorrow?'),
    ('Yes, I can meet at the usual corner by the bakery.'),
    ('I will bring a light in case it is still dark.'),
    ('Let’s keep the first mile easy and decide from there.'),
    ('See you in the morning—I will watch for your message.'),
    ('The river path should be quieter before eight.'),
    ('I saved the route so we can use it again next week.'),
    ('I can bring an extra pair of gloves if the temperature drops.'),
    ('That pace felt comfortable; I am happy to repeat it.'),
    ('The coffee shop on the corner opens right after we finish.'),
    ('Thanks for the invite. I am looking forward to it.')
), numbered_messages as (
  select row_number() over ()::int as message_number, body
  from seeded_messages
)
select
  md5('seed-direct-message-' || message_number)::uuid,
  'dddddddd-dddd-4ddd-8ddd-dddddddddd01'::uuid,
  case message_number % 2
    when 0 then '11111111-1111-4111-8111-111111111111'::uuid
    else '33333333-3333-4333-8333-333333333333'::uuid
  end,
  numbered_messages.body,
  '2026-10-06 15:00:00+00'::timestamptz + make_interval(mins => message_number * 6)
from numbered_messages;

insert into public.flock_chat_reads (
  flock_id,
  user_id,
  last_read_message_id,
  last_read_created_at,
  updated_at
)
select
  message.flock_id,
  '11111111-1111-4111-8111-111111111111'::uuid,
  message.id,
  message.created_at,
  '2026-10-06 19:00:00+00'::timestamptz
from public.flock_messages as message
where message.id = md5('seed-flock-message-34')::uuid;

insert into public.direct_conversation_reads (
  conversation_id,
  user_id,
  last_read_message_id,
  last_read_created_at,
  updated_at
)
select
  message.conversation_id,
  reader.user_id,
  message.id,
  message.created_at,
  '2026-10-06 17:00:00+00'::timestamptz
from (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 11),
    ('33333333-3333-4333-8333-333333333333'::uuid, 10)
) as reader(user_id, message_number)
join public.direct_messages as message
  on message.id = md5('seed-direct-message-' || reader.message_number)::uuid;

commit;
