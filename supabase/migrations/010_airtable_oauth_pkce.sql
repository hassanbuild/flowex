-- Airtable OAuth requires PKCE. Store the short-lived verifier with the OAuth state.
alter table public.oauth_states
add column if not exists code_verifier text;
