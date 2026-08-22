


create table if not exists public.lead_destinations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  lead_flow_id uuid not null
    references public.lead_flows(id)
    on delete cascade,

  provider text not null,

  mode text not null
    default 'create_new'
    check (mode in ('create_new', 'existing')),

  display_name text not null
    default 'Flowex Leads',

  config jsonb not null
    default '{}'::jsonb,

  connected boolean not null
    default false,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint lead_destinations_flow_unique
    unique (lead_flow_id),

  constraint lead_destinations_name_length
    check (
      char_length(trim(display_name))
      between 1 and 80
    )
);

alter table public.lead_destinations
enable row level security;

create policy "Users can view their own lead destinations"
on public.lead_destinations
for select
using (
  auth.uid() = user_id
);

create policy "Users can create their own lead destinations"
on public.lead_destinations
for insert
with check (
  auth.uid() = user_id
);

create policy "Users can update their own lead destinations"
on public.lead_destinations
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users can delete their own lead destinations"
on public.lead_destinations
for delete
using (
  auth.uid() = user_id
);

create index if not exists
lead_destinations_user_id_idx
on public.lead_destinations(user_id);

create index if not exists
lead_destinations_lead_flow_id_idx
on public.lead_destinations(lead_flow_id);
