alter table public.lead_sources
add column if not exists verified boolean not null default false;

alter table public.lead_sources
add column if not exists detected_fields jsonb not null default '[]'::jsonb;

alter table public.lead_sources
add column if not exists last_test_payload jsonb;