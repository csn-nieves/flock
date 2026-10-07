begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'flock_events'
      and column_name = 'flock_id'
      and is_nullable = 'YES'
  ),
  'flock_id is nullable for user-owned events'
);

select has_index(
  'public',
  'flock_events',
  'flock_events_created_by_idx',
  'user-owned event lookups are indexed'
);

select has_function(
  'public',
  'create_user_event',
  array['text', 'timestamp with time zone', 'text', 'text', 'jsonb'],
  'users can create events without a flock'
);

select ok(
  not has_table_privilege('anon', 'public.flock_events', 'insert,update,delete'),
  'anonymous users cannot write events'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_user_event(text, timestamptz, text, text, jsonb)',
    'execute'
  ),
  'authenticated users can call the user event function'
);

select ok(
  (select prosrc like '%return created_event%'
   from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname = 'create_user_event'),
  'user event creation returns the inserted event'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'flock_events'
      and policyname = 'Authorized users can read events'
  ),
  'event reads use an explicit authorization policy'
);

select ok(
  (
    select qual is not null
    from pg_policies
    where schemaname = 'public'
      and tablename = 'flock_events'
      and policyname = 'Authorized users can read events'
  ),
  'event creators have an explicit read authorization branch'
);

select ok(
  (
    select qual is not null
    from pg_policies
    where schemaname = 'public'
      and tablename = 'flock_events'
      and policyname = 'Authorized users can read events'
  ),
  'flock members retain an explicit read authorization branch'
);

select * from finish();
rollback;
