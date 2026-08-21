alter table public.lead_flows
add column if not exists active boolean not null default true;

create index if not exists
lead_flows_user_active_idx
on public.lead_flows(user_id, active);