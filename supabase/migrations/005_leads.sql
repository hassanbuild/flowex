alter table public.leads
add column if not exists lead_flow_id uuid
references public.lead_flows(id)
on delete cascade;

alter table public.leads
add column if not exists source_id uuid
references public.lead_sources(id)
on delete cascade;

alter table public.leads
add column if not exists source_type text;

alter table public.leads
add column if not exists email text;

alter table public.leads
add column if not exists phone text;

alter table public.leads
add column if not exists fields jsonb
default '{}'::jsonb;

alter table public.leads
add column if not exists created_at timestamptz
default now();

create index if not exists
leads_lead_flow_id_idx
on public.leads(lead_flow_id);

create index if not exists
leads_source_id_idx
on public.leads(source_id);

create index if not exists
leads_created_at_idx
on public.leads(created_at desc);

alter table public.leads
enable row level security;

drop policy if exists
"Users can view their own leads"
on public.leads;

create policy
"Users can view their own leads"
on public.leads
for select
using (
  auth.uid() = user_id
);

drop policy if exists
"Users can delete their own leads"
on public.leads;

create policy
"Users can delete their own leads"
on public.leads
for delete
using (
  auth.uid() = user_id
);