create or replace function private.plain_text_notification_message(message_body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  encoded_runs jsonb;
  plain_text text;
begin
  if left(message_body, 14) <> 'flock-rich:v1:' then
    return message_body;
  end if;

  begin
    encoded_runs := substring(message_body from 15)::jsonb;
    select string_agg(run.value ->> 0, '' order by run.ordinality)
    into plain_text
    from pg_catalog.jsonb_array_elements(encoded_runs) with ordinality as run(value, ordinality);
  exception when others then
    return message_body;
  end;

  return coalesce(plain_text, '');
end;
$$;

do $migration$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.claim_push_notification(uuid)'::regprocedure)
  into function_definition;

  function_definition := replace(
    function_definition,
    $old$push_body := format('%s sent a message.', coalesce(sender_name, 'A runner'));$old$,
    $new$push_body := format(
      '%s: %s',
      coalesce(sender_name, 'A runner'),
      left(private.plain_text_notification_message(claimed_flock_message.body), 160)
    );$new$
  );
  function_definition := replace(
    function_definition,
    $old$push_body := format('%s sent you a message.', coalesce(sender_name, 'A runner'));$old$,
    $new$push_body := format(
      '%s: %s',
      coalesce(sender_name, 'A runner'),
      left(private.plain_text_notification_message(claimed_direct_message.body), 160)
    );$new$
  );

  execute function_definition;
end;
$migration$;

comment on function private.plain_text_notification_message(text) is
  'Converts the bounded rich-text message encoding into lock-screen-safe plain text.';
