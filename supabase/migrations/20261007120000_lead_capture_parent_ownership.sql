-- Keep user-owned Lead Capture rows attached only to parent rows owned by
-- the same authenticated user. The SECURITY DEFINER helpers bypass the
-- parent's RLS while checking ownership, and bind every check to auth.uid().
create or replace function public.lead_capture_user_owns_flow(
  p_user_id uuid,
  p_lead_flow_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p_user_id = auth.uid()
    and exists (
      select 1
      from public.lead_flows as flow
      where flow.id = p_lead_flow_id
        and flow.user_id = p_user_id
    );
$$;

create or replace function public.lead_capture_user_owns_source(
  p_user_id uuid,
  p_source_id uuid,
  p_lead_flow_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p_user_id = auth.uid()
    and exists (
      select 1
      from public.lead_sources as source
      where source.id = p_source_id
        and source.user_id = p_user_id
        and (
          source.lead_flow_id is null
          or source.lead_flow_id = p_lead_flow_id
        )
    );
$$;

create or replace function public.lead_capture_user_owns_notification_email(
  p_user_id uuid,
  p_notification_email_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p_user_id = auth.uid()
    and exists (
      select 1
      from public.notification_emails as notification_email
      where notification_email.id = p_notification_email_id
        and notification_email.user_id = p_user_id
    );
$$;

revoke all on function public.lead_capture_user_owns_flow(uuid, uuid) from public, anon;
revoke all on function public.lead_capture_user_owns_source(uuid, uuid, uuid) from public, anon;
revoke all on function public.lead_capture_user_owns_notification_email(uuid, uuid) from public, anon;
grant execute on function public.lead_capture_user_owns_flow(uuid, uuid) to authenticated;
grant execute on function public.lead_capture_user_owns_source(uuid, uuid, uuid) to authenticated;
grant execute on function public.lead_capture_user_owns_notification_email(uuid, uuid) to authenticated;

drop policy if exists "Lead Capture rows require same-owner parent flow" on public.lead_sources;
create policy "Lead Capture rows require same-owner parent flow"
on public.lead_sources
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and (
    lead_flow_id is null
    or public.lead_capture_user_owns_flow(user_id, lead_flow_id)
  )
)
with check (
  auth.uid() = user_id
  and (
    lead_flow_id is null
    or public.lead_capture_user_owns_flow(user_id, lead_flow_id)
  )
);

drop policy if exists "Lead Capture rows require same-owner parent flow" on public.lead_destinations;
create policy "Lead Capture rows require same-owner parent flow"
on public.lead_destinations
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
)
with check (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
);

drop policy if exists "Lead Capture rows require same-owner parent flow" on public.lead_reply_settings;
create policy "Lead Capture rows require same-owner parent flow"
on public.lead_reply_settings
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
)
with check (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
);

drop policy if exists "Lead Capture rows require same-owner parent flow" on public.lead_follow_up_settings;
create policy "Lead Capture rows require same-owner parent flow"
on public.lead_follow_up_settings
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
)
with check (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
);

drop policy if exists "Lead Capture rows require same-owner parent flow" on public.integration_connections;
create policy "Lead Capture rows require same-owner parent flow"
on public.integration_connections
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and (
    lead_flow_id is null
    or public.lead_capture_user_owns_flow(user_id, lead_flow_id)
  )
)
with check (
  auth.uid() = user_id
  and (
    lead_flow_id is null
    or public.lead_capture_user_owns_flow(user_id, lead_flow_id)
  )
);

drop policy if exists "Lead Capture rows require same-owner parent flow" on public.leads;
create policy "Lead Capture rows require same-owner parent flow"
on public.leads
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and (
    lead_flow_id is null
    or public.lead_capture_user_owns_flow(user_id, lead_flow_id)
  )
  and (
    source_id is null
    or public.lead_capture_user_owns_source(user_id, source_id, lead_flow_id)
  )
)
with check (
  auth.uid() = user_id
  and (
    lead_flow_id is null
    or public.lead_capture_user_owns_flow(user_id, lead_flow_id)
  )
  and (
    source_id is null
    or public.lead_capture_user_owns_source(user_id, source_id, lead_flow_id)
  )
);

drop policy if exists "Lead Flows require same-owner notification email" on public.lead_flows;
create policy "Lead Flows require same-owner notification email"
on public.lead_flows
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and (
    notification_email_id is null
    or public.lead_capture_user_owns_notification_email(user_id, notification_email_id)
  )
)
with check (
  auth.uid() = user_id
  and (
    notification_email_id is null
    or public.lead_capture_user_owns_notification_email(user_id, notification_email_id)
  )
);

drop policy if exists "OAuth connections require same-owner parent flow" on public.oauth_states;
create policy "OAuth connections require same-owner parent flow"
on public.oauth_states
as restrictive
for all
to authenticated
using (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
)
with check (
  auth.uid() = user_id
  and public.lead_capture_user_owns_flow(user_id, lead_flow_id)
);
