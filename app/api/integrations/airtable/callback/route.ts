import { NextResponse } from "next/server";

import {
  AIRTABLE_API_URL,
  AIRTABLE_PROVIDER,
  AIRTABLE_TOKEN_URL,
  getAirtableOAuthConfig,
} from "@/lib/integrations/airtable";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type AirtableTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
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
      "airtable",
      "cancelled"
    );

    return NextResponse.redirect(
      fallback
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: oauthState,
  } =
    await supabase
      .from(
        "oauth_states"
      )
      .select(
        "user_id, lead_flow_id, expires_at, code_verifier"
      )
      .eq(
        "state",
        state
      )
      .eq(
        "provider",
        AIRTABLE_PROVIDER
      )
      .maybeSingle();

  if (
    !oauthState ||
    !oauthState.code_verifier ||
    new Date(
      oauthState.expires_at
    ).getTime() <
      Date.now()
  ) {
    fallback.searchParams.set(
      "airtable",
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
    } = getAirtableOAuthConfig();

    const credentials =
      Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString(
        "base64"
      );

    const tokenResponse =
      await fetch(
        AIRTABLE_TOKEN_URL,
        {
          method: "POST",
          headers: {
            Authorization:
              `Basic ${credentials}`,
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body:
            new URLSearchParams({
              grant_type:
                "authorization_code",
              code,
              redirect_uri:
                redirectUri,
              code_verifier:
                oauthState.code_verifier,
            }),
          cache: "no-store",
        }
      );

    const tokenData =
      await tokenResponse.json() as
        AirtableTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      throw new Error(
        tokenData.error_description ||
        tokenData.error ||
        "Airtable did not return an access token."
      );
    }

    const whoAmIResponse =
      await fetch(
        `${AIRTABLE_API_URL}/meta/whoami`,
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },
          cache: "no-store",
        }
      );

    const whoAmI =
      whoAmIResponse.ok
        ? await whoAmIResponse.json() as {
            id?: string;
            email?: string;
            scopes?: string[];
          }
        : null;

    const expiresAt =
      typeof tokenData.expires_in ===
        "number"
        ? new Date(
            Date.now() +
              tokenData.expires_in *
                1000
          ).toISOString()
        : null;

    const storedCredentials = {
      access_token:
        tokenData.access_token,
      refresh_token:
        tokenData.refresh_token ||
        null,
      token_type:
        tokenData.token_type ||
        "Bearer",
      expires_in:
        tokenData.expires_in ||
        null,
      expires_at:
        expiresAt,
      scope:
        tokenData.scope ||
        null,
      airtable_user_id:
        whoAmI?.id ||
        null,
      scopes:
        whoAmI?.scopes ||
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
              AIRTABLE_PROVIDER,
            provider_account_email:
              whoAmI?.email ||
              null,
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

    if (connectionError) {
      throw new Error(
        connectionError.message
      );
    }

    manageUrl.searchParams.set(
      "airtable",
      "connected"
    );

    return NextResponse.redirect(
      manageUrl
    );
  } catch (error) {
    console.error(
      "Flowex Airtable callback error:",
      error
    );

    manageUrl.searchParams.set(
      "airtable",
      "error"
    );

    return NextResponse.redirect(
      manageUrl
    );
  }
}
