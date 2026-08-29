import { NextResponse } from "next/server";

import {
  MICROSOFT_GRAPH_URL,
  MICROSOFT_PROVIDER,
  MICROSOFT_TOKEN_URL,
  getMicrosoftOAuthConfig,
} from "@/lib/integrations/microsoft";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MicrosoftTokenResponse = {
  token_type?: string;
  scope?: string;
  expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
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
      "microsoft",
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
        "user_id, lead_flow_id, expires_at, code_verifier"
      )
      .eq(
        "state",
        state
      )
      .eq(
        "provider",
        MICROSOFT_PROVIDER
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
      "microsoft",
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
      getMicrosoftOAuthConfig();

    const tokenResponse =
      await fetch(
        MICROSOFT_TOKEN_URL,
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body:
            new URLSearchParams({
              client_id:
                clientId,
              client_secret:
                clientSecret,
              grant_type:
                "authorization_code",
              code,
              redirect_uri:
                redirectUri,
              code_verifier:
                oauthState.code_verifier,
            }),
          cache:
            "no-store",
        }
      );

    const tokenData =
      await tokenResponse.json() as
        MicrosoftTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      throw new Error(
        tokenData.error_description ||
        tokenData.error ||
        "Microsoft did not return an access token."
      );
    }

    const profileResponse =
      await fetch(
        `${MICROSOFT_GRAPH_URL}/me?$select=id,displayName,mail,userPrincipalName`,
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },
          cache:
            "no-store",
        }
      );

    const profile =
      profileResponse.ok
        ? await profileResponse.json() as {
            id?: string;
            displayName?: string;
            mail?: string;
            userPrincipalName?: string;
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

    const credentials = {
      access_token:
        tokenData.access_token,
      refresh_token:
        tokenData.refresh_token ||
        null,
      token_type:
        tokenData.token_type ||
        "Bearer",
      scope:
        tokenData.scope ||
        null,
      expires_in:
        tokenData.expires_in ||
        null,
      expires_at:
        expiresAt,
      microsoft_user_id:
        profile?.id ||
        null,
      display_name:
        profile?.displayName ||
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
              MICROSOFT_PROVIDER,
            provider_account_email:
              profile?.mail ||
              profile?.userPrincipalName ||
              null,
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
      "microsoft",
      "connected"
    );

    return NextResponse.redirect(
      manageUrl
    );
  } catch (error) {
    console.error(
      "Flowex Microsoft callback error:",
      error
    );

    manageUrl.searchParams.set(
      "microsoft",
      "error"
    );

    return NextResponse.redirect(
      manageUrl
    );
  }
}
