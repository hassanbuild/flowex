import crypto from "node:crypto";
import { NextResponse } from "next/server";

import {
  createGoogleOAuthClient,
  extractSpreadsheetId,
  GOOGLE_SHEETS_SCOPES,
} from "@/lib/integrations/google";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "Your session could not be verified." },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Your session could not be verified." },
      { status: 401 }
    );
  }

  let body: {
    leadFlowId?: unknown;
    mode?: unknown;
    displayName?: unknown;
    destination?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const leadFlowId =
    typeof body.leadFlowId === "string"
      ? body.leadFlowId.trim()
      : "";

  const mode =
    body.mode === "existing"
      ? "existing"
      : "create_new";

  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim().slice(0, 80)
      : "";

  const destination =
    typeof body.destination === "string"
      ? body.destination.trim()
      : "";

  if (!leadFlowId || !displayName) {
    return NextResponse.json(
      { error: "Lead Flow and destination name are required." },
      { status: 400 }
    );
  }

  if (
    mode === "existing" &&
    !extractSpreadsheetId(destination)
  ) {
    return NextResponse.json(
      { error: "Paste a valid Google Sheets URL." },
      { status: 400 }
    );
  }

  const { data: flow } = await supabase
    .from("lead_flows")
    .select("id")
    .eq("id", leadFlowId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!flow) {
    return NextResponse.json(
      { error: "The selected Lead Flow could not be verified." },
      { status: 404 }
    );
  }

  const { error: destinationError } = await supabase
    .from("lead_destinations")
    .upsert(
      {
        user_id: user.id,
        lead_flow_id: leadFlowId,
        provider: "sheets",
        mode,
        display_name: displayName,
        config: { destination },
        connected: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_flow_id" }
    );

  if (destinationError) {
    return NextResponse.json(
      { error: "Flowex could not prepare this Google Sheets destination." },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(32).toString("hex");

  const { error: stateError } = await supabase
    .from("oauth_states")
    .insert({
      state,
      user_id: user.id,
      lead_flow_id: leadFlowId,
      provider: "google_sheets",
      expires_at: new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString(),
    });

  if (stateError) {
    return NextResponse.json(
      { error: "Flowex could not start Google authorization." },
      { status: 500 }
    );
  }

  const oauth2Client = createGoogleOAuthClient();

  return NextResponse.json({
    url: oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: GOOGLE_SHEETS_SCOPES,
      state,
    }),
  });
}