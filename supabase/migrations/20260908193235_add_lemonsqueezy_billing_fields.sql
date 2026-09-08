alter table public.subscriptions
  add column if not exists lemon_squeezy_customer_id text,
  add column if not exists lemon_squeezy_subscription_id text,
  add column if not exists lemon_squeezy_variant_id text,
  add column if not exists lemon_squeezy_status text,
  add column if not exists billing_interval text,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_ends_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists subscriptions_lemon_squeezy_subscription_id_idx
  on public.subscriptions (lemon_squeezy_subscription_id)
  where lemon_squeezy_subscription_id is not null;

create index if not exists subscriptions_lemon_squeezy_customer_id_idx
  on public.subscriptions (lemon_squeezy_customer_id)
  where lemon_squeezy_customer_id is not null;

create index if not exists subscriptions_lemon_squeezy_status_idx
  on public.subscriptions (lemon_squeezy_status);