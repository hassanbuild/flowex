export const HUBSPOT_PROVIDER = "hubspot";

export const HUBSPOT_AUTHORIZE_URL =
  "https://app.hubspot.com/oauth/authorize";

export const HUBSPOT_TOKEN_URL =
  "https://api.hubapi.com/oauth/2026-03/token";

export const HUBSPOT_API_URL =
  "https://api.hubapi.com";

export const HUBSPOT_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.schemas.contacts.read",
  "crm.schemas.contacts.write",
];

export function getHubSpotOAuthConfig() {
  const clientId =
    process.env.HUBSPOT_CLIENT_ID?.trim() || "";

  const clientSecret =
    process.env.HUBSPOT_CLIENT_SECRET?.trim() || "";

  const redirectUri =
    process.env.HUBSPOT_REDIRECT_URI?.trim() || "";

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("HUBSPOT_OAUTH_NOT_CONFIGURED");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function hubSpotPropertyName(key: string) {
  const safe = key
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70);

  return `flowex_${safe || "field"}`;
}
