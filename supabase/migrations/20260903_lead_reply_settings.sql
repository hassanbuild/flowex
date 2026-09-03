create table if not exists public.lead_reply_settings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  lead_flow_id uuid not null
    references public.lead_flows(id)
    on delete cascade,

  channel text not null
    check (
      channel in (
        'email',
        'whatsapp'
      )
    ),

  template text not null
    default 'preset_1',

  subject text not null
    default '',

  message text not null
    default '',

  enabled boolean not null
    default true,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (lead_flow_id)
);

create index if not exists
  lead_reply_settings_user_id_idx
on public.lead_reply_settings(user_id);

alter table
  public.lead_reply_settings
enable row level security;

drop policy if exists
  "Users can view own lead reply settings"
on public.lead_reply_settings;

create policy
  "Users can view own lead reply settings"
on public.lead_reply_settings
for select
using (
  auth.uid() = user_id
);

drop policy if exists
  "Users can insert own lead reply settings"
on public.lead_reply_settings;

create policy
  "Users can insert own lead reply settings"
on public.lead_reply_settings
for insert
with check (
  auth.uid() = user_id
);

drop policy if exists
  "Users can update own lead reply settings"
on public.lead_reply_settings;

create policy
  "Users can update own lead reply settings"
on public.lead_reply_settings
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

drop policy if exists
  "Users can delete own lead reply settings"
on public.lead_reply_settings;

create policy
  "Users can delete own lead reply settings"
on public.lead_reply_settings
for delete
using (
  auth.uid() = user_id
);