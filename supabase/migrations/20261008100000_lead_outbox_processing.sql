alter table public.lead_outbox
  add column action_snapshot jsonb not null default '{}'::jsonb;

comment on column public.lead_outbox.action_snapshot is
  'Allowlisted non-secret configuration captured when the lead is received.';

drop function public.create_lead_with_outbox(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz
);

create or replace function public.create_lead_with_outbox(
  p_user_id uuid,
  p_lead_flow_id uuid,
  p_source_id uuid,
  p_source_type text,
  p_email text,
  p_phone text,
  p_fields jsonb,
  p_received_at timestamptz,
  p_origin text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_lead_id uuid;
  v_follow_up_enabled boolean := false;
  v_follow_up_delay_hours integer;
  v_follow_up_due_at timestamptz;
  v_destination_provider text;
  v_destination_config jsonb;
  v_reply_enabled boolean := false;
  v_reply_channel text;
  v_reply_message text;
  v_reply_subject text;
  v_notification_email text;
  v_flow_name text;
  v_snapshot jsonb;
begin
  if p_user_id is null or p_lead_flow_id is null or p_source_id is null
    or p_received_at is null or p_source_type not in ('flowex_form', 'external_form')
    or p_fields is null or jsonb_typeof(p_fields) <> 'object'
    or p_fields = '{}'::jsonb or p_origin is null
  then
    raise exception 'Invalid lead creation input.';
  end if;

  if not exists (
    select 1 from public.lead_flows flow
    where flow.id = p_lead_flow_id and flow.user_id = p_user_id
      and flow.active is distinct from false
  ) then
    raise exception 'Lead flow ownership could not be verified.';
  end if;

  if not exists (
    select 1 from public.lead_sources source
    where source.id = p_source_id and source.user_id = p_user_id
      and source.lead_flow_id = p_lead_flow_id
      and source.source_type = p_source_type and source.enabled = true
      and (source.source_type <> 'external_form' or source.verified = true)
  ) then
    raise exception 'Lead source ownership could not be verified.';
  end if;

  select settings.enabled, settings.delay_hours
    into v_follow_up_enabled, v_follow_up_delay_hours
  from public.lead_follow_up_settings settings
  where settings.lead_flow_id = p_lead_flow_id and settings.user_id = p_user_id;

  if coalesce(v_follow_up_enabled, false) and p_email is not null
    and v_follow_up_delay_hours in (1, 6, 12, 24)
  then
    v_follow_up_due_at := p_received_at + make_interval(hours => v_follow_up_delay_hours);
  end if;

  insert into public.leads (
    user_id, lead_flow_id, source_id, source_type, email, phone, fields,
    created_at, status, contacted_at, follow_up_due_at, follow_up_sent_at, expires_at
  ) values (
    p_user_id, p_lead_flow_id, p_source_id, p_source_type, p_email, p_phone,
    p_fields, p_received_at, 'new', null, v_follow_up_due_at, null,
    p_received_at + interval '168 hours'
  ) returning id into v_lead_id;

  select destination.provider, destination.config
    into v_destination_provider, v_destination_config
  from public.lead_destinations destination
  where destination.lead_flow_id = p_lead_flow_id
    and destination.user_id = p_user_id and destination.connected = true
    and destination.provider in ('sheets', 'airtable', 'excel', 'notion', 'hubspot');

  if v_destination_provider is not null then
    v_snapshot := jsonb_build_object('display_name', coalesce(nullif(p_display_name, ''), 'Lead'));
    if v_destination_provider = 'sheets' then
      v_snapshot := v_snapshot || jsonb_build_object(
        'spreadsheet_id', case when jsonb_typeof(v_destination_config->'spreadsheet_id') = 'string' then v_destination_config->'spreadsheet_id' end,
        'sheet_title', case when jsonb_typeof(v_destination_config->'sheet_title') = 'string' then v_destination_config->'sheet_title' else '"Sheet1"'::jsonb end,
        'table_id', case when jsonb_typeof(v_destination_config->'table_id') = 'string' then v_destination_config->'table_id' end,
        'column_keys', case
          when jsonb_typeof(v_destination_config->'column_keys') = 'array' then coalesce((select jsonb_agg(items.value order by items.ordinality) from jsonb_array_elements(v_destination_config->'column_keys') with ordinality items(value, ordinality) where jsonb_typeof(items.value) = 'string'), '[]'::jsonb)
          when jsonb_typeof(v_destination_config->'field_keys') = 'array' then coalesce((select jsonb_agg(items.value order by items.ordinality) from jsonb_array_elements(v_destination_config->'field_keys') with ordinality items(value, ordinality) where jsonb_typeof(items.value) = 'string'), '[]'::jsonb)
          else '[]'::jsonb
        end
      );
    elsif v_destination_provider = 'airtable' then
      v_snapshot := v_snapshot || jsonb_build_object(
        'base_id', case when jsonb_typeof(v_destination_config->'base_id') = 'string' then v_destination_config->'base_id' end,
        'table_id', case when jsonb_typeof(v_destination_config->'table_id') = 'string' then v_destination_config->'table_id' end,
        'field_mapping', coalesce((select jsonb_object_agg(entry.key, jsonb_build_object('fieldName', entry.value->'fieldName'))
          from jsonb_each(case when jsonb_typeof(v_destination_config->'field_mapping') = 'object' then v_destination_config->'field_mapping' else '{}'::jsonb end) entry
          where jsonb_typeof(entry.value) = 'object' and jsonb_typeof(entry.value->'fieldName') = 'string'), '{}'::jsonb)
      );
    elsif v_destination_provider = 'excel' then
      v_snapshot := v_snapshot || jsonb_build_object(
        'workbook_id', case when jsonb_typeof(v_destination_config->'workbook_id') = 'string' then v_destination_config->'workbook_id' end,
        'table_id', case when jsonb_typeof(v_destination_config->'table_id') = 'string' then v_destination_config->'table_id' end,
        'column_keys', coalesce((select jsonb_agg(items.value order by items.ordinality) from jsonb_array_elements(case when jsonb_typeof(v_destination_config->'column_keys') = 'array' then v_destination_config->'column_keys' else '[]'::jsonb end) with ordinality items(value, ordinality) where jsonb_typeof(items.value) = 'string'), '[]'::jsonb)
      );
    elsif v_destination_provider = 'notion' then
      v_snapshot := v_snapshot || jsonb_build_object(
        'database_id', case when jsonb_typeof(v_destination_config->'database_id') = 'string' then v_destination_config->'database_id' end,
        'data_source_id', case when jsonb_typeof(v_destination_config->'data_source_id') = 'string' then v_destination_config->'data_source_id' end,
        'property_map', coalesce((select jsonb_object_agg(entry.key, entry.value) from jsonb_each(case when jsonb_typeof(v_destination_config->'property_map') = 'object' then v_destination_config->'property_map' else '{}'::jsonb end) entry where jsonb_typeof(entry.value) = 'string'), '{}'::jsonb),
        'property_types', coalesce((select jsonb_object_agg(entry.key, case when entry.value #>> '{}' in ('title', 'rich_text', 'number', 'select', 'date', 'url', 'email', 'phone_number', 'checkbox') then entry.value else '"rich_text"'::jsonb end) from jsonb_each(case when jsonb_typeof(v_destination_config->'property_types') = 'object' then v_destination_config->'property_types' else '{}'::jsonb end) entry where jsonb_typeof(entry.value) = 'string'), '{}'::jsonb)
      );
    elsif v_destination_provider = 'hubspot' then
      v_snapshot := v_snapshot || jsonb_build_object('field_map', coalesce((select jsonb_object_agg(entry.key, jsonb_strip_nulls(jsonb_build_object(
        'property', case when jsonb_typeof(entry.value->'property') = 'string' then entry.value->'property' end,
        'secondary', case when jsonb_typeof(entry.value->'secondary') = 'string' then entry.value->'secondary' end,
        'kind', case when entry.value->>'kind' = 'full_name' then '"full_name"'::jsonb end
      ))) from jsonb_each(case when jsonb_typeof(v_destination_config->'field_map') = 'object' then v_destination_config->'field_map' else '{}'::jsonb end) entry where jsonb_typeof(entry.value) = 'object' and jsonb_typeof(entry.value->'property') = 'string'), '{}'::jsonb));
    end if;

    insert into public.lead_outbox (lead_id, action_key, provider, action_type, action_snapshot)
    values (v_lead_id, 'destination:' || v_destination_provider, v_destination_provider, 'destination_write', v_snapshot);
  end if;

  select settings.enabled, settings.channel, settings.message, settings.subject
    into v_reply_enabled, v_reply_channel, v_reply_message, v_reply_subject
  from public.lead_reply_settings settings
  where settings.lead_flow_id = p_lead_flow_id and settings.user_id = p_user_id;

  if coalesce(v_reply_enabled, false) and v_reply_channel = 'email' and p_email is not null
    and nullif(btrim(v_reply_message), '') is not null
  then
    insert into public.lead_outbox (lead_id, action_key, provider, action_type, action_snapshot)
    values (v_lead_id, 'automatic_gmail_reply', 'gmail', 'automatic_reply',
      jsonb_build_object('message', btrim(v_reply_message), 'subject', coalesce(nullif(btrim(v_reply_subject), ''), 'Thanks for reaching out')));
  end if;

  select notification_email.email, flow.name
    into v_notification_email, v_flow_name
  from public.lead_flows flow
  join public.notification_emails notification_email
    on notification_email.id = flow.notification_email_id and notification_email.user_id = p_user_id
  where flow.id = p_lead_flow_id and flow.user_id = p_user_id
    and nullif(btrim(notification_email.email), '') is not null;

  if v_notification_email is not null then
    insert into public.lead_outbox (lead_id, action_key, provider, action_type, action_snapshot)
    values (v_lead_id, 'team_notification', 'resend', 'team_notification',
      jsonb_build_object('recipient', btrim(v_notification_email), 'flow_name', coalesce(nullif(btrim(v_flow_name), ''), 'Lead Flow'), 'origin', p_origin));
  end if;

  return v_lead_id;
end;
$$;

revoke all on function public.create_lead_with_outbox(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.create_lead_with_outbox(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, text, text
) to service_role;

create or replace function public.claim_due_lead_outbox(p_limit integer default 10)
returns setof public.lead_outbox
language sql
security definer
set search_path = pg_catalog, public
as $$
  with candidates as (
    select outbox.id
    from public.lead_outbox outbox
    where (outbox.status = 'pending' and outbox.next_attempt_at <= now())
       or (outbox.status = 'processing' and outbox.claimed_at < now() - interval '15 minutes')
    order by outbox.next_attempt_at, outbox.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 10), 1), 25)
  )
  update public.lead_outbox outbox
  set status = 'processing', claim_token = gen_random_uuid(), claimed_at = now(),
      attempts = outbox.attempts + 1, updated_at = now()
  from candidates
  where outbox.id = candidates.id
  returning outbox.*;
$$;

revoke all on function public.claim_due_lead_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_due_lead_outbox(integer) to service_role;
