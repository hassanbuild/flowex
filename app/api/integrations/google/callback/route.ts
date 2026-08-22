import { google } from "googleapis";
import { NextResponse } from "next/server";

import {
  createGoogleOAuthClient,
  extractSpreadsheetId,
} from "@/lib/integrations/google";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function sourceFields(
  sourceType: string,
  config: unknown,
  detectedFields: unknown
) {
  if (
    sourceType === "flowex_form" &&
    config &&
    typeof config === "object"
  ) {
    const fields = (config as { fields?: unknown }).fields;

    if (Array.isArray(fields)) {
      return fields
        .filter(
          (field): field is {
            id: string;
            label: string;
          } =>
            !!field &&
            typeof field === "object" &&
            typeof (field as { id?: unknown }).id === "string" &&
            typeof (field as { label?: unknown }).label === "string"
        )
        .map((field) => ({
          key: field.id,
          label: field.label.trim() || field.id,
        }));
    }
  }

  if (Array.isArray(detectedFields)) {
    return detectedFields
      .filter(
        (field): field is { key: string } =>
          !!field &&
          typeof field === "object" &&
          typeof (field as { key?: unknown }).key === "string"
      )
      .map((field) => ({
        key: field.key,
        label: field.key,
      }));
  }

  return [];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const fallback = new URL(
    "/lead-capture/dashboard",
    request.url
  );

  if (oauthError || !code || !state) {
    fallback.searchParams.set("google", "cancelled");
    return NextResponse.redirect(fallback);
  }

  const supabase = createAdminClient();

  const { data: oauthState } = await supabase
    .from("oauth_states")
    .select("user_id, lead_flow_id, expires_at")
    .eq("state", state)
    .eq("provider", "google_sheets")
    .maybeSingle();

  if (
    !oauthState ||
    new Date(oauthState.expires_at).getTime() < Date.now()
  ) {
    fallback.searchParams.set("google", "invalid_state");
    return NextResponse.redirect(fallback);
  }

  await supabase
    .from("oauth_states")
    .delete()
    .eq("state", state);

  const manageUrl = new URL(
    "/lead-capture/manage",
    request.url
  );

  manageUrl.searchParams.set(
    "flowId",
    oauthState.lead_flow_id
  );

  try {
    const oauth2Client = createGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });

    const { data: profile } = await oauth2.userinfo.get();

    const { data: destination } = await supabase
      .from("lead_destinations")
      .select("id, mode, display_name, config")
      .eq("lead_flow_id", oauthState.lead_flow_id)
      .eq("user_id", oauthState.user_id)
      .eq("provider", "sheets")
      .maybeSingle();

    if (!destination) {
      throw new Error("Destination not found.");
    }

    const { data: source } = await supabase
      .from("lead_sources")
      .select("source_type, config, detected_fields")
      .eq("lead_flow_id", oauthState.lead_flow_id)
      .eq("user_id", oauthState.user_id)
      .eq("enabled", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fields = source
      ? sourceFields(
          source.source_type,
          source.config,
          source.detected_fields
        )
      : [];

    const headers = [
      "Captured At",
      ...fields.map((field) => field.label),
    ];

    const sheets = google.sheets({
      version: "v4",
      auth: oauth2Client,
    });

    const destinationConfig =
      destination.config as {
        destination?: unknown;
      } | null;

    let spreadsheetId = "";

    if (destination.mode === "existing") {
      spreadsheetId =
        extractSpreadsheetId(
          typeof destinationConfig?.destination === "string"
            ? destinationConfig.destination
            : ""
        ) || "";

      if (!spreadsheetId) {
        throw new Error("Invalid existing spreadsheet.");
      }

      const headerResult =
        await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "A1:ZZ1",
        });

      if ((headerResult.data.values?.[0] || []).length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "A1",
          valueInputOption: "RAW",
          requestBody: { values: [headers] },
        });
      }
    } else {
      const created =
        await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: destination.display_name,
            },
          },
        });

      spreadsheetId =
        created.data.spreadsheetId || "";

      if (!spreadsheetId) {
        throw new Error("Google did not return a spreadsheet ID.");
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "A1",
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    const { data: oldConnection } = await supabase
      .from("integration_connections")
      .select("credentials")
      .eq("lead_flow_id", oauthState.lead_flow_id)
      .eq("provider", "google_sheets")
      .maybeSingle();

    const previous =
      oldConnection?.credentials &&
      typeof oldConnection.credentials === "object"
        ? (oldConnection.credentials as Record<string, unknown>)
        : {};

    const credentials = {
      ...previous,
      ...tokens,
      refresh_token:
        tokens.refresh_token ||
        previous.refresh_token,
    };

    const { error: connectionError } = await supabase
      .from("integration_connections")
      .upsert(
        {
          user_id: oauthState.user_id,
          lead_flow_id: oauthState.lead_flow_id,
          provider: "google_sheets",
          provider_account_email: profile.email || null,
          credentials,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "lead_flow_id,provider" }
      );

    if (connectionError) {
      throw new Error(connectionError.message);
    }

    const { error: updateError } = await supabase
      .from("lead_destinations")
      .update({
        connected: true,
        config: {
          ...(destination.config &&
          typeof destination.config === "object"
            ? destination.config
            : {}),
          spreadsheet_id: spreadsheetId,
          spreadsheet_url:
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
          headers,
          field_keys: fields.map((field) => field.key),
          google_email: profile.email || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", destination.id)
      .eq("user_id", oauthState.user_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    manageUrl.searchParams.set("google", "connected");
    return NextResponse.redirect(manageUrl);
  } catch (error) {
    console.error("Flowex Google callback error:", error);
    manageUrl.searchParams.set("google", "error");
    return NextResponse.redirect(manageUrl);
  }
}