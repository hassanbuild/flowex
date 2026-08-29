import crypto from "crypto";

export const MICROSOFT_PROVIDER =
  "microsoft_excel";

export const MICROSOFT_AUTHORIZE_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

export const MICROSOFT_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export const MICROSOFT_GRAPH_URL =
  "https://graph.microsoft.com/v1.0";

export const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Files.ReadWrite",
];

export function getMicrosoftOAuthConfig() {
  const clientId =
    process.env.MICROSOFT_CLIENT_ID?.trim() || "";

  const clientSecret =
    process.env.MICROSOFT_CLIENT_SECRET?.trim() || "";

  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI?.trim() || "";

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "MICROSOFT_OAUTH_NOT_CONFIGURED"
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

function toBase64Url(
  value: Buffer
) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createMicrosoftPkce() {
  const codeVerifier =
    toBase64Url(
      crypto.randomBytes(48)
    );

  const codeChallenge =
    toBase64Url(
      crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest()
    );

  return {
    codeVerifier,
    codeChallenge,
  };
}
