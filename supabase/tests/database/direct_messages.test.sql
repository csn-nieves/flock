begin;

create extension if not exists pgtap with schema extensions;

select plan(42);

select has_table('public', 'direct_conversations', 'direct conversations are stored in an RLS table');
select has_table('public', 'direct_messages', 'direct messages are stored in an RLS table');
select has_function(
  'public',
  'list_my_direct_conversations',
  array[]::text[],
  'the conversation panel has a participant-only direct-message list'
);
select has_function(
  'public',
  'get_or_create_direct_conversation',
  array['uuid'],
  'runner pairs resolve through one protected function'
);
select has_function(
  'public',
  'list_direct_messages',
  array['uuid', 'timestamp with time zone', 'uuid', 'integer'],
  'direct-message history has a cursor-window function'
);
select has_function(
  'public',
  'send_direct_message',
  array['uuid', 'text'],
  'direct messages are sent through a protected function'
);
select has_index(
  'public',
  'direct_messages',
  'direct_messages_conversation_created_id_idx',
  'the conversation and cursor columns share one index'
);
select has_table('public', 'direct_conversation_reads', 'direct read cursors are stored server-side');
select has_function(
  'public',
  'mark_direct_conversation_read',
  array['uuid', 'uuid'],
  'viewed direct messages advance through a protected function'
);
select has_index(
  'public',
  'direct_conversation_reads',
  'direct_conversation_reads_user_idx',
  'direct read-cursor Realtime filters have a user index'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values
  ('c1111111-1111-4111-8111-111111111111', 'direct-one@example.com', '{"display_name":"Direct One"}', '{}'),
  ('c2222222-2222-4222-8222-222222222222', 'direct-two@example.com', '{"display_name":"Direct Two"}', '{}'),
  ('c3333333-3333-4333-8333-333333333333', 'direct-outsider@example.com', '{"display_name":"Direct Outsider"}', '{}'),
  ('c4444444-4444-4444-8444-444444444444', 'direct-admin@example.com', '{"display_name":"Direct Admin"}', '{"role":"superadmin"}');

set local role authenticated;
set local request.jwt.claim.sub = 'c1111111-1111-4111-8111-111111111111';

create temporary table direct_conversation as
select public.get_or_create_direct_conversation(
  'c2222222-2222-4222-8222-222222222222'
) as id;

select isnt(
  (select id from direct_conversation),
  null,
  'an authenticated runner can start a direct conversation'
);
select is(
  public.get_or_create_direct_conversation('c2222222-2222-4222-8222-222222222222'),
  (select id from direct_conversation),
  'the same runner pair always resolves to one conversation'
);
select throws_ok(
  $$select public.get_or_create_direct_conversation(
    'c1111111-1111-4111-8111-111111111111'
  )$$,
  '23514',
  'Choose another runner.',
  'a runner cannot start a conversation with themself'
);
select results_eq(
  $$select other_display_name from public.list_my_direct_conversations()$$,
  $$values ('Direct Two'::text)$$,
  'the starter sees the other participant in their conversation list'
);
select is(
  (
    select display_name
    from public.profiles
    where user_id = 'c2222222-2222-4222-8222-222222222222'
  ),
  'Direct Two',
  'direct participants can read each other public profile'
);

create temporary table first_direct_message as
select * from public.send_direct_message(
  (select id from direct_conversation),
  '  Ready for tomorrow?  '
);

select is(
  (select body from first_direct_message),
  'Ready for tomorrow?',
  'message creation trims surrounding whitespace'
);
select is(
  (select sender_id from first_direct_message),
  'c1111111-1111-4111-8111-111111111111'::uuid,
  'message creation derives the sender from auth.uid'
);

set local request.jwt.claim.sub = 'c2222222-2222-4222-8222-222222222222';

select results_eq(
  $$select other_display_name from public.list_my_direct_conversations()$$,
  $$values ('Direct One'::text)$$,
  'the recipient sees the starter in their conversation list'
);
select lives_ok(
  format(
    'select public.send_direct_message(%L, %L)',
    (select id from direct_conversation),
    'Yes, see you then.'
  ),
  'the other participant can reply'
);
select is(
  (select count(*) from public.list_direct_messages((select id from direct_conversation))),
  2::bigint,
  'the other participant can read direct-message history'
);
select is(
  (select unread_count from public.list_my_direct_conversations()),
  1,
  'the recipient unread count excludes their own reply'
);
select is(
  (select latest_message_body from public.list_my_direct_conversations()),
  'Yes, see you then.',
  'the direct conversation list includes the latest message preview'
);
select lives_ok(
  format(
    'select public.mark_direct_conversation_read(%L, %L)',
    (select id from direct_conversation),
    (select id from public.direct_messages order by created_at desc, id desc limit 1)
  ),
  'a participant can mark a verified direct message read'
);
select is(
  (select unread_count from public.list_my_direct_conversations()),
  0,
  'marking the latest direct message clears the unread count'
);

set local request.jwt.claim.sub = 'c3333333-3333-4333-8333-333333333333';

select is(
  (select count(*) from public.list_my_direct_conversations()),
  0::bigint,
  'an outsider does not see another pair conversation'
);
select is(
  (select count(*) from public.list_direct_messages((select id from direct_conversation))),
  0::bigint,
  'an outsider cannot read another pair history'
);
select throws_ok(
  format(
    'select public.send_direct_message(%L, %L)',
    (select id from direct_conversation),
    'Not allowed'
  ),
  '42501',
  'Conversation access is required.',
  'an outsider cannot send to another pair conversation'
);
select is(
  (
    select count(*)
    from public.profiles
    where user_id = 'c2222222-2222-4222-8222-222222222222'
  ),
  0::bigint,
  'an outsider cannot read a participant profile through direct messaging'
);

set local request.jwt.claim.sub = 'c4444444-4444-4444-8444-444444444444';
set local request.jwt.claims = '{"sub":"c4444444-4444-4444-8444-444444444444","app_metadata":{"role":"superadmin"}}';

select is(
  (select count(*) from public.list_my_direct_conversations()),
  0::bigint,
  'a superadmin outside the pair cannot list the private conversation'
);
select is(
  (select count(*) from public.list_direct_messages((select id from direct_conversation))),
  0::bigint,
  'a superadmin outside the pair cannot read direct messages'
);
select throws_ok(
  format(
    'select public.send_direct_message(%L, %L)',
    (select id from direct_conversation),
    'Admin message'
  ),
  '42501',
  'Conversation access is required.',
  'a superadmin outside the pair cannot send direct messages'
);
select throws_ok(
  format(
    'select public.mark_direct_conversation_read(%L, %L)',
    (select id from direct_conversation),
    'c0000000-0000-4000-8000-000000000001'
  ),
  '42501',
  'Conversation access is required.',
  'a superadmin outside the pair cannot alter direct read state'
);

reset role;
insert into public.direct_messages (
  id,
  conversation_id,
  sender_id,
  body,
  created_at
)
values
  ('c0000000-0000-4000-8000-000000000001', (select id from direct_conversation), 'c1111111-1111-4111-8111-111111111111', 'First fixed direct message', '2099-10-01 10:00:00+00'),
  ('c0000000-0000-4000-8000-000000000002', (select id from direct_conversation), 'c1111111-1111-4111-8111-111111111111', 'Second fixed direct message', '2099-10-01 10:00:00+00'),
  ('c0000000-0000-4000-8000-000000000003', (select id from direct_conversation), 'c2222222-2222-4222-8222-222222222222', 'Third fixed direct message', '2099-10-01 11:00:00+00');

set local role authenticated;
set local request.jwt.claim.sub = 'c1111111-1111-4111-8111-111111111111';

select results_eq(
  format(
    'select body from public.list_direct_messages(%L, null, null, 2)',
    (select id from direct_conversation)
  ),
  $$values ('Third fixed direct message'::text), ('Second fixed direct message'::text)$$,
  'the first direct-message window is newest first'
);
select results_eq(
  format(
    'select body from public.list_direct_messages(%L, %L, %L, 1)',
    (select id from direct_conversation),
    '2099-10-01 10:00:00+00',
    'c0000000-0000-4000-8000-000000000002'
  ),
  $$values ('First fixed direct message'::text)$$,
  'the composite cursor loads only strictly older direct messages'
);
select lives_ok(
  format(
    'select public.mark_direct_conversation_read(%L, %L)',
    (select id from direct_conversation),
    'c0000000-0000-4000-8000-000000000003'
  ),
  'a participant can advance to the newest fixed direct message'
);
select lives_ok(
  format(
    'select public.mark_direct_conversation_read(%L, %L)',
    (select id from direct_conversation),
    'c0000000-0000-4000-8000-000000000001'
  ),
  'marking an older direct message is an idempotent no-op'
);
select is(
  (
    select last_read_message_id
    from public.direct_conversation_reads
    where conversation_id = (select id from direct_conversation)
      and user_id = 'c1111111-1111-4111-8111-111111111111'
  ),
  'c0000000-0000-4000-8000-000000000003'::uuid,
  'a direct read cursor never moves backward'
);
select throws_ok(
  format(
    'select public.send_direct_message(%L, %L)',
    (select id from direct_conversation),
    '   '
  ),
  '23514',
  null,
  'blank direct messages are rejected by the database constraint'
);
select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_messages'
  ),
  'direct messages are available to RLS-filtered Realtime subscriptions'
);
select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'direct_conversation_reads'
  ),
  'direct read cursors can sync across signed-in devices'
);
select ok(
  not has_table_privilege('authenticated', 'public.direct_conversation_reads', 'insert'),
  'authenticated clients cannot bypass the protected direct read function'
);
select ok(
  not has_table_privilege('authenticated', 'public.direct_messages', 'insert'),
  'authenticated clients cannot bypass the protected send function'
);

select * from finish();

rollback;
