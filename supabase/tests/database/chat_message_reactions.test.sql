begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select has_table(
  'public',
  'chat_message_reactions',
  'chat reactions are stored in a dedicated protected table'
);
select has_function(
  'public',
  'toggle_flock_message_reaction',
  array['uuid', 'text'],
  'flock reactions are toggled through a protected function'
);
select has_function(
  'public',
  'toggle_direct_message_reaction',
  array['uuid', 'text'],
  'direct reactions are toggled through a protected function'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'e1111111-1111-4111-8111-111111111111',
    'reaction-owner@example.com',
    '{"display_name":"Reaction Owner"}'
  ),
  (
    'e2222222-2222-4222-8222-222222222222',
    'reaction-member@example.com',
    '{"display_name":"Reaction Member"}'
  ),
  (
    'e3333333-3333-4333-8333-333333333333',
    'reaction-outsider@example.com',
    '{"display_name":"Reaction Outsider"}'
  );

insert into public.flocks (id, owner_id, name)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'Reaction Test Flock'
);

insert into public.flock_members (flock_id, user_id, role)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e2222222-2222-4222-8222-222222222222',
  'member'
);

set local role authenticated;
set local request.jwt.claim.sub = 'e1111111-1111-4111-8111-111111111111';

create temporary table created_reaction_message as
select *
from public.send_flock_message(
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'React to this message.'
);

set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';

select is(
  public.toggle_flock_message_reaction(
    (select id from created_reaction_message),
    'heart'
  ),
  true,
  'a flock member can add one reaction'
);
select is(
  (
    select count(*)
    from public.chat_message_reactions
    where flock_message_id = (select id from created_reaction_message)
      and user_id = 'e2222222-2222-4222-8222-222222222222'
      and reaction_key = 'heart'
  ),
  1::bigint,
  'the reaction is stored for the acting member'
);
select is(
  public.toggle_flock_message_reaction(
    (select id from created_reaction_message),
    'heart'
  ),
  false,
  'toggling the same reaction removes it'
);
select is(
  (
    select count(*)
    from public.chat_message_reactions
    where flock_message_id = (select id from created_reaction_message)
  ),
  0::bigint,
  'removed reactions no longer appear in the table'
);

set local request.jwt.claim.sub = 'e3333333-3333-4333-8333-333333333333';

select throws_ok(
  format(
    'select public.toggle_flock_message_reaction(%L, %L)',
    (select id from created_reaction_message),
    'fire'
  ),
  '42501',
  'Flock membership is required.',
  'an outsider cannot react to a flock message'
);
select is(
  (
    select count(*)
    from public.chat_message_reactions
    where flock_message_id = (select id from created_reaction_message)
  ),
  0::bigint,
  'an outsider cannot create a hidden reaction row'
);

set local request.jwt.claim.sub = 'e1111111-1111-4111-8111-111111111111';

create temporary table created_reaction_conversation as
select *
from (
  select public.get_or_create_direct_conversation(
  'e2222222-2222-4222-8222-222222222222'
) as id
) as conversation;

create temporary table created_direct_reaction_message as
select *
from public.send_direct_message(
  (select id from created_reaction_conversation),
  'React to this private message.'
);

set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';

select is(
  public.toggle_direct_message_reaction(
    (select id from created_direct_reaction_message),
    'thumbs_up'
  ),
  true,
  'a direct-message participant can add a reaction'
);
select is(
  (
    select count(*)
    from public.chat_message_reactions
    where direct_message_id = (select id from created_direct_reaction_message)
  ),
  1::bigint,
  'direct-message reactions use the same protected storage'
);
select is(
  public.toggle_direct_message_reaction(
    (select id from created_direct_reaction_message),
    'thumbs_up'
  ),
  false,
  'a direct-message participant can remove their reaction'
);

reset role;

select * from finish();

rollback;
