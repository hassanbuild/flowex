import * as crypto from "crypto";

export const AIRTABLE_PROVIDER = "airtable";

export const AIRTABLE_SCOPES = [
  "data.records:read",
  "data.records:write",
  "schema.bases:read",
  "schema.bases:write",
  "user.email:read",
];

export const AIRTABLE_AUTHORIZE_URL =
  "https://airtable.com/oauth2/v1/authorize";

export const AIRTABLE_TOKEN_URL =
  "https://airtable.com/oauth2/v1/token";

export const AIRTABLE_API_URL =
  "https://api.airtable.com/v0";

export function getAirtableOAuthConfig() {
  const clientId =
    process.env.AIRTABLE_CLIENT_ID?.trim() || "";

  const clientSecret =
    process.env.AIRTABLE_CLIENT_SECRET?.trim() || "";

  const redirectUri =
    process.env.AIRTABLE_REDIRECT_URI?.trim() || "";

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "Airtable OAuth is not configured."
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function createAirtablePkce() {
  const codeVerifier =
    crypto.randomBytes(48).toString("base64url");

  const codeChallenge =
    crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
  };
}

export function createAirtableAuthorizationUrl(
  state: string,
  codeChallenge: string
) {
  const {
    clientId,
    redirectUri,
  } = getAirtableOAuthConfig();

  const url =
    new URL(AIRTABLE_AUTHORIZE_URL);

  url.searchParams.set(
    "client_id",
    clientId
  );

  url.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  url.searchParams.set(
    "response_type",
    "code"
  );

  url.searchParams.set(
    "scope",
    AIRTABLE_SCOPES.join(" ")
  );

  url.searchParams.set(
    "state",
    state
  );

  url.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  url.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  return url.toString();
}
