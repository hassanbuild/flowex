create table public.lead_outbox (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null
    references public.leads(id)
    on delete cascade,
  action_key text not null,
  provider text not null,
  action_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'blocked')),
  attempts integer not null default 0
    check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claimed_at timestamptz,
  completed_at timestamptz,
  last_error_code varchar(100)
    check (
      last_error_code is null
      or last_error_code ~ '^[a-z0-9_.-]{1,100}$'
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_outbox_lead_action_unique
    unique (lead_id, action_key),
  constraint lead_outbox_provider_check
    check (provider in ('sheets', 'airtable', 'excel', 'notion', 'hubspot', 'gmail', 'resend')),
  constraint lead_outbox_action_type_check
    check (action_type in ('destination_write', 'automatic_reply', 'team_notification')),
  constraint lead_outbox_action_provider_check
    check (
      (action_type = 'destination_write'
        and provider in ('sheets', 'airtable', 'excel', 'notion', 'hubspot'))
      or (action_type = 'automatic_reply' and provider = 'gmail')
      or (action_type = 'team_notification' and provider = 'resend')
    ),
  constraint lead_outbox_claim_state_check
    check (
      (status = 'processing' and claim_token is not null and claimed_at is not null)
      or (status <> 'processing' and claim_token is null and claimed_at is null)
    ),
  constraint lead_outbox_completion_state_check
    check (
      (status in ('succeeded', 'blocked') and completed_at is not null)
      or (status in ('pending', 'processing') and completed_at is null)
    )
);

comment on table public.lead_outbox is
  'Durable per-lead downstream actions. Contains no provider credentials or secrets.';
comment on column public.lead_outbox.last_error_code is
  'Normalized, non-secret error code only; raw provider errors and credentials must never be stored here.';

create index lead_outbox_pending_due_idx
  on public.lead_outbox (next_attempt_at, created_at)
  where status = 'pending';

create index lead_outbox_stale_claim_idx
  on public.lead_outbox (claimed_at)
  where status = 'processing';

create index lead_outbox_lead_lookup_idx
  on public.lead_outbox (lead_id, created_at);

alter table public.lead_outbox enable row level security;
revoke all on public.lead_outbox from public, anon, authenticated;
grant all on public.lead_outbox to service_role;

create or replace function public.create_lead_with_outbox(
  p_user_id uuid,
  p_lead_flow_id uuid,
  p_source_id uuid,
  p_source_type text,
  p_email text,
  p_phone text,
  p_fields jsonb,
  p_received_at timestamptz
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
  v_reply_enabled boolean := false;
  v_reply_channel text;
  v_reply_message text;
  v_notification_enabled boolean := false;
begin
  if p_user_id is null
    or p_lead_flow_id is null
    or p_source_id is null
    or p_received_at is null
    or p_source_type not in ('flowex_form', 'external_form')
    or p_fields is null
    or jsonb_typeof(p_fields) <> 'object'
    or p_fields = '{}'::jsonb
  then
    raise exception 'Invalid lead creation input.';
  end if;

  if not exists (
    select 1
    from public.lead_flows as flow
    where flow.id = p_lead_flow_id
      and flow.user_id = p_user_id
      and flow.active is distinct from false
  ) then
    raise exception 'Lead flow ownership could not be verified.';
  end if;

  if not exists (
    select 1
    from public.lead_sources as source
    where source.id = p_source_id
      and source.user_id = p_user_id
      and source.lead_flow_id = p_lead_flow_id
      and source.source_type = p_source_type
      and source.enabled = true
      and (source.source_type <> 'external_form' or source.verified = true)
  ) then
    raise exception 'Lead source ownership could not be verified.';
  end if;

  select settings.enabled, settings.delay_hours
  into v_follow_up_enabled, v_follow_up_delay_hours
  from public.lead_follow_up_settings as settings
  where settings.lead_flow_id = p_lead_flow_id
    and settings.user_id = p_user_id;

  if coalesce(v_follow_up_enabled, false)
    and p_email is not null
    and v_follow_up_delay_hours in (1, 6, 12, 24)
  then
    v_follow_up_due_at := p_received_at
      + make_interval(hours => v_follow_up_delay_hours);
  end if;

  insert into public.leads (
    user_id,
    lead_flow_id,
    source_id,
    source_type,
    email,
    phone,
    fields,
    created_at,
    status,
    contacted_at,
    follow_up_due_at,
    follow_up_sent_at,
    expires_at
  ) values (
    p_user_id,
    p_lead_flow_id,
    p_source_id,
    p_source_type,
    p_email,
    p_phone,
    p_fields,
    p_received_at,
    'new',
    null,
    v_follow_up_due_at,
    null,
    p_received_at + interval '168 hours'
  )
  returning id into v_lead_id;

  select destination.provider
  into v_destination_provider
  from public.lead_destinations as destination
  where destination.lead_flow_id = p_lead_flow_id
    and destination.user_id = p_user_id
    and destination.connected = true
    and destination.provider in ('sheets', 'airtable', 'excel', 'notion', 'hubspot');

  if v_destination_provider is not null then
    insert into public.lead_outbox (
      lead_id,
      action_key,
      provider,
      action_type
    ) values (
      v_lead_id,
      'destination:' || v_destination_provider,
      v_destination_provider,
      'destination_write'
    );
  end if;

  select settings.enabled, settings.channel, settings.message
  into v_reply_enabled, v_reply_channel, v_reply_message
  from public.lead_reply_settings as settings
  where settings.lead_flow_id = p_lead_flow_id
    and settings.user_id = p_user_id;

  if coalesce(v_reply_enabled, false)
    and v_reply_channel = 'email'
    and p_email is not null
    and nullif(btrim(v_reply_message), '') is not null
  then
    insert into public.lead_outbox (
      lead_id,
      action_key,
      provider,
      action_type
    ) values (
      v_lead_id,
      'automatic_gmail_reply',
      'gmail',
      'automatic_reply'
    );
  end if;

  select exists (
    select 1
    from public.lead_flows as flow
    join public.notification_emails as notification_email
      on notification_email.id = flow.notification_email_id
     and notification_email.user_id = p_user_id
    where flow.id = p_lead_flow_id
      and flow.user_id = p_user_id
      and nullif(btrim(notification_email.email), '') is not null
  )
  into v_notification_enabled;

  if v_notification_enabled then
    insert into public.lead_outbox (
      lead_id,
      action_key,
      provider,
      action_type
    ) values (
      v_lead_id,
      'team_notification',
      'resend',
      'team_notification'
    );
  end if;

  return v_lead_id;
end;
$$;

revoke all on function public.create_lead_with_outbox(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz
) from public, anon, authenticated;
grant execute on function public.create_lead_with_outbox(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz
) to service_role;
