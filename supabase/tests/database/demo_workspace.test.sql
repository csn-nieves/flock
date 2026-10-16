begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '99999999-9999-4999-8999-999999999999',
  null,
  '{"is_anonymous": true}'::jsonb
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-999999999999","is_anonymous":true}';

select lives_ok(
  $$select public.initialize_demo_workspace()$$,
  'an anonymous user can initialize a demo without seeded production records'
);

select is(
  (select count(*) from public.flocks where owner_id = '99999999-9999-4999-8999-999999999999'),
  6::bigint,
  'demo initialization creates six demo flocks for the session'
);

select is(
  (select count(*) from public.flock_events where created_by = '99999999-9999-4999-8999-999999999999'),
  9::bigint,
  'demo initialization creates flock and personal events'
);

select ok(
  (select count(*) > 0
   from public.flock_event_run_options as option
   join public.flock_events as event on event.id = option.event_id
   where event.created_by = '99999999-9999-4999-8999-999999999999'
     and option.route_coordinates is not null),
  'demo events include a route-backed run option'
);

select is(
  (select count(*)
   from public.flock_event_attendance as attendance
   join public.flock_events as event on event.id = attendance.event_id
   where event.created_by = '99999999-9999-4999-8999-999999999999'),
  27::bigint,
  'demo events include persisted RSVP records'
);

select ok(
  (select bool_and(attendance.response in ('in', 'maybe'))
   from public.flock_event_attendance as attendance
   join public.flock_events as event on event.id = attendance.event_id
   where event.created_by = '99999999-9999-4999-8999-999999999999'),
  'demo RSVP responses use supported enum values'
);

select lives_ok(
  $$select public.initialize_demo_workspace()$$,
  'demo initialization is idempotent for the same anonymous session'
);

select is(
  (select count(distinct sender_id)
   from public.flock_messages
   where flock_id in (
     select id from public.flocks
     where owner_id = '99999999-9999-4999-8999-999999999999'
   )),
  6::bigint,
  'demo flock chats include messages from six distinct runners'
);

select is(
  (select count(*)
   from public.direct_conversations
   where '99999999-9999-4999-8999-999999999999'::uuid in (participant_one_id, participant_two_id)),
  5::bigint,
  'demo initialization creates five isolated direct conversations'
);

select is(
  (select count(*)
   from public.direct_messages as message
   join public.direct_conversations as conversation on conversation.id = message.conversation_id
   where '99999999-9999-4999-8999-999999999999'::uuid in (
     conversation.participant_one_id,
     conversation.participant_two_id
   )),
  40::bigint,
  'demo direct conversations include long multi-message exchanges'
);

select ok(
  (select count(*) >= 3
   from public.chat_message_reactions as reaction
   join public.direct_messages as message on message.id = reaction.direct_message_id
   join public.direct_conversations as conversation on conversation.id = message.conversation_id
   where '99999999-9999-4999-8999-999999999999'::uuid in (
     conversation.participant_one_id,
     conversation.participant_two_id
   )),
  'demo direct messages include reactions'
);

select is(
  (select count(distinct reaction_key)
   from public.chat_message_reactions as reaction
   where reaction.flock_message_id in (
     select message.id
     from public.flock_messages as message
     where message.flock_id in (
       select id from public.flocks
       where owner_id = '99999999-9999-4999-8999-999999999999'
     )
   )
   or reaction.direct_message_id in (
     select message.id
     from public.direct_messages as message
     join public.direct_conversations as conversation on conversation.id = message.conversation_id
     where '99999999-9999-4999-8999-999999999999'::uuid in (
       conversation.participant_one_id,
       conversation.participant_two_id
     )
   )),
  6::bigint,
  'demo conversations use every supported reaction'
);

select is(
  (select count(*) from public.flock_events where created_by = '99999999-9999-4999-8999-999999999999'),
  9::bigint,
  'reinitializing does not duplicate demo events'
);

select * from finish();
rollback;
