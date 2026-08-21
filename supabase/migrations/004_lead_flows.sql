create table if not exists public.lead_flows (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null
    default 'Lead Flow',

  slot smallint not null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint lead_flows_slot_check
    check (slot between 1 and 3),

  constraint lead_flows_user_slot_unique
    unique (user_id, slot),

  constraint lead_flows_name_length
    check (
      char_length(trim(name))
      between 1 and 50
    )
);


alter table public.lead_flows
enable row level security;


create policy "Users can view their own lead flows"
on public.lead_flows
for select
using (
  auth.uid() = user_id
);


create policy "Users can create their own lead flows"
on public.lead_flows
for insert
with check (
  auth.uid() = user_id
);


create policy "Users can update their own lead flows"
on public.lead_flows
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy "Users can delete their own lead flows"
on public.lead_flows
for delete
using (
  auth.uid() = user_id
);


alter table public.lead_sources
add column if not exists lead_flow_id uuid
references public.lead_flows(id)
on delete cascade;


create index if not exists
lead_flows_user_id_idx
on public.lead_flows(user_id);


create index if not exists
lead_sources_lead_flow_id_idx
on public.lead_sources(lead_flow_id);