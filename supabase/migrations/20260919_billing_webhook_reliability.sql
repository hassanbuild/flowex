create table if not exists public.lemon_squeezy_webhook_deliveries (
  delivery_hash text primary key,
  event_name text not null,
  subscription_id text not null,
  provider_updated_at timestamptz not null,
  received_at timestamptz not null default now()
);

alter table public.lemon_squeezy_webhook_deliveries enable row level security;

alter table public.subscriptions
  add column if not exists lemon_squeezy_updated_at timestamptz;

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
  p_provider_updated_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public
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
