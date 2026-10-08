begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

select has_table('public', 'flock_messages', 'flock messages are stored in a public RLS table');
select has_column('public', 'flock_messages', 'flock_id', 'messages belong to one flock');
select has_column('public', 'flock_messages', 'sender_id', 'messages record their authenticated sender');
select has_column('public', 'flock_messages', 'body', 'messages store plain text');
select has_function(
  'public',
  'list_my_flock_chats',
  array[]::text[],
  'the chat panel has a current-member conversation list'
);
select has_function(
  'public',
  'list_flock_messages',
  array['uuid', 'timestamp with time zone', 'uuid', 'integer'],
  'message history has a cursor-window function'
);
select has_function(
  'public',
  'send_flock_message',
  array['uuid', 'text'],
  'messages are sent through a protected function'
);
select has_index(
  'public',
  'flock_messages',
  'flock_messages_flock_created_id_idx',
  'the flock and cursor columns share one index'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values
  ('b1111111-1111-4111-8111-111111111111', 'chat-owner@example.com', '{"display_name":"Chat Owner"}', '{}'),
  ('b2222222-2222-4222-8222-222222222222', 'chat-member@example.com', '{"display_name":"Chat Member"}', '{}'),
  ('b3333333-3333-4333-8333-333333333333', 'chat-outsider@example.com', '{"display_name":"Chat Outsider"}', '{}'),
  ('b4444444-4444-4444-8444-444444444444', 'chat-admin@example.com', '{"display_name":"Chat Admin"}', '{"role":"superadmin"}');

set local role authenticated;
set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

insert into public.flocks (id, name)
values ('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Chat Flock');

reset role;
insert into public.flock_members (flock_id, user_id, role)
values (
  'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'b2222222-2222-4222-8222-222222222222',
  'member'
);

set local role authenticated;
set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

create temporary table owner_message as
select * from public.send_flock_message(
  'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '  Meet beside the fountain.  '
);

select is(
  (select body from owner_message),
  'Meet beside the fountain.',
  'message creation trims surrounding whitespace'
);
select is(
  (select sender_id from owner_message),
  'b1111111-1111-4111-8111-111111111111'::uuid,
  'message creation derives the sender from auth.uid'
);
select is(
  (
    select sender_display_name
    from public.list_flock_messages('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    limit 1
  ),
  'Chat Owner',
  'members receive the public sender name with history'
);

set local request.jwt.claim.sub = 'b2222222-2222-4222-8222-222222222222';

select lives_ok(
  $$select public.send_flock_message(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'I will bring water.'
  )$$,
  'another current member can send a message'
);
select is(
  (select count(*) from public.list_flock_messages('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')),
  2::bigint,
  'another current member can read flock history'
);
select results_eq(
  $$select flock_name from public.list_my_flock_chats()$$,
  $$values ('Chat Flock'::text)$$,
  'a member sees their flock in the chat panel'
);

set local request.jwt.claim.sub = 'b3333333-3333-4333-8333-333333333333';

select is(
  (select count(*) from public.list_flock_messages('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')),
  0::bigint,
  'a nonmember cannot read flock history'
);
select is(
  (select count(*) from public.list_my_flock_chats()),
  0::bigint,
  'a nonmember does not see the flock in the chat panel'
);
select throws_ok(
  $$select public.send_flock_message(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Not allowed'
  )$$,
  '42501',
  'Flock membership is required.',
  'a nonmember cannot send to flock chat'
);

set local request.jwt.claim.sub = 'b4444444-4444-4444-8444-444444444444';
set local request.jwt.claims = '{"sub":"b4444444-4444-4444-8444-444444444444","app_metadata":{"role":"superadmin"}}';

select is(
  (select count(*) from public.list_flock_messages('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')),
  0::bigint,
  'a superadmin without membership cannot read private flock chat'
);
select is(
  (select count(*) from public.list_my_flock_chats()),
  0::bigint,
  'a superadmin without membership does not see private flock chat'
);
select throws_ok(
  $$select public.send_flock_message(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Admin message'
  )$$,
  '42501',
  'Flock membership is required.',
  'a superadmin without membership cannot send to private flock chat'
);

reset role;
insert into public.flock_messages (id, flock_id, sender_id, body, created_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'b1111111-1111-4111-8111-111111111111', 'First fixed message', '2099-10-01 10:00:00+00'),
  ('b0000000-0000-4000-8000-000000000002', 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'b1111111-1111-4111-8111-111111111111', 'Second fixed message', '2099-10-01 10:00:00+00'),
  ('b0000000-0000-4000-8000-000000000003', 'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'b2222222-2222-4222-8222-222222222222', 'Third fixed message', '2099-10-01 11:00:00+00');

set local role authenticated;
set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

select results_eq(
  $$select body from public.list_flock_messages(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null, 2
  )$$,
  $$values ('Third fixed message'::text), ('Second fixed message'::text)$$,
  'the first history window is newest first'
);
select results_eq(
  $$select body from public.list_flock_messages(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '2099-10-01 10:00:00+00',
    'b0000000-0000-4000-8000-000000000002',
    1
  )$$,
  $$values ('First fixed message'::text)$$,
  'the composite cursor loads only strictly older messages'
);

select throws_ok(
  $$select public.send_flock_message(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '   '
  )$$,
  '23514',
  null,
  'blank messages are rejected by the database constraint'
);

select ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'flock_messages'
  ),
  'flock messages are available to RLS-filtered Realtime subscriptions'
);

select * from finish();

rollback;
