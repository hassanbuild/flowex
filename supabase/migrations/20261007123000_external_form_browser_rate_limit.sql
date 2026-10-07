create table if not exists public.external_form_browser_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, window_start)
);

create index if not exists external_form_browser_rate_limits_window_idx
  on public.external_form_browser_rate_limits(window_start);

alter table public.external_form_browser_rate_limits enable row level security;

create or replace function public.check_external_form_browser_limit(
  p_user_id uuid,
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
  if p_limit < 1 or p_user_id is null or p_window_start is null then
    return false;
  end if;

  -- Keep only recent buckets for active users without needing a separate
  -- cleanup scheduler.
  delete from public.external_form_browser_rate_limits
  where user_id = p_user_id
    and window_start < now() - interval '1 hour';

  insert into public.external_form_browser_rate_limits (
    user_id,
    window_start,
    request_count
  )
  values (
    p_user_id,
    p_window_start,
    1
  )
  on conflict (user_id, window_start)
  do update
    set request_count = external_form_browser_rate_limits.request_count + 1
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.check_external_form_browser_limit(
  uuid,
  timestamptz,
  integer
) from public, anon, authenticated;

grant execute on function public.check_external_form_browser_limit(
  uuid,
  timestamptz,
  integer
) to service_role;
