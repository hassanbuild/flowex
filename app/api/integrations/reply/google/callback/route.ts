import { google } from "googleapis";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function createReplyEmailOAuthClient() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;

  const redirectUri =
    process.env.GOOGLE_REPLY_EMAIL_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "Google reply-email OAuth environment variables are missing."
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

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
      "replyEmail",
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
        "google_email"
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
      "replyEmail",
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
    const oauth2Client =
      createReplyEmailOAuthClient();

    const {
      tokens,
    } =
      await oauth2Client.getToken(
        code
      );

    oauth2Client.setCredentials(
      tokens
    );

    const oauth2 =
      google.oauth2({
        version:
          "v2",

        auth:
          oauth2Client,
      });

    const {
      data:
        profile,
    } =
      await oauth2.userinfo.get();

    if (
      !profile.email
    ) {
      throw new Error(
        "Google did not return an email address."
      );
    }

    const {
      data:
        previousConnection,
    } =
      await supabase
        .from(
          "integration_connections"
        )
        .select(
          "credentials"
        )
        .eq(
          "user_id",
          oauthState.user_id
        )
        .eq(
          "provider",
          "google_email"
        )
        .maybeSingle();

    const previous =
      previousConnection
        ?.credentials &&
      typeof previousConnection
        .credentials ===
        "object"
        ? previousConnection
            .credentials as Record<
              string,
              unknown
            >
        : {};

    const credentials = {
      ...previous,
      ...tokens,

      refresh_token:
        tokens.refresh_token ||
        previous.refresh_token,
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
              "google_email",

            provider_account_email:
              profile.email,

            credentials,

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
      "replyEmail",
      "connected"
    );

    return NextResponse.redirect(
      manageUrl
    );
  } catch (
    error
  ) {
    console.error(
      "Flowex reply email callback error:",
      error
    );

    manageUrl.searchParams.set(
      "replyEmail",
      "error"
    );

    return NextResponse.redirect(
      manageUrl
    );
  }
}