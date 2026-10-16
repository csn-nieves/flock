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
  legacy_companion_user_id uuid;
  target_conversation_id uuid;
  demo_run_option_id uuid;
  flock_number integer;
  event_number integer;
  message_number integer;
  companion_number integer;
  companion_display_name text;
  companion_topics text[] := array[
    'early-morning Brooklyn loops',
    'tempo miles along the river',
    'park social miles and coffee',
    'bridge-to-park progression work',
    'trail hills and recovery miles'
  ];
  companion_meeting_points text[] := array[
    'the north entrance before sunrise',
    'the waterfront stairs by the greenway',
    'the cafe beside the park bandshell',
    'the bridge overlook near the first turn',
    'the trailhead kiosk by the wide path'
  ];
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

  for companion_number in 1..5 loop
    companion_user_id := md5(actor_user_id::text || ':demo-companion:' || companion_number::text)::uuid;
    companion_display_name := case companion_number
      when 1 then 'Jordan Rivera'
      when 2 then 'Maya Chen'
      when 3 then 'Priya Shah'
      when 4 then 'Theo Brooks'
      else 'Nina Alvarez'
    end;

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
      'demo-companion-' || replace(actor_user_id::text, '-', '') || '-' || companion_number::text || '@demo.invalid',
      '',
      clock_timestamp(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"],"demo":true}'::jsonb,
      jsonb_build_object('display_name', companion_display_name, 'demo', true),
      clock_timestamp(),
      clock_timestamp()
    )
    on conflict (id) do nothing;
  end loop;

  -- Remove the single-companion fixture created by earlier demo migrations.
  -- Its cascades also remove the old repeated direct-message history.
  legacy_companion_user_id := md5(actor_user_id::text || ':demo-companion')::uuid;
  delete from auth.users where id = legacy_companion_user_id;

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

    for companion_number in 1..5 loop
      companion_user_id := md5(actor_user_id::text || ':demo-companion:' || companion_number::text)::uuid;

      insert into public.flock_members (flock_id, user_id, role)
      values (demo_flock_id, companion_user_id, 'member')
      on conflict (flock_id, user_id) do nothing;
    end loop;

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
    values (demo_event_id, actor_user_id, 'in'::public.flock_event_response, demo_run_option_id)
    on conflict (event_id, user_id) do update
    set response = excluded.response,
      run_option_id = excluded.run_option_id,
      updated_at = clock_timestamp();

    for companion_number in 1..3 loop
      companion_user_id := md5(actor_user_id::text || ':demo-companion:' || companion_number::text)::uuid;

      insert into public.flock_event_attendance (event_id, user_id, response, run_option_id)
      values (
        demo_event_id,
        companion_user_id,
        (case
          when companion_number = 2 or flock_number % 3 = 0 then 'maybe'
          else 'in'
        end)::public.flock_event_response,
        demo_run_option_id
      )
      on conflict (event_id, user_id) do update
      set response = excluded.response,
        run_option_id = excluded.run_option_id,
        updated_at = clock_timestamp();
    end loop;

    for message_number in 1..8 loop
      insert into public.flock_messages (id, flock_id, sender_id, body, created_at)
      values (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':' || message_number::text)::uuid,
        demo_flock_id,
        case
          when message_number in (1, 4, 8) then actor_user_id
          when message_number = 7 then md5(actor_user_id::text || ':demo-companion:3')::uuid
          else md5(actor_user_id::text || ':demo-companion:' || (message_number - 1)::text)::uuid
        end,
        case message_number
          when 1 then format('%s kickoff: I saved the route at %s and the first pace option looks friendly.', demo_flock_names[flock_number], demo_flock_locations[flock_number])
          when 2 then format('%s arrival note: I can meet everyone by the park entrance ten minutes early.', demo_flock_names[flock_number])
          when 3 then format('%s gear check: I will bring water and a few extra gels for the group.', demo_flock_names[flock_number])
          when 4 then format('%s weather update: the forecast looks good, so let us keep this one social.', demo_flock_names[flock_number])
          when 5 then format('%s route guide: I am joining from the north side and can guide the turn.', demo_flock_names[flock_number])
          when 6 then format('%s course note: the stretch near %s should be especially nice.', demo_flock_names[flock_number], demo_flock_locations[flock_number])
          when 7 then format('%s pace check: I might choose the shorter option, depending on my legs.', demo_flock_names[flock_number])
          else format('%s finish line: great plan, see you at the start line.', demo_flock_names[flock_number])
        end,
        clock_timestamp() - ((flock_number * 9 + message_number)::text || ' minutes')::interval
      )
      on conflict (id) do update
      set sender_id = excluded.sender_id,
        body = excluded.body,
        created_at = excluded.created_at;

    end loop;

    insert into public.chat_message_reactions (
      flock_message_id,
      user_id,
      reaction_key
    )
    values
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':1')::uuid,
        md5(actor_user_id::text || ':demo-companion:1')::uuid,
        'thumbs_up'
      ),
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':2')::uuid,
        md5(actor_user_id::text || ':demo-companion:2')::uuid,
        'heart'
      ),
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':3')::uuid,
        actor_user_id,
        'laugh'
      ),
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':5')::uuid,
        md5(actor_user_id::text || ':demo-companion:3')::uuid,
        'celebrate'
      ),
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':6')::uuid,
        actor_user_id,
        'fire'
      ),
      (
        md5(actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':8')::uuid,
        md5(actor_user_id::text || ':demo-companion:4')::uuid,
        'eyes'
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

  for companion_number in 1..5 loop
    companion_user_id := md5(actor_user_id::text || ':demo-companion:' || companion_number::text)::uuid;
    companion_display_name := case companion_number
      when 1 then 'Jordan Rivera'
      when 2 then 'Maya Chen'
      when 3 then 'Priya Shah'
      when 4 then 'Theo Brooks'
      else 'Nina Alvarez'
    end;

    insert into public.direct_conversations (participant_one_id, participant_two_id)
    values (
      least(actor_user_id, companion_user_id),
      greatest(actor_user_id, companion_user_id)
    )
    on conflict (participant_one_id, participant_two_id) do update
    set participant_one_id = excluded.participant_one_id
    returning id into target_conversation_id;

    for message_number in 1..8 loop
      insert into public.direct_messages (id, conversation_id, sender_id, body, created_at)
      values (
        md5(actor_user_id::text || ':demo-direct:' || companion_number::text || ':' || message_number::text)::uuid,
        target_conversation_id,
        case when message_number % 2 = 1 then companion_user_id else actor_user_id end,
        case message_number
          when 1 then format('%s note 1: I saw your plan for %s and it looks inviting.', companion_display_name, companion_topics[companion_number])
          when 2 then format('%s reply 2: I am comparing the shorter and longer options for %s.', companion_display_name, companion_topics[companion_number])
          when 3 then format('%s route thought 3: the longer course has a great view, but the shorter one keeps %s social.', companion_display_name, companion_topics[companion_number])
          when 4 then format('%s question 4: what pace are you thinking for %s?', companion_display_name, companion_topics[companion_number])
          when 5 then format('%s pace plan 5: I usually settle in around nine-thirty after warming up for %s.', companion_display_name, companion_topics[companion_number])
          when 6 then format('%s meetup note 6: I will bring water and meet you at %s.', companion_display_name, companion_meeting_points[companion_number])
          when 7 then format('%s RSVP note 7: I added %s to my plans and look forward to the group.', companion_display_name, companion_topics[companion_number])
          else format('%s follow-up 8: let us check in after %s and plan the next one.', companion_display_name, companion_topics[companion_number])
        end,
        clock_timestamp() - ((companion_number * 12 + message_number)::text || ' minutes')::interval
      )
      on conflict (id) do update
      set conversation_id = excluded.conversation_id,
        sender_id = excluded.sender_id,
        body = excluded.body,
        created_at = excluded.created_at;
    end loop;

    insert into public.chat_message_reactions (
      direct_message_id,
      user_id,
      reaction_key
    )
    values
      (
        md5(actor_user_id::text || ':demo-direct:' || companion_number::text || ':1')::uuid,
        actor_user_id,
        'thumbs_up'
      ),
      (
        md5(actor_user_id::text || ':demo-direct:' || companion_number::text || ':3')::uuid,
        companion_user_id,
        'heart'
      ),
      (
        md5(actor_user_id::text || ':demo-direct:' || companion_number::text || ':5')::uuid,
        actor_user_id,
        case when companion_number % 2 = 0 then 'laugh' else 'celebrate' end
      ),
      (
        md5(actor_user_id::text || ':demo-direct:' || companion_number::text || ':7')::uuid,
        companion_user_id,
        case when companion_number % 2 = 0 then 'eyes' else 'fire' end
      )
    on conflict do nothing;
  end loop;
end;
$$;

comment on function public.initialize_demo_workspace() is
  'Creates an idempotent, self-contained workspace for an anonymous demo session.';
