create table if not exists public.intake_rate_limits (
  source_id uuid not null
    references public.lead_sources(id)
    on delete cascade,
  client_ip text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (source_id, client_ip, window_start)
);

create index if not exists intake_rate_limits_window_start_idx
on public.intake_rate_limits(window_start);

alter table public.intake_rate_limits enable row level security;

create or replace function public.check_intake_rate_limit(
  p_source_id uuid,
  p_client_ip text,
  p_window_start timestamptz,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.intake_rate_limits (
    source_id,
    client_ip,
    window_start,
    request_count
  )
  values (
    p_source_id,
    p_client_ip,
    p_window_start,
    1
  )
  on conflict (source_id, client_ip, window_start)
  do update
    set request_count = intake_rate_limits.request_count + 1
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.check_intake_rate_limit(
  uuid,
  text,
  timestamptz,
  integer
) from public;

grant execute on function public.check_intake_rate_limit(
  uuid,
  text,
  timestamptz,
  integer
) to service_role;

create or replace function public.cleanup_intake_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.intake_rate_limits
  where window_start < now() - interval '1 hour';
$$;

revoke all on function public.cleanup_intake_rate_limits() from public;

grant execute on function public.cleanup_intake_rate_limits()
to service_role;