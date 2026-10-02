begin;
create extension if not exists pgtap with schema extensions;
select plan(4);
select has_function('public', 'update_flock_event', array['uuid', 'text', 'timestamp with time zone', 'text', 'text'], 'event update RPC remains available');
select has_function('public', 'cancel_flock_event', array['uuid'], 'event cancel RPC remains available');
select ok(has_function_privilege('authenticated', 'public.update_flock_event(uuid, text, timestamptz, text, text)', 'execute'), 'authenticated users can call event updates');
select ok(has_function_privilege('authenticated', 'public.cancel_flock_event(uuid)', 'execute'), 'authenticated users can call event cancellation');
select * from finish();
rollback;
