begin;

select plan(4);

select is((select count(*)::integer from auth.users), 50, 'seed includes 50 users');
select is((select count(*)::integer from public.flocks), 10, 'seed includes 10 flocks');
select ok((select count(*) from public.flock_events where flock_id is not null) >= 20, 'seed includes flock events');
select ok((select count(*) from public.flock_events where flock_id is null) >= 15, 'seed includes personal events');

select * from finish();

rollback;
