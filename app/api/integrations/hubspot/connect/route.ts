import * as crypto from "crypto";
import { NextResponse } from "next/server";

import {
  HUBSPOT_AUTHORIZE_URL,
  HUBSPOT_PROVIDER,
  HUBSPOT_SCOPES,
  getHubSpotOAuthConfig,
} from "@/lib/integrations/hubspot";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function authenticatedUser(
  request: Request
) {
  const authorization =
    request.headers.get("authorization") || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const token =
    authorization.slice(7).trim();

  if (!token) {
    return null;
  }

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(token);

  if (
    error ||
    !user
  ) {
    return null;
  }

  return {
    user,
    supabase,
  };
}

export async function GET(
  request: Request
) {
  const auth =
    await authenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      {
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const {
    data: connection,
  } =
    await auth.supabase
      .from("integration_connections")
      .select("credentials")
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        HUBSPOT_PROVIDER
      )
      .maybeSingle();

  const credentials =
    connection?.credentials &&
    typeof connection.credentials ===
      "object"
      ? (
          connection.credentials as
            Record<
              string,
              unknown
            >
        )
      : null;

  return NextResponse.json({
    connected:
      !!credentials &&
      typeof credentials.refresh_token ===
        "string" &&
      !!credentials.refresh_token,

    hubId:
      typeof credentials?.hub_id ===
        "number" ||
      typeof credentials?.hub_id ===
        "string"
        ? String(
            credentials.hub_id
          )
        : "",
  });
}

export async function POST(
  request: Request
) {
  const auth =
    await authenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      {
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  let body: {
    leadFlowId?: unknown;
  };

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  const leadFlowId =
    typeof body.leadFlowId ===
      "string"
      ? body.leadFlowId.trim()
      : "";

  if (!leadFlowId) {
    return NextResponse.json(
      {
        error:
          "Select a Lead Flow first.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: flow,
  } =
    await auth.supabase
      .from("lead_flows")
      .select("id")
      .eq(
        "id",
        leadFlowId
      )
      .eq(
        "user_id",
        auth.user.id
      )
      .maybeSingle();

  if (!flow) {
    return NextResponse.json(
      {
        error:
          "The selected Lead Flow could not be verified.",
      },
      {
        status: 404,
      }
    );
  }

  let config:
    ReturnType<
      typeof getHubSpotOAuthConfig
    >;

  try {
    config =
      getHubSpotOAuthConfig();
  } catch {
    return NextResponse.json(
      {
        error:
          "HubSpot connection is not configured yet.",
      },
      {
        status: 500,
      }
    );
  }

  const state =
    crypto
      .randomBytes(32)
      .toString("hex");

  const {
    error:
      stateError,
  } =
    await auth.supabase
      .from("oauth_states")
      .insert({
        state,
        user_id:
          auth.user.id,
        lead_flow_id:
          leadFlowId,
        provider:
          HUBSPOT_PROVIDER,
        expires_at:
          new Date(
            Date.now() +
              10 *
                60 *
                1000
          ).toISOString(),
      });

  if (stateError) {
    return NextResponse.json(
      {
        error:
          "Flowex could not start HubSpot authorization.",
      },
      {
        status: 500,
      }
    );
  }

  const authorizeUrl =
    new URL(
      HUBSPOT_AUTHORIZE_URL
    );

  authorizeUrl.searchParams.set(
    "client_id",
    config.clientId
  );

  authorizeUrl.searchParams.set(
    "scope",
    HUBSPOT_SCOPES.join(" ")
  );

  authorizeUrl.searchParams.set(
    "redirect_uri",
    config.redirectUri
  );

  authorizeUrl.searchParams.set(
    "state",
    state
  );

  return NextResponse.json({
    url:
      authorizeUrl.toString(),
  });
}
