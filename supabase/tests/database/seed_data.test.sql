begin;

select plan(6);

select is((select count(*)::integer from auth.users), 50, 'seed includes 50 users');
select is((select count(*)::integer from public.flocks), 10, 'seed includes 10 flocks');
select is((select count(*)::integer from public.flocks where location is not null), 10, 'every seeded flock has a location');
select is((select count(distinct description)::integer from public.flocks), 10, 'seeded flock descriptions are varied');
select ok((select count(*) from public.flock_events where flock_id is not null) >= 20, 'seed includes flock events');
select ok((select count(*) from public.flock_events where flock_id is null) >= 15, 'seed includes personal events');

select * from finish();

rollback;
