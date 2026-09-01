import { NextResponse } from "next/server";

import {
  HUBSPOT_PROVIDER,
  HUBSPOT_TOKEN_URL,
  getHubSpotOAuthConfig,
} from "@/lib/integrations/hubspot";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type HubSpotTokenResponse = {
  token_type?: string;
  refresh_token?: string;
  access_token?: string;
  hub_id?: number;
  scopes?: string[];
  expires_in?: number;
  error?: string;
  error_description?: string;
  message?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const fallback = new URL("/lead-capture/dashboard", request.url);

  if (oauthError || !code || !state) {
    fallback.searchParams.set("hubspot", "cancelled");
    return NextResponse.redirect(fallback);
  }

  const supabase = createAdminClient();

  const { data: oauthState } = await supabase
    .from("oauth_states")
    .select("user_id, lead_flow_id, expires_at")
    .eq("state", state)
    .eq("provider", HUBSPOT_PROVIDER)
    .maybeSingle();

  if (
    !oauthState ||
    new Date(oauthState.expires_at).getTime() < Date.now()
  ) {
    fallback.searchParams.set("hubspot", "invalid_state");
    return NextResponse.redirect(fallback);
  }

  await supabase.from("oauth_states").delete().eq("state", state);

  const manageUrl = new URL("/lead-capture/manage", request.url);
  manageUrl.searchParams.set("flowId", oauthState.lead_flow_id);

  try {
    const { clientId, clientSecret, redirectUri } =
      getHubSpotOAuthConfig();

    const tokenResponse = await fetch(HUBSPOT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    const tokenData = (await tokenResponse.json()) as HubSpotTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description ||
          tokenData.message ||
          tokenData.error ||
          "HubSpot did not return an access token."
      );
    }

    const expiresAt =
      typeof tokenData.expires_in === "number"
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

    const storedCredentials = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || "bearer",
      hub_id: tokenData.hub_id || null,
      scopes: tokenData.scopes || [],
      expires_in: tokenData.expires_in || null,
      expires_at: expiresAt,
    };

    const { error: connectionError } = await supabase
      .from("integration_connections")
      .upsert(
        {
          user_id: oauthState.user_id,
          lead_flow_id: null,
          provider: HUBSPOT_PROVIDER,
          provider_account_email: null,
          credentials: storedCredentials,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (connectionError) {
      throw new Error(connectionError.message);
    }

    manageUrl.searchParams.set("hubspot", "connected");
    return NextResponse.redirect(manageUrl);
  } catch (error) {
    console.error("Flowex HubSpot callback error:", error);
    manageUrl.searchParams.set("hubspot", "error");
    return NextResponse.redirect(manageUrl);
  }
}
