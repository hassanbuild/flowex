-- Lead Capture is a premium feature. The browser talks to Supabase directly
-- for these tables, so ownership-only policies must also require a current
-- premium subscription.
create or replace function public.has_premium_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = (select auth.uid())
      and plan in ('trial', 'pro')
  );
$$;

revoke all on function public.has_premium_access() from public;
grant execute on function public.has_premium_access() to authenticated;

-- Restrictive policies compose with the existing ownership policies instead
-- of replacing them. This preserves row ownership checks while ensuring an
-- authenticated Free user cannot bypass the client-side plan gate via the
-- Supabase REST API.
drop policy if exists "Premium access required for Lead Capture" on public.lead_flows;
create policy "Premium access required for Lead Capture"
on public.lead_flows
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));

drop policy if exists "Premium access required for Lead Capture" on public.lead_sources;
create policy "Premium access required for Lead Capture"
on public.lead_sources
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));

drop policy if exists "Premium access required for Lead Capture" on public.leads;
create policy "Premium access required for Lead Capture"
on public.leads
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));

drop policy if exists "Premium access required for Lead Capture" on public.lead_destinations;
create policy "Premium access required for Lead Capture"
on public.lead_destinations
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));

drop policy if exists "Premium access required for Lead Capture" on public.lead_reply_settings;
create policy "Premium access required for Lead Capture"
on public.lead_reply_settings
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));

drop policy if exists "Premium access required for Lead Capture" on public.lead_follow_up_settings;
create policy "Premium access required for Lead Capture"
on public.lead_follow_up_settings
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));

drop policy if exists "Premium access required for Lead Capture" on public.notification_emails;
create policy "Premium access required for Lead Capture"
on public.notification_emails
as restrictive
for all
to authenticated
using ((select public.has_premium_access()))
with check ((select public.has_premium_access()));
