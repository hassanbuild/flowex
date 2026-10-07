create table if not exists public.lead_contact_action_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint lead_contact_action_token_expiry check (expires_at > created_at)
);

create index if not exists lead_contact_action_tokens_expiry_idx
  on public.lead_contact_action_tokens(expires_at);

alter table public.lead_contact_action_tokens enable row level security;
revoke all on public.lead_contact_action_tokens from public, anon, authenticated;
grant all on public.lead_contact_action_tokens to service_role;

create or replace function public.mark_lead_contacted_with_token(
  p_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  token_row public.lead_contact_action_tokens%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  select *
  into token_row
  from public.lead_contact_action_tokens
  where token_hash = p_token_hash
    and expires_at > now();

  if not found then
    return false;
  end if;

  update public.leads
  set
    status = case when status = 'closed' then status else 'contacted' end,
    contacted_at = coalesce(contacted_at, now()),
    follow_up_due_at = null,
    follow_up_claim_token = null,
    follow_up_claimed_at = null
  where id = token_row.lead_id
    and user_id = token_row.user_id;

  return found;
end;
$$;

revoke all on function public.mark_lead_contacted_with_token(text) from public, anon, authenticated;
grant execute on function public.mark_lead_contacted_with_token(text) to service_role;
