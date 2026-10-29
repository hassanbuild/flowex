alter table public.subscriptions
  add column if not exists subscription_started_at timestamptz;

comment on column public.subscriptions.subscription_started_at is
  'Original Lemon Squeezy subscription creation timestamp; the anchor for monthly Flowex lead usage periods.';

do $$
declare
  existing_function record;
begin
  for existing_function in
    select p.oid::regprocedure as signature
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'apply_lemon_squeezy_subscription_webhook'
      and p.prokind = 'f'
  loop
    execute format('drop function %s', existing_function.signature);
  end loop;
end;
$$;

create or replace function public.apply_lemon_squeezy_subscription_webhook(
  p_delivery_hash text,
  p_event_name text,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_variant_id text,
  p_status text,
  p_billing_interval text,
  p_trial_ends_at timestamptz,
  p_current_period_ends_at timestamptz,
  p_cancel_at_period_end boolean,
  p_plan text,
  p_provider_updated_at timestamptz,
  p_subscription_started_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  stored_updated_at timestamptz;
begin
  insert into public.lemon_squeezy_webhook_deliveries (
    delivery_hash,
    event_name,
    subscription_id,
    provider_updated_at
  )
  values (
    p_delivery_hash,
    p_event_name,
    p_subscription_id,
    p_provider_updated_at
  )
  on conflict (delivery_hash) do nothing;

  if not found then
    return 'duplicate';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select lemon_squeezy_updated_at
  into stored_updated_at
  from public.subscriptions
  where user_id = p_user_id
  limit 1;

  if found and (
    stored_updated_at is not null
    and p_provider_updated_at <= stored_updated_at
  ) then
    return 'stale';
  end if;

  if found then
    update public.subscriptions
    set
      plan = p_plan,
      lemon_squeezy_customer_id = p_customer_id,
      lemon_squeezy_subscription_id = p_subscription_id,
      lemon_squeezy_variant_id = p_variant_id,
      lemon_squeezy_status = p_status,
      billing_interval = p_billing_interval,
      trial_ends_at = p_trial_ends_at,
      current_period_ends_at = p_current_period_ends_at,
      cancel_at_period_end = p_cancel_at_period_end,
      lemon_squeezy_updated_at = p_provider_updated_at,
      subscription_started_at = coalesce(
        subscription_started_at,
        p_subscription_started_at
      ),
      updated_at = now()
    where user_id = p_user_id;
  else
    insert into public.subscriptions (
      user_id,
      plan,
      lemon_squeezy_customer_id,
      lemon_squeezy_subscription_id,
      lemon_squeezy_variant_id,
      lemon_squeezy_status,
      billing_interval,
      trial_ends_at,
      current_period_ends_at,
      cancel_at_period_end,
      lemon_squeezy_updated_at,
      subscription_started_at,
      updated_at
    )
    values (
      p_user_id,
      p_plan,
      p_customer_id,
      p_subscription_id,
      p_variant_id,
      p_status,
      p_billing_interval,
      p_trial_ends_at,
      p_current_period_ends_at,
      p_cancel_at_period_end,
      p_provider_updated_at,
      p_subscription_started_at,
      now()
    );
  end if;

  return 'applied';
end;
$$;

revoke all on function public.apply_lemon_squeezy_subscription_webhook(
  text, text, uuid, text, text, text, text, text, timestamptz,
  timestamptz, boolean, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_lemon_squeezy_subscription_webhook(
  text, text, uuid, text, text, text, text, text, timestamptz,
  timestamptz, boolean, text, timestamptz
) to service_role;

create table public.account_lead_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_period_start timestamptz not null,
  usage_period_end timestamptz not null,
  leads_used integer not null check (leads_used between 1 and 3000),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_period_start),
  constraint account_lead_usage_period_check
    check (usage_period_end > usage_period_start)
);

comment on table public.account_lead_usage is
  'Durable account-wide lead usage keyed by subscription-anchored monthly period; independent of lead retention and outbox processing.';

alter table public.account_lead_usage enable row level security;
revoke all on public.account_lead_usage from public, anon, authenticated;
grant all on public.account_lead_usage to service_role;

create or replace function public.subscription_usage_period(
  p_anchor timestamptz,
  p_at timestamptz
)
returns table (period_start timestamptz, period_end timestamptz)
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_anchor_utc timestamp without time zone := p_anchor at time zone 'UTC';
  v_at_utc timestamp without time zone := p_at at time zone 'UTC';
  v_month_offset integer;
  v_month_start timestamp without time zone;
  v_start_utc timestamp without time zone;
  v_end_month timestamp without time zone;
  v_end_utc timestamp without time zone;
  v_day integer;
begin
  -- Boundaries use the anchor's UTC day/time; short months clamp to month-end,
  -- and later periods return to the original anchor day.
  v_month_offset :=
    (extract(year from v_at_utc)::integer - extract(year from v_anchor_utc)::integer) * 12
    + extract(month from v_at_utc)::integer
    - extract(month from v_anchor_utc)::integer;

  v_month_start := date_trunc('month', v_anchor_utc)
    + make_interval(months => v_month_offset);
  v_day := least(
    extract(day from v_anchor_utc)::integer,
    extract(day from (date_trunc('month', v_month_start + interval '1 month') - interval '1 day'))::integer
  );
  v_start_utc := v_month_start + make_interval(days => v_day - 1) + v_anchor_utc::time;

  if p_at < p_anchor then
    v_month_offset := 0;
    v_start_utc := v_anchor_utc;
  elsif v_start_utc > v_at_utc then
    v_month_offset := v_month_offset - 1;
    v_month_start := date_trunc('month', v_anchor_utc)
      + make_interval(months => v_month_offset);
    v_day := least(
      extract(day from v_anchor_utc)::integer,
      extract(day from (date_trunc('month', v_month_start + interval '1 month') - interval '1 day'))::integer
    );
    v_start_utc := v_month_start + make_interval(days => v_day - 1) + v_anchor_utc::time;
  end if;

  v_end_month := date_trunc('month', v_anchor_utc)
    + make_interval(months => v_month_offset + 1);
  v_day := least(
    extract(day from v_anchor_utc)::integer,
    extract(day from (date_trunc('month', v_end_month + interval '1 month') - interval '1 day'))::integer
  );
  v_end_utc := v_end_month + make_interval(days => v_day - 1) + v_anchor_utc::time;

  return query
    select v_start_utc at time zone 'UTC', v_end_utc at time zone 'UTC';
end;
$$;

revoke all on function public.subscription_usage_period(timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.subscription_usage_period(timestamptz, timestamptz)
  to service_role;

create or replace function public.enforce_account_monthly_lead_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_plan text;
  v_subscription_started_at timestamptz;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  select subscription.plan, subscription.subscription_started_at
  into v_plan, v_subscription_started_at
  from public.subscriptions subscription
  where subscription.user_id = new.user_id
  limit 1
  for share;

  if not found or v_plan is null or v_plan not in ('trial', 'pro') then
    raise exception using
      errcode = 'P1003',
      message = 'lead_capture_access_unavailable';
  end if;

  if v_subscription_started_at is null then
    raise exception using
      errcode = 'P1002',
      message = 'subscription_start_missing';
  end if;

  select usage_period.period_start, usage_period.period_end
  into v_period_start, v_period_end
  from public.subscription_usage_period(
    v_subscription_started_at,
    statement_timestamp()
  ) usage_period;

  insert into public.account_lead_usage (
    user_id,
    usage_period_start,
    usage_period_end,
    leads_used
  ) values (
    new.user_id,
    v_period_start,
    v_period_end,
    1
  )
  on conflict (user_id, usage_period_start) do update
    set leads_used = public.account_lead_usage.leads_used + 1,
        updated_at = statement_timestamp()
    where public.account_lead_usage.leads_used < 3000;

  if not found then
    raise exception using
      errcode = 'P1001',
      message = 'account_monthly_lead_limit_reached';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_account_monthly_lead_limit()
  from public, anon, authenticated;
grant execute on function public.enforce_account_monthly_lead_limit()
  to service_role;

create trigger enforce_account_monthly_lead_limit_before_insert
before insert on public.leads
for each row
execute function public.enforce_account_monthly_lead_limit();

notify pgrst, 'reload schema';
