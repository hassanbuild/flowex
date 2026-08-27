import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  AIRTABLE_PROVIDER,
  createAirtableAuthorizationUrl,
  createAirtablePkce,
  getAirtableOAuthConfig,
} from "@/lib/integrations/airtable";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function authenticate(
  request: Request
) {
  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization
          .slice(7)
          .trim()
      : "";

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
    await authenticate(
      request
    );

  if (!auth) {
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
    data: connection,
  } =
    await auth.supabase
      .from(
        "integration_connections"
      )
      .select(
        "credentials, provider_account_email"
      )
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        AIRTABLE_PROVIDER
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
  const auth =
    await authenticate(
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

  try {
    getAirtableOAuthConfig();
  } catch {
    return NextResponse.json(
      {
        error:
          "Airtable connection is not configured yet.",
      },
      {
        status: 500,
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
      ? body.leadFlowId
          .trim()
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
      .from(
        "lead_flows"
      )
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

  const state =
    crypto
      .randomBytes(32)
      .toString("hex");

  const {
    codeVerifier,
    codeChallenge,
  } = createAirtablePkce();

  const {
    error: stateError,
  } =
    await auth.supabase
      .from(
        "oauth_states"
      )
      .insert({
        state,
        user_id:
          auth.user.id,
        lead_flow_id:
          leadFlowId,
        provider:
          AIRTABLE_PROVIDER,
        code_verifier:
          codeVerifier,
        expires_at:
          new Date(
            Date.now() +
              10 * 60 * 1000
          ).toISOString(),
      });

  if (stateError) {
    return NextResponse.json(
      {
        error:
          "Flowex could not start Airtable authorization.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    url:
      createAirtableAuthorizationUrl(
        state,
        codeChallenge
      ),
  });
}
