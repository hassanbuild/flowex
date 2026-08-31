import { NextResponse } from "next/server";

import {
  NOTION_API_URL,
  NOTION_PROVIDER,
  NOTION_TOKEN_URL,
  NOTION_VERSION,
  getNotionOAuthConfig,
} from "@/lib/integrations/notion";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type NotionTokenResponse = {
  access_token?: string;
  token_type?: string;
  bot_id?: string;
  workspace_id?: string;
  workspace_name?: string;
  workspace_icon?: string | null;
  owner?: {
    type?: string;
    user?: {
      id?: string;
      name?: string;
      avatar_url?: string | null;
      person?: {
        email?: string;
      };
    };
  };
  error?: string;
  message?: string;
};

export async function GET(
  request: Request
) {
  const url =
    new URL(
      request.url
    );

  const code =
    url.searchParams.get(
      "code"
    );

  const state =
    url.searchParams.get(
      "state"
    );

  const oauthError =
    url.searchParams.get(
      "error"
    );

  const fallback =
    new URL(
      "/lead-capture/dashboard",
      request.url
    );

  if (
    oauthError ||
    !code ||
    !state
  ) {
    fallback.searchParams.set(
      "notion",
      "cancelled"
    );

    return NextResponse.redirect(
      fallback
    );
  }

  const supabase =
    createAdminClient();

  const {
    data:
      oauthState,
  } =
    await supabase
      .from(
        "oauth_states"
      )
      .select(
        "user_id, lead_flow_id, expires_at"
      )
      .eq(
        "state",
        state
      )
      .eq(
        "provider",
        NOTION_PROVIDER
      )
      .maybeSingle();

  if (
    !oauthState ||
    new Date(
      oauthState.expires_at
    ).getTime() <
      Date.now()
  ) {
    fallback.searchParams.set(
      "notion",
      "invalid_state"
    );

    return NextResponse.redirect(
      fallback
    );
  }

  await supabase
    .from(
      "oauth_states"
    )
    .delete()
    .eq(
      "state",
      state
    );

  const manageUrl =
    new URL(
      "/lead-capture/manage",
      request.url
    );

  manageUrl.searchParams.set(
    "flowId",
    oauthState.lead_flow_id
  );

  try {
    const {
      clientId,
      clientSecret,
      redirectUri,
    } =
      getNotionOAuthConfig();

    const credentials =
      Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString(
        "base64"
      );

    const tokenResponse =
      await fetch(
        NOTION_TOKEN_URL,
        {
          method:
            "POST",
          headers: {
            Authorization:
              `Basic ${credentials}`,
            "Content-Type":
              "application/json",
            "Notion-Version":
              NOTION_VERSION,
          },
          body:
            JSON.stringify({
              grant_type:
                "authorization_code",
              code,
              redirect_uri:
                redirectUri,
            }),
          cache:
            "no-store",
        }
      );

    const tokenData =
      await tokenResponse.json() as
        NotionTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      throw new Error(
        tokenData.message ||
        tokenData.error ||
        "Notion did not return an access token."
      );
    }

    let userEmail:
      string | null =
      tokenData.owner
        ?.user
        ?.person
        ?.email ||
      null;

    if (!userEmail) {
      try {
        const meResponse =
          await fetch(
            `${NOTION_API_URL}/users/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${tokenData.access_token}`,
                "Notion-Version":
                  NOTION_VERSION,
              },
              cache:
                "no-store",
            }
          );

        if (
          meResponse.ok
        ) {
          const me =
            await meResponse.json() as {
              person?: {
                email?: string;
              };
            };

          userEmail =
            me.person?.email ||
            null;
        }
      } catch {
        userEmail =
          null;
      }
    }

    const storedCredentials = {
      access_token:
        tokenData.access_token,

      token_type:
        tokenData.token_type ||
        "bearer",

      bot_id:
        tokenData.bot_id ||
        null,

      workspace_id:
        tokenData.workspace_id ||
        null,

      workspace_name:
        tokenData.workspace_name ||
        null,

      workspace_icon:
        tokenData.workspace_icon ||
        null,

      owner:
        tokenData.owner ||
        null,
    };

    const {
      error:
        connectionError,
    } =
      await supabase
        .from(
          "integration_connections"
        )
        .upsert(
          {
            user_id:
              oauthState.user_id,

            lead_flow_id:
              null,

            provider:
              NOTION_PROVIDER,

            provider_account_email:
              userEmail,

            credentials:
              storedCredentials,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,provider",
          }
        );

    if (
      connectionError
    ) {
      throw new Error(
        connectionError.message
      );
    }

    manageUrl.searchParams.set(
      "notion",
      "connected"
    );

    return NextResponse.redirect(
      manageUrl
    );
  } catch (error) {
    console.error(
      "Flowex Notion callback error:",
      error
    );

    manageUrl.searchParams.set(
      "notion",
      "error"
    );

    return NextResponse.redirect(
      manageUrl
    );
  }
}