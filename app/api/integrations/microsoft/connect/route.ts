import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  MICROSOFT_AUTHORIZE_URL,
  MICROSOFT_PROVIDER,
  MICROSOFT_SCOPES,
  createMicrosoftPkce,
  getMicrosoftOAuthConfig,
} from "@/lib/integrations/microsoft";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
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
    return NextResponse.json(
      {
        connected: false,
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return NextResponse.json(
      {
        connected: false,
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser(
      token
    );

  if (
    userError ||
    !user
  ) {
    return NextResponse.json(
      {
        connected: false,
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const {
    data:
      connection,
  } =
    await supabase
      .from(
        "integration_connections"
      )
      .select(
        "credentials, provider_account_email"
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "provider",
        MICROSOFT_PROVIDER
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

  const connected =
    !!credentials &&
    (
      typeof credentials.access_token ===
        "string" ||
      typeof credentials.refresh_token ===
        "string"
    );

  return NextResponse.json({
    connected,
    email:
      connection
        ?.provider_account_email ||
      null,
  });
}

export async function POST(
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

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
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

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser(
      token
    );

  if (
    userError ||
    !user
  ) {
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
    await supabase
      .from("lead_flows")
      .select("id")
      .eq(
        "id",
        leadFlowId
      )
      .eq(
        "user_id",
        user.id
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
      typeof getMicrosoftOAuthConfig
    >;

  try {
    config =
      getMicrosoftOAuthConfig();
  } catch {
    return NextResponse.json(
      {
        error:
          "Microsoft connection is not configured yet.",
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
    codeVerifier,
    codeChallenge,
  } =
    createMicrosoftPkce();

  const {
    error:
      stateError,
  } =
    await supabase
      .from("oauth_states")
      .insert({
        state,
        user_id:
          user.id,
        lead_flow_id:
          leadFlowId,
        provider:
          MICROSOFT_PROVIDER,
        code_verifier:
          codeVerifier,
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
          "Flowex could not start Microsoft authorization.",
      },
      {
        status: 500,
      }
    );
  }

  const authorizeUrl =
    new URL(
      MICROSOFT_AUTHORIZE_URL
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
    "redirect_uri",
    config.redirectUri
  );

  authorizeUrl.searchParams.set(
    "response_mode",
    "query"
  );

  authorizeUrl.searchParams.set(
    "scope",
    MICROSOFT_SCOPES.join(
      " "
    )
  );

  authorizeUrl.searchParams.set(
    "state",
    state
  );

  authorizeUrl.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  authorizeUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  return NextResponse.json({
    url:
      authorizeUrl.toString(),
  });
}
