begin;

select plan(10);

select is((select count(*)::integer from auth.users), 50, 'seed includes 50 users');
select is((select count(*)::integer from public.flocks), 10, 'seed includes 10 flocks');
select is((select count(*)::integer from public.flocks where location is not null), 10, 'every seeded flock has a location');
select is((select count(distinct description)::integer from public.flocks), 10, 'seeded flock descriptions are varied');
select ok((select count(*) from public.flock_events where flock_id is not null) >= 20, 'seed includes flock events');
select ok((select count(*) from public.flock_events where flock_id is null) >= 15, 'seed includes personal events');
select is((select count(*)::integer from public.saved_routes), 2, 'seed includes reusable routes for the local runner');
select is((select count(*)::integer from public.flock_messages), 36, 'seed includes enough flock messages to exercise infinite history');
select is((select count(*)::integer from public.flock_chat_reads), 1, 'seed includes a flock read cursor for unread-state previews');
select is((select count(*)::integer from public.direct_conversation_reads), 2, 'seed includes independent direct-message read cursors');

select * from finish();

rollback;
