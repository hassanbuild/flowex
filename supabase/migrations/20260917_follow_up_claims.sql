alter table public.leads
  add column if not exists follow_up_claim_token text,
  add column if not exists follow_up_claimed_at timestamptz,
  add column if not exists follow_up_gmail_message_id text;

create or replace function public.claim_due_follow_up(
  p_lead_id uuid,
  p_claim_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  update public.leads
  set
    follow_up_claim_token = p_claim_token,
    follow_up_claimed_at = now()
  where id = p_lead_id
    and status = 'new'
    and contacted_at is null
    and follow_up_sent_at is null
    and email is not null
    and follow_up_due_at is not null
    and follow_up_due_at <= now()
    and (
      follow_up_claimed_at is null
      or follow_up_claimed_at < now() - interval '15 minutes'
    )
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_due_follow_up(uuid, text) from public;
grant execute on function public.claim_due_follow_up(uuid, text) to service_role;
