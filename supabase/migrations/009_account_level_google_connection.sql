-- Google authorization belongs to the Flowex account, not to an individual Lead Flow.

alter table public.integration_connections
alter column lead_flow_id drop not null;

alter table public.integration_connections
drop constraint if exists integration_connections_lead_flow_id_provider_key;

alter table public.integration_connections
drop constraint if exists integration_connections_flow_provider_unique;

-- Keep only the newest Google connection per user before moving it to account scope.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, provider
      order by updated_at desc nulls last, created_at desc, id desc
    ) as rn
  from public.integration_connections
)
delete from public.integration_connections
where id in (
  select id
  from ranked
  where rn > 1
);

update public.integration_connections
set lead_flow_id = null
where provider = 'google_sheets';

create unique index if not exists
integration_connections_user_provider_unique
on public.integration_connections(user_id, provider);