import * as crypto from "crypto";
import { google } from "googleapis";
import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/integrations/reply-auth";

export const runtime = "nodejs";

const GMAIL_SEND_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
];

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

export async function POST(
  request: Request
) {
  const auth =
    await authenticateRequest(
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

  const body =
    (await request
      .json()
      .catch(
        () => null
      )) as {
      leadFlowId?: unknown;
    } | null;

  const leadFlowId =
    typeof body
      ?.leadFlowId ===
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
    data:
      flow,
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
    error:
      stateError,
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
          "google_email",

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
          "Flowex could not start email authorization.",
      },
      {
        status: 500,
      }
    );
  }

  let oauth2Client:
    InstanceType<
      typeof google.auth.OAuth2
    >;

  try {
    oauth2Client =
      createReplyEmailOAuthClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Google email connection is not configured yet.",
      },
      {
        status: 500,
      }
    );
  }

  const url =
    oauth2Client.generateAuthUrl({
      access_type:
        "offline",

      prompt:
        "consent",

      include_granted_scopes:
        true,

      scope:
        GMAIL_SEND_SCOPES,

      state,
    });

  return NextResponse.json({
    url,
  });
}