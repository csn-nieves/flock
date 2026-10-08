begin;

select plan(17);

select is((select count(*)::integer from auth.users), 50, 'seed includes 50 users');
select is((select count(*)::integer from public.flocks), 10, 'seed includes 10 flocks');
select is((select count(*)::integer from public.flocks where location is not null), 10, 'every seeded flock has a location');
select is((select count(distinct description)::integer from public.flocks), 10, 'seeded flock descriptions are varied');
select ok((select count(*) from public.flock_events where flock_id is not null) >= 20, 'seed includes flock events');
select is(
  (select count(*)::integer from public.flocks as flock where not exists (
    select 1 from public.flock_events as event where event.flock_id = flock.id
  )),
  0,
  'every seeded flock has at least one event'
);
select is((select count(*)::integer from public.flock_events where flock_id is null), 100, 'every seeded runner has two personal events');
select is(
  (select count(*)::integer from public.profiles as profile where (
    select count(*) from public.flock_events as event
    where event.flock_id is null and event.created_by = profile.user_id
  ) < 2),
  0,
  'every seeded runner owns at least two personal events'
);
select is((select count(*)::integer from public.saved_routes), 2, 'seed includes reusable routes for the local runner');
select is((select count(*)::integer from public.flock_messages), 36, 'seed includes enough flock messages to exercise infinite history');
select is((select count(*)::integer from public.flock_chat_reads), 1, 'seed includes a flock read cursor for unread-state previews');
select is((select count(*)::integer from public.direct_conversation_reads), 2, 'seed includes independent direct-message read cursors');
select is((select count(distinct display_name)::integer from public.profiles), 50, 'every seeded runner has a distinct display name');
select is((select count(distinct name)::integer from public.flocks), 10, 'every seeded flock has a distinct name');
select is((select count(distinct title)::integer from public.flock_events), 120, 'every seeded event has a distinct title');
select is((select count(distinct body)::integer from public.flock_messages), 36, 'every seeded flock message is distinct');
select is((select count(distinct body)::integer from public.direct_messages), 12, 'every seeded direct message is distinct');

select * from finish();

rollback;
