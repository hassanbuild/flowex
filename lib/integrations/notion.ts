export const NOTION_PROVIDER = "notion";

export const NOTION_AUTHORIZE_URL =
  "https://api.notion.com/v1/oauth/authorize";

export const NOTION_TOKEN_URL =
  "https://api.notion.com/v1/oauth/token";

export const NOTION_API_URL =
  "https://api.notion.com/v1";

export const NOTION_VERSION =
  "2022-06-28";

export function getNotionOAuthConfig() {
  const clientId =
    process.env.NOTION_CLIENT_ID?.trim() || "";

  const clientSecret =
    process.env.NOTION_CLIENT_SECRET?.trim() || "";

  const redirectUri =
    process.env.NOTION_REDIRECT_URI?.trim() || "";

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "NOTION_OAUTH_NOT_CONFIGURED"
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}