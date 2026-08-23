import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  createGoogleOAuthClient,
  GOOGLE_SHEETS_SCOPES,
} from "@/lib/integrations/google";

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
    data,
    error,
  } =
    await auth.supabase
      .from(
        "integration_connections"
      )
      .select(
        "provider_account_email, updated_at"
      )
      .eq(
        "user_id",
        auth.user.id
      )
      .eq(
        "provider",
        "google_sheets"
      )
      .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        connected: false,
        error:
          "Flowex could not check your Google connection.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    connected:
      !!data,
    email:
      data?.provider_account_email ||
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

  const state =
    crypto
      .randomBytes(32)
      .toString("hex");

  const {
    error: stateError,
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
          "google_sheets",
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
          "Flowex could not start Google authorization.",
      },
      {
        status: 500,
      }
    );
  }

  const oauth2Client =
    createGoogleOAuthClient();

  return NextResponse.json({
    url:
      oauth2Client.generateAuthUrl({
        access_type:
          "offline",

        prompt:
          "consent",

        include_granted_scopes:
          true,

        scope:
          GOOGLE_SHEETS_SCOPES,

        state,
      }),
  });
}