-- Step 04: Notify Your Team
-- Account-level notification email pool + one selected recipient per Lead Flow.

create table if not exists public.notification_emails (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  email text not null,

  created_at timestamptz not null default now(),

  constraint notification_emails_user_email_unique
    unique (user_id, email)
);

create index if not exists notification_emails_user_id_idx
  on public.notification_emails(user_id);


-- Maximum 5 notification email addresses per Flowex account.
create or replace function public.enforce_notification_email_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.notification_emails
    where user_id = new.user_id
  ) >= 5 then
    raise exception 'A Flowex account can have a maximum of 5 notification emails.';
  end if;

  return new;
end;
$$;

drop trigger if exists notification_email_limit
  on public.notification_emails;

create trigger notification_email_limit
before insert on public.notification_emails
for each row
execute function public.enforce_notification_email_limit();


-- Each Lead Flow can select one account-level notification email.
alter table public.lead_flows
  add column if not exists notification_email_id uuid
  references public.notification_emails(id)
  on delete set null;


-- RLS
alter table public.notification_emails
  enable row level security;


drop policy if exists "Users can view their notification emails"
  on public.notification_emails;

create policy "Users can view their notification emails"
on public.notification_emails
for select
to authenticated
using (
  auth.uid() = user_id
);


drop policy if exists "Users can add their notification emails"
  on public.notification_emails;

create policy "Users can add their notification emails"
on public.notification_emails
for insert
to authenticated
with check (
  auth.uid() = user_id
);


drop policy if exists "Users can update their notification emails"
  on public.notification_emails;

create policy "Users can update their notification emails"
on public.notification_emails
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


drop policy if exists "Users can delete their notification emails"
  on public.notification_emails;

create policy "Users can delete their notification emails"
on public.notification_emails
for delete
to authenticated
using (
  auth.uid() = user_id
);