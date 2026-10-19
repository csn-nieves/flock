alter table public.flock_events
add column time_zone text,
add column reminders_enabled boolean not null default false;

create function private.valid_event_time_zone(target_time_zone text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = target_time_zone
  );
$$;

create table private.event_reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.flock_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_minutes integer not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  processing_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default clock_timestamp(),
  constraint event_reminder_jobs_minutes_check check (reminder_minutes in (60, 1440)),
  constraint event_reminder_jobs_status_check check (
    status in ('pending', 'processing', 'waiting_for_subscription', 'sent', 'failed', 'skipped')
  ),
  unique (event_id, user_id, reminder_minutes)
);

create index event_reminder_jobs_due_idx
on private.event_reminder_jobs (status, scheduled_for)
where status in ('pending', 'failed');

revoke all on table private.event_reminder_jobs from public, anon, authenticated;

alter table private.notification_jobs
drop constraint notification_jobs_one_source_check;

alter table private.notification_jobs
add column event_reminder_id uuid references private.event_reminder_jobs (id) on delete cascade;

alter table private.notification_jobs
add constraint notification_jobs_one_source_check check (
  num_nonnulls(
    invitation_id,
    event_activity_id,
    flock_message_id,
    direct_message_id,
    event_reminder_id
  ) = 1
);

create unique index notification_jobs_event_reminder_user_idx
on private.notification_jobs (event_reminder_id, user_id)
where event_reminder_id is not null;

alter table public.notifications
drop constraint notifications_kind_check;

alter table public.notifications
add constraint notifications_kind_check check (
  kind in ('event_invitation', 'event_reminder', 'flock_event', 'flock_message', 'direct_message')
);

alter table public.notification_preferences
add column event_reminders boolean not null default true;

create or replace function private.notification_kind_enabled(
  target_user_id uuid,
  target_kind text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case target_kind
        when 'event_invitation' then coalesce(preferences.event_invitations, true)
        when 'event_reminder' then coalesce(preferences.event_reminders, true)
        when 'flock_event' then coalesce(preferences.flock_events, true)
        when 'flock_message' then coalesce(preferences.chat_messages, true)
        when 'direct_message' then coalesce(preferences.chat_messages, true)
        else true
      end
      from public.notification_preferences as preferences
      where preferences.user_id = target_user_id
    ),
    true
  );
$$;

create or replace function public.update_notification_preferences(
  target_event_invitations boolean,
  target_flock_events boolean,
  target_chat_messages boolean
)
returns public.notification_preferences
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  return public.update_notification_preferences(
    target_event_invitations,
    target_flock_events,
    target_chat_messages,
    true
  );
end;
$$;

create or replace function public.update_notification_preferences(
  target_event_invitations boolean,
  target_flock_events boolean,
  target_chat_messages boolean,
  target_event_reminders boolean
)
returns public.notification_preferences
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  preferences public.notification_preferences;
begin
  if current_user_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  insert into public.notification_preferences (
    user_id, event_invitations, flock_events, chat_messages, event_reminders, updated_at
  )
  values (
    current_user_id,
    target_event_invitations,
    target_flock_events,
    target_chat_messages,
    target_event_reminders,
    clock_timestamp()
  )
  on conflict (user_id) do update set
    event_invitations = excluded.event_invitations,
    flock_events = excluded.flock_events,
    chat_messages = excluded.chat_messages,
    event_reminders = excluded.event_reminders,
    updated_at = clock_timestamp()
  returning * into preferences;

  delete from private.notification_jobs as job
  where job.user_id = current_user_id
    and job.status in ('pending', 'waiting_for_subscription', 'failed')
    and (
      (not target_event_invitations and job.invitation_id is not null)
      or (not target_flock_events and job.event_activity_id is not null)
      or (not target_chat_messages and (job.flock_message_id is not null or job.direct_message_id is not null))
      or (not target_event_reminders and job.event_reminder_id is not null)
    );

  return preferences;
end;
$$;

revoke execute on function public.update_notification_preferences(boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.update_notification_preferences(boolean, boolean, boolean, boolean) to authenticated;

create or replace function private.enqueue_due_event_reminders()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  reminder_row record;
  participant_row record;
  reminder_job_id uuid;
begin
  for reminder_row in
    select
      event.id,
      event.title,
      event.starts_at,
      event.time_zone,
      event.flock_id,
      event.created_by,
      event.starts_at - make_interval(mins => reminder.reminder_minutes) as scheduled_for,
      reminder.reminder_minutes
    from public.flock_events as event
    cross join (values (60), (1440)) as reminder(reminder_minutes)
    where event.starts_at > clock_timestamp()
      and event.canceled_at is null
      and event.reminders_enabled
      and event.time_zone is not null
      and event.starts_at - make_interval(mins => reminder.reminder_minutes) <= clock_timestamp()
  loop
    for participant_row in
      select distinct attendee.user_id
      from (
        select reminder_row.created_by as user_id
        union
        select attendance.user_id
        from public.flock_event_attendance as attendance
        where attendance.event_id = reminder_row.id
          and attendance.response in ('in', 'maybe')
      ) as attendee
    loop
      insert into private.event_reminder_jobs (
        event_id, user_id, reminder_minutes, scheduled_for
      )
      values (
        reminder_row.id,
        participant_row.user_id,
        reminder_row.reminder_minutes,
        reminder_row.scheduled_for
      )
      on conflict (event_id, user_id, reminder_minutes) do nothing;

      select job.id
      into reminder_job_id
      from private.event_reminder_jobs as job
      where job.event_id = reminder_row.id
        and job.user_id = participant_row.user_id
        and job.reminder_minutes = reminder_row.reminder_minutes;

      perform private.insert_in_app_notification(
        participant_row.user_id,
        'event_reminder',
        case reminder_row.reminder_minutes
          when 1440 then 'Event tomorrow'
          else 'Event starting soon'
        end,
        format(
          '%s starts %s %s.',
          reminder_row.title,
          to_char(reminder_row.starts_at at time zone reminder_row.time_zone, 'Dy, Mon FMDD at FMHH12:MI AM'),
          reminder_row.time_zone
        ),
        format('/events/%s', reminder_row.id),
        reminder_job_id
      );
    end loop;
  end loop;

  insert into private.notification_jobs (event_reminder_id, user_id)
  select job.id, job.user_id
  from private.event_reminder_jobs as job
  join public.flock_events as event on event.id = job.event_id
  where job.status in ('pending', 'failed')
    and job.scheduled_for <= clock_timestamp()
    and event.starts_at > clock_timestamp()
    and event.canceled_at is null
    and event.reminders_enabled
    and event.time_zone is not null
    and private.notification_kind_enabled(job.user_id, 'event_reminder')
  on conflict do nothing;
end;
$$;

revoke all on function private.enqueue_due_event_reminders() from public, anon, authenticated;

create function public.create_flock_event(
  target_flock_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb,
  event_time_zone text
)
returns public.flock_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_result record;
  created_event public.flock_events;
begin
  if not private.valid_event_time_zone(event_time_zone) then
    raise check_violation using message = 'Choose a valid event time zone.';
  end if;

  select *
  into created_result
  from public.create_flock_event(
    target_flock_id,
    event_title,
    event_starts_at,
    event_location,
    event_description,
    event_run_options
  ) as event;

  select event.*
  into created_event
  from public.flock_events as event
  where event.id = created_result.id;

  update public.flock_events
  set time_zone = event_time_zone,
      reminders_enabled = true
  where id = created_event.id
  returning * into created_event;

  return created_event;
end;
$$;

create function public.create_user_event(
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb,
  event_time_zone text
)
returns public.flock_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_event public.flock_events;
begin
  if not private.valid_event_time_zone(event_time_zone) then
    raise check_violation using message = 'Choose a valid event time zone.';
  end if;

  created_event := public.create_user_event(
    event_title,
    event_starts_at,
    event_location,
    event_description,
    event_run_options
  );

  update public.flock_events
  set time_zone = event_time_zone,
      reminders_enabled = true
  where id = created_event.id
  returning * into created_event;

  return created_event;
end;
$$;

create function public.update_flock_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_location text,
  event_description text,
  event_run_options jsonb,
  event_time_zone text
)
returns public.flock_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_event public.flock_events;
begin
  if not private.valid_event_time_zone(event_time_zone) then
    raise check_violation using message = 'Choose a valid event time zone.';
  end if;

  updated_event := public.update_flock_event(
    target_event_id,
    event_title,
    event_starts_at,
    event_location,
    event_description,
    event_run_options
  );

  update public.flock_events
  set time_zone = event_time_zone,
      reminders_enabled = true
  where id = target_event_id
  returning * into updated_event;

  return updated_event;
end;
$$;

revoke execute on function public.create_flock_event(uuid, text, timestamptz, text, text, jsonb, text) from public, anon;
revoke execute on function public.create_user_event(text, timestamptz, text, text, jsonb, text) from public, anon;
revoke execute on function public.update_flock_event(uuid, text, timestamptz, text, text, jsonb, text) from public, anon;
grant execute on function public.create_flock_event(uuid, text, timestamptz, text, text, jsonb, text) to authenticated;
grant execute on function public.create_user_event(text, timestamptz, text, text, jsonb, text) to authenticated;
grant execute on function public.update_flock_event(uuid, text, timestamptz, text, text, jsonb, text) to authenticated;

do $migration$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.claim_push_notification(uuid)'::regprocedure)
  into function_definition;

  function_definition := replace(
    function_definition,
    $old$  claimed_direct_conversation public.direct_conversations;$old$,
    $new$  claimed_direct_conversation public.direct_conversations;
  claimed_reminder private.event_reminder_jobs;$new$
  );
  function_definition := replace(
    function_definition,
    $old$  elsif claimed_job.flock_message_id is not null then$old$,
    $new$  elsif claimed_job.event_reminder_id is not null then
    select reminder.* into claimed_reminder
    from private.event_reminder_jobs as reminder
    where reminder.id = claimed_job.event_reminder_id;

    select event.* into claimed_event
    from public.flock_events as event
    where event.id = claimed_reminder.event_id;

    is_eligible := claimed_reminder.id is not null
      and claimed_event.id is not null
      and claimed_event.starts_at > clock_timestamp()
      and claimed_event.canceled_at is null
      and claimed_event.reminders_enabled
      and claimed_event.time_zone is not null
      and claimed_reminder.scheduled_for <= clock_timestamp()
      and (
        claimed_reminder.user_id = claimed_event.created_by
        or exists (
          select 1
          from public.flock_event_attendance as attendance
          where attendance.event_id = claimed_event.id
            and attendance.user_id = claimed_reminder.user_id
            and attendance.response in ('in', 'maybe')
        )
      );

    push_title := case claimed_reminder.reminder_minutes
      when 1440 then 'Event tomorrow'
      else 'Event starting soon'
    end;
    push_body := format(
      '%s starts %s %s.',
      claimed_event.title,
      to_char(claimed_event.starts_at at time zone claimed_event.time_zone, 'Dy, Mon FMDD at FMHH12:MI AM'),
      claimed_event.time_zone
    );
    push_path := format('/events/%s', claimed_event.id);
    push_tag := format('event-reminder-%s-%s', claimed_event.id, claimed_reminder.reminder_minutes);
    push_ttl := greatest(
      0,
      least(
        86400,
        floor(extract(epoch from claimed_event.starts_at - clock_timestamp()))::integer
      )
    );
  elsif claimed_job.flock_message_id is not null then
$new$
  );
  execute function_definition;
end;
$migration$;

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'flock-event-reminders',
  '*/5 * * * *',
  $$select private.enqueue_due_event_reminders();$$
)
where not exists (select 1 from cron.job where jobname = 'flock-event-reminders');

comment on table private.event_reminder_jobs is 'Idempotent per-recipient reminders for runners attending upcoming events.';
