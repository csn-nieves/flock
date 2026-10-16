alter function public.initialize_demo_workspace()
rename to initialize_demo_workspace_base;

revoke execute on function public.initialize_demo_workspace_base() from public, anon, authenticated;

create or replace function public.initialize_demo_workspace()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  flock_number integer;
  message_number integer;
  companion_number integer;
  flock_message_bodies text[][] := array[
    array[
      'I mapped the Prospect Park loop and left the route open for anyone who wants a relaxed start.',
      'I can bring coffee for the group if we meet by the north entrance.',
      'The east side of the loop is usually quiet this time of morning.',
      'I will arrive early enough to check the water fountain before we head out.',
      'The forecast looks cool, so a light layer should be comfortable.',
      'Jordan, can you lead the first mile while I settle in with the newer runners?',
      'I am choosing the five-mile plan and will keep the finish conversational.',
      'This feels like a great way to start the weekend—see everyone at Prospect Park.'
    ],
    array[
      'I previewed the Hudson path and the river breeze should make the opening miles pleasant.',
      'The greenway has a narrow section near the stairs, so let us stay together there.',
      'Maya offered to meet anyone coming from downtown at the waterfront entrance.',
      'I will bring a spare headlamp in case the first stretch is darker than expected.',
      'The longer option passes the marina before turning back toward the park.',
      'My legs are good for a steady tempo, but I may switch to the shorter route.',
      'I saved the route notes so nobody has to guess where the turnaround is.',
      'Thanks for organizing this one; I am looking forward to a relaxed river finish.'
    ],
    array[
      'The Central Park loop has enough shade for us to warm up without rushing.',
      'I can arrive after the first subway rush and still make the planned start.',
      'Let us regroup at the bandshell before we take the longer southern arc.',
      'Priya mentioned a bakery nearby that would make a nice post-run stop.',
      'I will carry extra gels for anyone who wants to test the longer distance.',
      'The northbound climb is short, but it is worth keeping our pace patient.',
      'I am in for the social option and would rather finish together than chase a split.',
      'This route has a little of everything—see you in the park.'
    ],
    array[
      'The bridge approach is exposed, so I am packing a light windbreaker.',
      'Theo found a quieter path through the park that avoids the busiest crossing.',
      'I can sweep the back of the group once we leave the waterfront.',
      'The first turn is easy to miss; I will call it out before we reach the promenade.',
      'I am planning to run the progression conservatively and build after mile two.',
      'If the group splits, let us use the bridge overlook as our regroup point.',
      'The route should finish near plenty of transit, which makes this an easy meetup.',
      'I added the event to my calendar and am excited to see this crew move.'
    ],
    array[
      'Van Cortlandt has a few uneven sections, so trail shoes may be worth bringing.',
      'I walked the opening path yesterday and the footing was dry.',
      'Nina can show us the turn that keeps us away from the bike traffic.',
      'I will bring water for the trailhead and refill before the final climb.',
      'The shorter plan stays near the main path while the longer one reaches the ridge.',
      'I am aiming for an easy effort so we can talk through the wooded section.',
      'Please give a quick call before any sharp turn; the trees make the route easy to miss.',
      'This is exactly the kind of weekend trail run I have been hoping to find.'
    ],
    array[
      'The Riverside path is wide enough for a relaxed Sunday group.',
      'I can bring a small speaker for the warm-up, if everyone is comfortable with that.',
      'The water stop near the boathouse will be our first natural regroup.',
      'I am inviting a friend who is new to group runs, so a friendly pace would help.',
      'The final stretch has a great view across the river when the light is low.',
      'I will stay near the back and make sure nobody misses the turn by the gardens.',
      'The shorter route looks perfect for a recovery day after a busy week.',
      'Let us end with coffee and compare which Sunday route we should repeat.'
    ]
  ];
  direct_message_bodies text[][] := array[
    array[
      'I saw your note about the early start and I can meet before the first coffee shop opens.',
      'The Prospect Park loop feels like a good fit for a quiet Wednesday.',
      'I usually run the first mile slowly, then settle into a steady rhythm.',
      'Would you rather start by the lake or use the north entrance?',
      'I can bring an extra layer because the park is colder before sunrise.',
      'I saved the route and marked the fountain where we can refill.',
      'I am in for the longer option if we keep the conversation easy.',
      'Send me a message after the run and we can plan the next loop.'
    ],
    array[
      'The river route looks fast, but I want to leave room for the wind.',
      'I can meet you at the greenway stairs after my train arrives.',
      'My goal is a controlled tempo rather than a hard workout.',
      'The marina turnaround should give us a clear halfway point.',
      'Do you know whether the waterfront gate is open that early?',
      'I will carry water and a small snack for the longer distance.',
      'I marked the shorter course in case the weather turns.',
      'This sounds like a fun way to explore a different stretch of Manhattan.'
    ],
    array[
      'I am bringing a friend who is new to group runs and may choose the easy plan.',
      'Central Park has enough room for us to spread out during the warm-up.',
      'I can arrive early and claim a spot near the bandshell.',
      'The bakery idea is excellent; I will check its Sunday hours.',
      'I would rather keep the hills comfortable than chase a fast finish.',
      'If anyone wants company on the last mile, I am happy to stay back.',
      'I chose maybe for now, but the event is already on my calendar.',
      'Thanks for including me—this feels more like a neighborhood run than a workout.'
    ],
    array[
      'The bridge approach is my favorite part, especially when the waterfront is quiet.',
      'I can guide the turn through Brooklyn Bridge Park from the overlook.',
      'My legs are ready for a progression, but I will match the group.',
      'Let us regroup before the exposed section so nobody gets separated.',
      'I will bring a wind layer and check the forecast before we leave.',
      'The route has a nice finish near transit, which makes the logistics simple.',
      'I am definitely in for the longer plan if the group wants the extra loop.',
      'I will send a photo of the meeting point so the first turn is obvious.'
    ],
    array[
      'The trailhead has been dry this week, so the ridge should be comfortable.',
      'I know a quieter entrance that keeps us off the busiest path.',
      'I can sweep the back through the wooded section and call out the turns.',
      'The shorter route still gets a good climb without committing to the ridge.',
      'I am bringing trail shoes and a spare bottle for anyone who needs one.',
      'The map looks accurate, but the tree cover makes the first junction easy to miss.',
      'I marked maybe while I check my schedule, though I would love to join.',
      'A relaxed trail morning sounds perfect after a long week.'
    ]
  ];
begin
  perform public.initialize_demo_workspace_base();

  for flock_number in 1..6 loop
    for message_number in 1..8 loop
      update public.flock_messages
      set body = flock_message_bodies[flock_number][message_number]
      where id = md5(
        actor_user_id::text || ':demo-flock-message:' || flock_number::text || ':' || message_number::text
      )::uuid;
    end loop;
  end loop;

  for companion_number in 1..5 loop
    for message_number in 1..8 loop
      update public.direct_messages
      set body = direct_message_bodies[companion_number][message_number]
      where id = md5(
        actor_user_id::text || ':demo-direct:' || companion_number::text || ':' || message_number::text
      )::uuid;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.initialize_demo_workspace() from public, anon;
grant execute on function public.initialize_demo_workspace() to authenticated;

comment on function public.initialize_demo_workspace() is
  'Creates an idempotent demo workspace and refreshes every demo conversation with distinct copy.';
