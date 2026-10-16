create or replace function public.initialize_demo_workspace()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  demo_flock_id uuid;
  demo_event_id uuid;
  companion_user_id uuid;
  target_conversation_id uuid;
  demo_run_option_id uuid;
  flock_number integer;
  event_number integer;
  message_number integer;
  demo_flock_names text[] := array[
    'Sunrise Striders',
    'River Loop Runners',
    'City Park Pacers',
    'Harbor Tempo Crew',
    'Prospect Trail Collective',
    'Sunday Social Miles'
  ];
  demo_flock_locations text[] := array[
    'Prospect Park, Brooklyn',
    'Hudson River Greenway, Manhattan',
    'Central Park, Manhattan',
    'Brooklyn Bridge Park, Brooklyn',
    'Van Cortlandt Park, Bronx',
    'Riverside Park, Manhattan'
  ];
begin
  if actor_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise insufficient_privilege using message = 'The demo is available to anonymous sessions only.';
  end if;

  companion_user_id := md5(actor_user_id::text || ':demo-companion')::uuid;

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
  values (
    '00000000-0000-0000-0000-000000000000',
    companion_user_id,
    'authenticated',
    'authenticated',
    'demo-companion-' || replace(actor_user_id::text, '-', '') || '@demo.invalid',
    '',
    clock_timestamp(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"demo":true}'::jsonb,
    '{"display_name":"Jordan Rivera","demo":true}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  )
  on conflict (id) do nothing;

  insert into private.demo_workspaces (user_id)
  values (actor_user_id)
  on conflict (user_id) do nothing;

  update public.profiles
  set display_name = 'Demo Runner', updated_at = clock_timestamp()
  where user_id = actor_user_id;

  for flock_number in 1..6 loop
    demo_flock_id := md5(actor_user_id::text || ':demo-flock:' || flock_number::text)::uuid;

    insert into public.flocks (id, owner_id, name)
    values (
      demo_flock_id,
      actor_user_id,
      demo_flock_names[flock_number]
    )
    on conflict (id) do nothing;

    insert into public.flock_members (flock_id, user_id, role)
    values (demo_flock_id, actor_user_id, 'member')
    on conflict (flock_id, user_id) do nothing;

    insert into public.flock_members (flock_id, user_id, role)
    values (demo_flock_id, companion_user_id, 'member')
    on conflict (flock_id, user_id) do nothing;

    demo_event_id := md5(actor_user_id::text || ':demo-flock-event:' || flock_number::text)::uuid;

    insert into public.flock_events (
      id, flock_id, created_by, title, starts_at, location, description
    )
    values (
      demo_event_id,
      demo_flock_id,
      actor_user_id,
      case flock_number
        when 1 then 'Sunrise loop and coffee'
        when 2 then 'Hudson tempo miles'
        when 3 then 'Saturday park social'
        when 4 then 'Bridge-to-park progression'
        when 5 then 'Trail hills and recovery miles'
        else 'Sunday social miles'
      end,
      clock_timestamp() + ((14 + flock_number)::text || ' days')::interval,
      demo_flock_locations[flock_number],
      'A welcoming demo run with a mapped route and an easy pace option.'
    )
    on conflict (id) do nothing;

    insert into public.flock_event_run_options (
      event_id,
      distance_label,
      distance_tenths,
      distance_unit,
      pace_label,
      pace_seconds,
      pace_unit,
      position,
      route_coordinates,
      route_distance_meters
    )
    values (
      demo_event_id,
      '5 mi',
      50,
      'mi',
      '9:30/mi',
      570,
      'mi',
      0,
      '[[ -73.991, 40.665 ], [ -73.977, 40.672 ], [ -73.965, 40.661 ]]'::jsonb,
      8047
    );

    select option.id
    into demo_run_option_id
    from public.flock_event_run_options as option
    where option.event_id = demo_event_id
    order by option.position
    limit 1;

    insert into public.flock_event_attendance (event_id, user_id, response, run_option_id)
    values
      (demo_event_id, actor_user_id, 'in'::public.flock_event_response, demo_run_option_id),
      (
        demo_event_id,
        companion_user_id,
        (case when flock_number % 2 = 0 then 'maybe' else 'in' end)::public.flock_event_response,
        demo_run_option_id
      )
    on conflict (event_id, user_id) do update
    set response = excluded.response,
      run_option_id = excluded.run_option_id,
      updated_at = clock_timestamp();

    for message_number in 1..3 loop
      insert into public.flock_messages (id, flock_id, sender_id, body, created_at)
      values (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':' || message_number::text)::uuid,
        demo_flock_id,
        case when message_number = 2 then companion_user_id else actor_user_id end,
        case message_number
          when 1 then 'Route is saved and ready for a relaxed group pace.'
          when 2 then 'Meet by the park entrance ten minutes before we start.'
          else 'Bring water and say hello when you arrive.'
        end,
        clock_timestamp() - ((flock_number * 9 + message_number)::text || ' minutes')::interval
      )
      on conflict (id) do nothing;

    end loop;

    insert into public.chat_message_reactions (
      flock_message_id,
      user_id,
      reaction_key
    )
    values
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':1')::uuid,
        companion_user_id,
        'thumbs_up'
      ),
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':2')::uuid,
        actor_user_id,
        'heart'
      )
    on conflict do nothing;
  end loop;

  for event_number in 1..3 loop
    demo_event_id := md5(actor_user_id::text || ':demo-personal-event:' || event_number::text)::uuid;

    insert into public.flock_events (
      id, flock_id, created_by, title, starts_at, location, description
    )
    values (
      demo_event_id,
      null,
      actor_user_id,
      case event_number
        when 1 then 'Easy miles before work'
        when 2 then 'Sunday waterfront run'
        else 'Golden hour neighborhood run'
      end,
      clock_timestamp() + ((21 + event_number)::text || ' days')::interval,
      case event_number
        when 1 then 'McCarren Park, Brooklyn'
        when 2 then 'Battery Park, Manhattan'
        else 'Washington Square Park, Manhattan'
      end,
      'A personal event created for the Flock product demo.'
    )
    on conflict (id) do nothing;

    insert into public.flock_event_run_options (
      event_id,
      distance_label,
      distance_tenths,
      distance_unit,
      pace_label,
      pace_seconds,
      pace_unit,
      position,
      route_coordinates,
      route_distance_meters
    )
    values (
      demo_event_id,
      case event_number when 1 then '3 mi' else '6 mi' end,
      case event_number when 1 then 30 else 60 end,
      'mi',
      '10:00/mi',
      600,
      'mi',
      0,
      '[[ -73.951, 40.722 ], [ -73.943, 40.729 ], [ -73.936, 40.721 ]]'::jsonb,
      case event_number when 1 then 4828 else 9656 end
    );

    select option.id
    into demo_run_option_id
    from public.flock_event_run_options as option
    where option.event_id = demo_event_id
    order by option.position
    limit 1;

    insert into public.flock_event_attendance (event_id, user_id, response, run_option_id)
    values (
      demo_event_id,
      actor_user_id,
      (case when event_number = 2 then 'maybe' else 'in' end)::public.flock_event_response,
      demo_run_option_id
    )
    on conflict (event_id, user_id) do update
    set response = excluded.response,
      run_option_id = excluded.run_option_id,
      updated_at = clock_timestamp();
  end loop;

  insert into public.direct_conversations (participant_one_id, participant_two_id)
  values (
    least(actor_user_id, companion_user_id),
    greatest(actor_user_id, companion_user_id)
  )
  on conflict (participant_one_id, participant_two_id) do update
  set participant_one_id = excluded.participant_one_id
  returning id into target_conversation_id;

  insert into public.direct_messages (id, conversation_id, sender_id, body, created_at)
  values
    (
      md5(actor_user_id::text || ':demo:1')::uuid,
      target_conversation_id,
      companion_user_id,
      'Welcome to the Flock demo. I saved a route for our next easy run.',
      clock_timestamp() - interval '8 minutes'
    ),
    (
      md5(actor_user_id::text || ':demo:2')::uuid,
      target_conversation_id,
      actor_user_id,
      'Thanks! I am going to look through the flocks and upcoming events.',
      clock_timestamp() - interval '6 minutes'
    ),
    (
      md5(actor_user_id::text || ':demo:3')::uuid,
      target_conversation_id,
      companion_user_id,
      'The waterfront route has a gentler pace if you want an easy option.',
      clock_timestamp() - interval '4 minutes'
    ),
    (
      md5(actor_user_id::text || ':demo:4')::uuid,
      target_conversation_id,
      actor_user_id,
      'Perfect. I will bring water and meet everyone by the park entrance.',
      clock_timestamp() - interval '2 minutes'
    )
  on conflict (id) do nothing;

  insert into public.chat_message_reactions (
    direct_message_id,
    user_id,
    reaction_key
  )
  values
    (
      md5(actor_user_id::text || ':demo:1')::uuid,
      actor_user_id,
      'thumbs_up'
    ),
    (
      md5(actor_user_id::text || ':demo:2')::uuid,
      companion_user_id,
      'heart'
    ),
    (
      md5(actor_user_id::text || ':demo:3')::uuid,
      actor_user_id,
      'celebrate'
    )
  on conflict do nothing;
end;
$$;

comment on function public.initialize_demo_workspace() is
  'Creates an idempotent, self-contained workspace for an anonymous demo session.';
