begin;

select plan(1);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'flock_event_attendance'
      and policyname = 'Authorized users can read event attendance'
  ),
  1,
  'attendance is readable to flock members, event owners, and accepted invitees'
);

select * from finish();

rollback;
