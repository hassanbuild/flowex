import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  NOTION_AUTHORIZE_URL,
  NOTION_PROVIDER,
  getNotionOAuthConfig,
} from "@/lib/integrations/notion";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function getAuthenticatedUser(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

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
    await supabase.auth.getUser(
      token
    );

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
    await getAuthenticatedUser(
      request
    );

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
      .from(
        "integration_connections"
      )
      .select(
        "provider_account_email, credentials"
      )
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        NOTION_PROVIDER
      )
      .maybeSingle();

  const credentials =
    connection?.credentials &&
    typeof connection.credentials ===
      "object"
      ? connection.credentials as Record<
          string,
          unknown
        >
      : null;

  return NextResponse.json({
    connected:
      typeof credentials?.access_token ===
        "string" &&
      credentials.access_token.length >
        0,
    email:
      connection
        ?.provider_account_email ||
      null,
    workspaceName:
      typeof credentials?.workspace_name ===
        "string"
        ? credentials.workspace_name
        : null,
  });
}

export async function POST(
  request: Request
) {
  const auth =
    await getAuthenticatedUser(
      request
    );

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
      typeof getNotionOAuthConfig
    >;

  try {
    config =
      getNotionOAuthConfig();
  } catch {
    return NextResponse.json(
      {
        error:
          "Notion connection is not configured yet.",
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
          NOTION_PROVIDER,
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
          "Flowex could not start Notion authorization.",
      },
      {
        status: 500,
      }
    );
  }

  const authorizeUrl =
    new URL(
      NOTION_AUTHORIZE_URL
    );

  authorizeUrl.searchParams.set(
    "client_id",
    config.clientId
  );

  authorizeUrl.searchParams.set(
    "response_type",
    "code"
  );

  authorizeUrl.searchParams.set(
    "owner",
    "user"
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
