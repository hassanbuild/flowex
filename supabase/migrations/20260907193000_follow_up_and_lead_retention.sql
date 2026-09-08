-- Flowex Step 05 — safe additive migration
-- This migration does NOT rewrite or remove existing lead payloads.
-- Core intake remains compatible with the original leads schema.

alter table public.leads
  add column if not exists name text,
  add column if not exists status text not null default 'new',
  add column if not exists contacted_at timestamptz,
  add column if not exists follow_up_due_at timestamptz,
  add column if not exists follow_up_sent_at timestamptz,
  add column if not exists expires_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_status_check'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_status_check
      check (status in ('new', 'contacted', 'closed'));
  end if;
end
$$;

create index if not exists leads_user_created_at_idx
  on public.leads (user_id, created_at desc);

create index if not exists leads_follow_up_due_idx
  on public.leads (follow_up_due_at)
  where follow_up_due_at is not null
    and follow_up_sent_at is null
    and status = 'new';

create table if not exists public.lead_follow_up_settings (
  lead_flow_id uuid primary key
    references public.lead_flows(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  delay_hours integer not null default 24
    check (delay_hours in (1, 6, 12, 24)),
  message text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.lead_follow_up_settings enable row level security;

drop policy if exists "Users can view their follow up settings"
  on public.lead_follow_up_settings;
create policy "Users can view their follow up settings"
  on public.lead_follow_up_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their follow up settings"
  on public.lead_follow_up_settings;
create policy "Users can insert their follow up settings"
  on public.lead_follow_up_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their follow up settings"
  on public.lead_follow_up_settings;
create policy "Users can update their follow up settings"
  on public.lead_follow_up_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own leads"
  on public.leads;
create policy "Users can update their own leads"
  on public.leads
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
