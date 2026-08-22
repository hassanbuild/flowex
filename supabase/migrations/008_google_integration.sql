create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_flow_id uuid not null references public.lead_flows(id) on delete cascade,
  provider text not null,
  provider_account_email text,
  credentials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_flow_id, provider)
);

alter table public.integration_connections enable row level security;

create index if not exists integration_connections_user_id_idx
on public.integration_connections(user_id);

create index if not exists integration_connections_flow_provider_idx
on public.integration_connections(lead_flow_id, provider);

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_flow_id uuid not null references public.lead_flows(id) on delete cascade,
  provider text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.oauth_states enable row level security;

create index if not exists oauth_states_expires_at_idx
on public.oauth_states(expires_at);