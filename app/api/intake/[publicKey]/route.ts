import { NextResponse } from "next/server";
import { google } from "googleapis";

import { createGoogleOAuthClient } from "@/lib/integrations/google";
import {
  AIRTABLE_API_URL,
  AIRTABLE_PROVIDER,
  AIRTABLE_TOKEN_URL,
  getAirtableOAuthConfig,
} from "@/lib/integrations/airtable";
import {
  MICROSOFT_GRAPH_URL,
  MICROSOFT_PROVIDER,
  MICROSOFT_SCOPES,
  MICROSOFT_TOKEN_URL,
  getMicrosoftOAuthConfig,
} from "@/lib/integrations/microsoft";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_FIELDS = 100;
const MAX_KEY_LENGTH = 120;
const MAX_VALUE_LENGTH = 10000;

type IntakePayload = Record<string, unknown>;

type SourceRow = {
  id: string;
  user_id: string;
  lead_flow_id: string | null;
  public_key: string;
  source_type: "flowex_form" | "external_form";
  enabled: boolean;
  verified: boolean | null;
  config: unknown;
  detected_fields: unknown;
};

type DetectedField = {
  key: string;
  type: string;
};

type NormalizedLead = {
  sourceId: string;
  userId: string;
  leadFlowId: string | null;
  sourceType: "flowex_form" | "external_form";
  receivedAt: string;
  contact: {
    email: string | null;
    phone: string | null;
  };
  fields: Record<string, string | number | boolean>;
};

function json(
  body: Record<string, unknown>,
  status = 200,
  origin?: string | null
) {
  const response =
    NextResponse.json(
      body,
      {
        status,
      }
    );

  if (origin) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      origin
    );

    response.headers.set(
      "Vary",
      "Origin"
    );
  }

  return response;
}

function cleanKey(value: string) {
  return value.trim().slice(0, MAX_KEY_LENGTH);
}

function cleanString(value: string) {
  return value.trim().slice(0, MAX_VALUE_LENGTH);
}

function isAllowedScalar(
  value: unknown
): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function normalizePayload(payload: IntakePayload) {
  const normalized: Record<
    string,
    string | number | boolean
  > = {};

  for (
    const [rawKey, rawValue] of Object.entries(payload).slice(
      0,
      MAX_FIELDS
    )
  ) {
    const key = cleanKey(rawKey);

    if (!key || !isAllowedScalar(rawValue)) {
      continue;
    }

    if (typeof rawValue === "string") {
      const value = cleanString(rawValue);

      if (!value) {
        continue;
      }

      normalized[key] = value;
      continue;
    }

    normalized[key] = rawValue;
  }

  return normalized;
}

async function readPayload(
  request: Request
): Promise<IntakePayload> {
  const contentType =
    request.headers.get("content-type")?.toLowerCase() || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new Error("INVALID_PAYLOAD");
    }

    return body as IntakePayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const payload: IntakePayload = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") {
        continue;
      }

      const existing = payload[key];

      payload[key] =
        typeof existing === "string"
          ? `${existing}, ${value}`
          : value;
    }

    return payload;
  }

  throw new Error("UNSUPPORTED_CONTENT_TYPE");
}

function parseDetectedFields(value: unknown): DetectedField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is DetectedField =>
        !!item &&
        typeof item === "object" &&
        typeof (item as DetectedField).key === "string" &&
        typeof (item as DetectedField).type === "string"
    )
    .slice(0, MAX_FIELDS);
}

function parseFlowexFields(config: unknown): DetectedField[] {
  if (!config || typeof config !== "object") {
    return [];
  }

  const fields = (config as { fields?: unknown }).fields;

  if (!Array.isArray(fields)) {
    return [];
  }

  return fields
    .filter(
      (
        field
      ): field is {
        id: string;
        label: string;
        type: string;
      } =>
        !!field &&
        typeof field === "object" &&
        typeof (field as { id?: unknown }).id === "string" &&
        typeof (field as { label?: unknown }).label === "string" &&
        typeof (field as { type?: unknown }).type === "string"
    )
    .map((field) => ({
      key: field.id,
      type: field.type,
    }))
    .slice(0, MAX_FIELDS);
}

function findContactValue(
  fields: Record<string, string | number | boolean>,
  definitions: DetectedField[],
  wantedType: "email" | "phone"
) {
  const match = definitions.find(
    (field) =>
      field.type === wantedType &&
      fields[field.key] !== undefined
  );

  if (match) {
    return String(fields[match.key]).trim();
  }

  const fallback = Object.entries(fields).find(([key]) => {
    const lower = key.toLowerCase();

    if (wantedType === "email") {
      return lower.includes("email") || lower.includes("e-mail");
    }

    return (
      lower.includes("phone") ||
      lower.includes("mobile") ||
      lower.includes("telephone") ||
      lower.includes("whatsapp") ||
      lower === "tel"
    );
  });

  return fallback ? String(fallback[1]).trim() : null;
}

function isValidEmail(value: string | null) {
  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.replace(/[\s\-().]/g, "");
  return /^\+?[0-9]{7,15}$/.test(normalized);
}

function getExternalOrigin(config: unknown) {
  if (!config || typeof config !== "object") {
    return null;
  }

  const sourceUrl = (config as { source_url?: unknown }).source_url;

  if (typeof sourceUrl !== "string") {
    return null;
  }

  try {
    return new URL(sourceUrl).origin;
  } catch {
    return null;
  }
}


async function sendLeadToGoogleSheets(
  supabase: ReturnType<
    typeof createAdminClient
  >,
  lead: NormalizedLead
) {
  if (!lead.leadFlowId) {
    return;
  }

  const {
    data:
      destination,
  } =
    await supabase
      .from(
        "lead_destinations"
      )
      .select(
        "connected, config"
      )
      .eq(
        "lead_flow_id",
        lead.leadFlowId
      )
      .eq(
        "provider",
        "sheets"
      )
      .maybeSingle();

  if (
    !destination ||
    destination.connected !==
      true
  ) {
    return;
  }

  const config =
    destination.config as {
      spreadsheet_id?: unknown;
      sheet_title?: unknown;
      table_id?: unknown;
      column_keys?: unknown;
      field_keys?: unknown;
    } | null;

  const spreadsheetId =
    typeof config
      ?.spreadsheet_id ===
      "string"
      ? config.spreadsheet_id
      : "";

  const sheetTitle =
    typeof config
      ?.sheet_title ===
      "string"
      ? config.sheet_title
      : "Sheet1";

  const tableId =
    typeof config
      ?.table_id ===
      "string"
      ? config.table_id
      : "";

  const columnKeys =
    Array.isArray(
      config?.column_keys
    )
      ? config.column_keys.filter(
          (
            value
          ): value is string =>
            typeof value ===
            "string"
        )
      : Array.isArray(
          config?.field_keys
        )
        ? config.field_keys.filter(
            (
              value
            ): value is string =>
              typeof value ===
              "string"
          )
        : [];

  if (
    !spreadsheetId ||
    columnKeys.length ===
      0
  ) {
    return;
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
        "credentials"
      )
      .eq(
        "user_id",
        lead.userId
      )
      .eq(
        "provider",
        "google_sheets"
      )
      .maybeSingle();

  if (
    !connection
      ?.credentials ||
    typeof connection
      .credentials !==
      "object"
  ) {
    return;
  }

  const oauth2Client =
    createGoogleOAuthClient();

  oauth2Client.setCredentials(
    connection.credentials
  );

  oauth2Client.on(
    "tokens",
    async (
      tokens
    ) => {
      if (
        !tokens.access_token &&
        !tokens.refresh_token
      ) {
        return;
      }

      const current =
        connection.credentials as Record<
          string,
          unknown
        >;

      await supabase
        .from(
          "integration_connections"
        )
        .update({
          credentials: {
            ...current,
            ...tokens,

            refresh_token:
              tokens.refresh_token ||
              current.refresh_token,
          },

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "user_id",
          lead.userId
        )
        .eq(
          "provider",
          "google_sheets"
        );
    }
  );

  const sheets =
    google.sheets({
      version:
        "v4",
      auth:
        oauth2Client,
    });

  const date =
    new Date(
      lead.receivedAt
    );

  const sheetDateSerial =
    date.getTime() /
      86400000 +
    25569;

  const row =
    columnKeys.map(
      (
        key
      ) => {
        if (
          key ===
          "__lead_date" ||
          key ===
          "__captured_at"
        ) {
          return sheetDateSerial;
        }

        if (
          key ===
          "__email"
        ) {
          return (
            lead.contact
              .email ||
            ""
          );
        }

        if (
          key ===
          "__phone"
        ) {
          return (
            lead.contact
              .phone ||
            ""
          );
        }

        return key
          ? lead.fields[
              key
            ] ??
              ""
          : "";
      }
    );

  const safeTitle =
    sheetTitle.replace(
      /'/g,
      "''"
    );

  const appendResult =
    await sheets.spreadsheets.values.append({
      spreadsheetId,

      range:
        `'${safeTitle}'!A:ZZ`,

      valueInputOption:
        "RAW",

      insertDataOption:
        "INSERT_ROWS",

      includeValuesInResponse:
        true,

      requestBody: {
        values: [
          row,
        ],
      },
    });

  if (!tableId) {
    return;
  }

  const updatedRange =
    appendResult.data
      .updates
      ?.updatedRange ||
    "";

  const rowMatch =
    updatedRange.match(
      /!(?:[A-Z]+)(\d+):/
    );

  const appendedRow =
    rowMatch?.[1]
      ? Number(
          rowMatch[1]
        )
      : 0;

  if (
    !Number.isFinite(
      appendedRow
    ) ||
    appendedRow <=
      0
  ) {
    return;
  }

  const spreadsheet =
    await sheets.spreadsheets.get({
      spreadsheetId,

      fields:
        "sheets(properties(sheetId),tables(tableId,name,range,rowsProperties,columnProperties))",
    });

  const sheet =
    spreadsheet.data
      .sheets?.[0];

  const table =
    sheet?.tables?.find(
      (
        item
      ) =>
        item.tableId ===
        tableId
    );

  const sheetId =
    sheet?.properties
      ?.sheetId;

  if (
    !table ||
    typeof sheetId !==
      "number"
  ) {
    return;
  }

  const currentEndRow =
    table.range
      ?.endRowIndex ||
    0;

  if (
    currentEndRow >=
    appendedRow
  ) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,

    requestBody: {
      requests: [
        {
          updateTable: {
            table: {
              ...table,

              range: {
                ...table.range,

                sheetId,

                endRowIndex:
                  appendedRow,
              },
            },

            fields:
              "range",
          },
        } as any,
      ],
    },
  });
}



type AirtableStoredCredentials = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_at?: unknown;
};

async function getAirtableAccessTokenForLead(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("provider", AIRTABLE_PROVIDER)
    .maybeSingle();

  if (
    !connection?.credentials ||
    typeof connection.credentials !== "object"
  ) {
    return "";
  }

  const credentials =
    connection.credentials as AirtableStoredCredentials;

  const accessToken =
    typeof credentials.access_token === "string"
      ? credentials.access_token
      : "";

  const expiresAt =
    typeof credentials.expires_at === "string"
      ? Date.parse(credentials.expires_at)
      : 0;

  if (
    accessToken &&
    (!expiresAt || expiresAt > Date.now() + 60_000)
  ) {
    return accessToken;
  }

  const refreshToken =
    typeof credentials.refresh_token === "string"
      ? credentials.refresh_token
      : "";

  if (!refreshToken) {
    return "";
  }

  const { clientId, clientSecret } =
    getAirtableOAuthConfig();

  const basic = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(AIRTABLE_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const token = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!response.ok || !token.access_token) {
    return "";
  }

  const updated = {
    ...credentials,
    access_token: token.access_token,
    refresh_token:
      token.refresh_token || refreshToken,
    expires_in: token.expires_in || null,
    expires_at:
      typeof token.expires_in === "number"
        ? new Date(
            Date.now() + token.expires_in * 1000
          ).toISOString()
        : null,
  };

  await supabase
    .from("integration_connections")
    .update({
      credentials: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", AIRTABLE_PROVIDER);

  return token.access_token;
}

function airtableLeadName(lead: NormalizedLead) {
  const preferredKeys = [
    "name",
    "full_name",
    "fullname",
    "fullName",
    "first_name",
    "firstName",
  ];

  for (const key of preferredKeys) {
    const value = lead.fields[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  const found = Object.entries(lead.fields).find(
    ([key, value]) =>
      key.toLowerCase().includes("name") &&
      String(value).trim()
  );

  return found ? String(found[1]).trim() : "Lead";
}

async function sendLeadToAirtable(
  supabase: ReturnType<typeof createAdminClient>,
  lead: NormalizedLead
) {
  if (!lead.leadFlowId) {
    return;
  }

  const { data: destination } = await supabase
    .from("lead_destinations")
    .select("connected, config")
    .eq("lead_flow_id", lead.leadFlowId)
    .eq("provider", "airtable")
    .maybeSingle();

  if (!destination || destination.connected !== true) {
    return;
  }

  const config = destination.config as {
    base_id?: unknown;
    table_id?: unknown;
    field_mapping?: unknown;
  } | null;

  const baseId =
    typeof config?.base_id === "string"
      ? config.base_id
      : "";

  const tableId =
    typeof config?.table_id === "string"
      ? config.table_id
      : "";

  const fieldMapping =
    config?.field_mapping &&
    typeof config.field_mapping === "object"
      ? (config.field_mapping as Record<
          string,
          { fieldId?: unknown; fieldName?: unknown }
        >)
      : {};

  if (!baseId || !tableId) {
    return;
  }

  const accessToken = await getAirtableAccessTokenForLead(
    supabase,
    lead.userId
  );

  if (!accessToken) {
    return;
  }

  const fields: Record<string, string | number | boolean> = {};

  for (const [key, mapped] of Object.entries(fieldMapping)) {
    const fieldName =
      typeof mapped?.fieldName === "string"
        ? mapped.fieldName
        : "";

    if (!fieldName) {
      continue;
    }

    if (key === "__name") {
      fields[fieldName] = airtableLeadName(lead);
      continue;
    }

    if (key === "__date") {
      fields[fieldName] = lead.receivedAt;
      continue;
    }

    if (key === "__email") {
      if (lead.contact.email) {
        fields[fieldName] = lead.contact.email;
      }
      continue;
    }

    if (key === "__phone") {
      if (lead.contact.phone) {
        fields[fieldName] = lead.contact.phone;
      }
      continue;
    }

    const value = lead.fields[key];

    if (value !== undefined) {
      fields[fieldName] = value;
    }
  }

  const response = await fetch(
    `${AIRTABLE_API_URL}/${encodeURIComponent(
      baseId
    )}/${encodeURIComponent(tableId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ fields }],
        typecast: true,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || "Airtable rejected the lead record."
    );
  }
}


async function getMicrosoftAccessTokenForLead(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("provider", MICROSOFT_PROVIDER)
    .maybeSingle();

  if (
    !connection?.credentials ||
    typeof connection.credentials !== "object"
  ) {
    return null;
  }

  const credentials =
    connection.credentials as Record<string, unknown>;

  const accessToken =
    typeof credentials.access_token === "string"
      ? credentials.access_token
      : "";

  const expiresAt =
    typeof credentials.expires_at === "string"
      ? Date.parse(credentials.expires_at)
      : 0;

  if (
    accessToken &&
    (!expiresAt || expiresAt > Date.now() + 60_000)
  ) {
    return accessToken;
  }

  const refreshToken =
    typeof credentials.refresh_token === "string"
      ? credentials.refresh_token
      : "";

  if (!refreshToken) {
    return null;
  }

  const {
    clientId,
    clientSecret,
    redirectUri,
  } = getMicrosoftOAuthConfig();

  const response = await fetch(
    MICROSOFT_TOKEN_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        redirect_uri: redirectUri,
        scope: MICROSOFT_SCOPES.join(" "),
      }),
      cache: "no-store",
    }
  );

  const token = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!response.ok || !token.access_token) {
    return null;
  }

  await supabase
    .from("integration_connections")
    .update({
      credentials: {
        ...credentials,
        access_token: token.access_token,
        refresh_token:
          token.refresh_token || refreshToken,
        expires_in:
          token.expires_in || null,
        expires_at:
          typeof token.expires_in === "number"
            ? new Date(
                Date.now() +
                  token.expires_in * 1000
              ).toISOString()
            : null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", MICROSOFT_PROVIDER);

  return token.access_token;
}

async function sendLeadToMicrosoftExcel(
  supabase: ReturnType<typeof createAdminClient>,
  lead: NormalizedLead
) {
  if (!lead.leadFlowId) {
    return;
  }

  const { data: destination } = await supabase
    .from("lead_destinations")
    .select("connected, config")
    .eq("lead_flow_id", lead.leadFlowId)
    .eq("provider", "excel")
    .maybeSingle();

  if (!destination || destination.connected !== true) {
    return;
  }

  const config = destination.config as {
    workbook_id?: unknown;
    table_id?: unknown;
    column_keys?: unknown;
  } | null;

  const workbookId =
    typeof config?.workbook_id === "string"
      ? config.workbook_id
      : "";

  const tableId =
    typeof config?.table_id === "string"
      ? config.table_id
      : "";

  const columnKeys =
    Array.isArray(config?.column_keys)
      ? config.column_keys.filter(
          (value): value is string =>
            typeof value === "string"
        )
      : [];

  if (!workbookId || !tableId || columnKeys.length === 0) {
    return;
  }

  const accessToken =
    await getMicrosoftAccessTokenForLead(
      supabase,
      lead.userId
    );

  if (!accessToken) {
    return;
  }

  const values = columnKeys.map((key) => {
    if (key === "__date") {
      return lead.receivedAt;
    }

    if (key === "__name") {
      return airtableLeadName(lead);
    }

    if (key === "__email") {
      return lead.contact.email || "";
    }

    if (key === "__phone") {
      return lead.contact.phone || "";
    }

    return lead.fields[key] ?? "";
  });

  const response = await fetch(
    `${MICROSOFT_GRAPH_URL}/me/drive/items/${encodeURIComponent(
      workbookId
    )}/workbook/tables/${encodeURIComponent(
      tableId
    )}/rows/add`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        values: [values],
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text ||
        "Microsoft Excel rejected the lead row."
    );
  }
}

async function getSource(publicKey: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lead_sources")
    .select(
      `
        id,
        user_id,
        lead_flow_id,
        public_key,
        source_type,
        enabled,
        verified,
        config,
        detected_fields
      `
    )
    .eq("public_key", publicKey)
    .in("source_type", ["flowex_form", "external_form"])
    .maybeSingle();

  if (error) {
    console.error(
      "Flowex intake source lookup error:",
      error.message
    );

    throw new Error("SOURCE_LOOKUP_FAILED");
  }

  return data as SourceRow | null;
}

function allowedOriginForSource(
  source: SourceRow,
  request: Request
) {
  if (source.source_type === "external_form") {
    return getExternalOrigin(source.config);
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function originMatches(
  request: Request,
  allowedOrigin: string | null
) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return !!allowedOrigin && origin === allowedOrigin;
}

export async function OPTIONS(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      publicKey: string;
    }>;
  }
) {
  const { publicKey } = await params;

  try {
    const source = await getSource(publicKey);

    if (!source) {
      return new Response(null, { status: 404 });
    }

    const allowedOrigin = allowedOriginForSource(
      source,
      request
    );

    if (!originMatches(request, allowedOrigin)) {
      return new Response(null, { status: 403 });
    }

    const response = new Response(null, { status: 204 });

    if (allowedOrigin) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        allowedOrigin
      );
      response.headers.set("Vary", "Origin");
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );
    response.headers.set(
      "Access-Control-Max-Age",
      "600"
    );

    return response;
  } catch {
    return new Response(null, { status: 500 });
  }
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      publicKey: string;
    }>;
  }
) {
  const { publicKey } = await params;

  if (!publicKey) {
    return json(
      {
        success: false,
        error: "Missing Flowex intake key.",
      },
      400
    );
  }

  let source: SourceRow | null;

  try {
    source = await getSource(publicKey);
  } catch {
    return json(
      {
        success: false,
        error: "Flowex could not load this intake source.",
      },
      500
    );
  }

  if (!source) {
    return json(
      {
        success: false,
        error: "Lead intake source was not found.",
      },
      404
    );
  }

  if (!source.enabled) {
    return json(
      {
        success: false,
        error: "This lead intake source is disabled.",
      },
      403
    );
  }

  if (
    source.source_type === "external_form" &&
    source.verified !== true
  ) {
    return json(
      {
        success: false,
        error: "This External Form has not been verified.",
      },
      403
    );
  }

  if (!source.lead_flow_id) {
    return json(
      {
        success: false,
        error:
          "This intake source is not attached to a Lead Flow.",
      },
      409
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: leadFlow,
    error: leadFlowError,
  } =
    await supabase
      .from("lead_flows")
      .select("id, active")
      .eq(
        "id",
        source.lead_flow_id
      )
      .eq(
        "user_id",
        source.user_id
      )
      .maybeSingle();

  if (
    leadFlowError ||
    !leadFlow
  ) {
    return json(
      {
        success: false,
        error:
          "This Lead Flow could not be verified.",
      },
      403
    );
  }

  if (
    leadFlow.active === false
  ) {
    return json(
      {
        success: false,
        error:
          "This automation is currently paused.",
      },
      423
    );
  }

  const allowedOrigin = allowedOriginForSource(
    source,
    request
  );

  if (!originMatches(request, allowedOrigin)) {
    return json(
      {
        success: false,
        error:
          "This submission did not come from the connected form.",
      },
      403,
      allowedOrigin
    );
  }

  let rawPayload: IntakePayload;

  try {
    rawPayload = await readPayload(request);
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "";

    return json(
      {
        success: false,
        error:
          code === "UNSUPPORTED_CONTENT_TYPE"
            ? "Unsupported submission type."
            : "Flowex could not read this submission.",
      },
      code === "UNSUPPORTED_CONTENT_TYPE" ? 415 : 400,
      allowedOrigin
    );
  }

  const fields = normalizePayload(rawPayload);

  if (Object.keys(fields).length === 0) {
    return json(
      {
        success: false,
        error: "No usable lead fields were submitted.",
      },
      400,
      allowedOrigin
    );
  }

  const definitions =
    source.source_type === "external_form"
      ? parseDetectedFields(source.detected_fields)
      : parseFlowexFields(source.config);

  const email = findContactValue(
    fields,
    definitions,
    "email"
  );

  const phone = findContactValue(
    fields,
    definitions,
    "phone"
  );

  const validEmail = isValidEmail(email) ? email : null;
  const validPhone = isValidPhone(phone) ? phone : null;

  if (
    source.source_type === "external_form" &&
    !validEmail &&
    !validPhone
  ) {
    return json(
      {
        success: false,
        error: "A valid email or phone value is required.",
      },
      400,
      allowedOrigin
    );
  }

  const lead: NormalizedLead = {
    sourceId: source.id,
    userId: source.user_id,
    leadFlowId: source.lead_flow_id,
    sourceType: source.source_type,
    receivedAt: new Date().toISOString(),
    contact: {
      email: validEmail,
      phone: validPhone,
    },
    fields,
  };

  /*
    Save the normalized lead inside Flowex first.

    Later automation steps (storage destination, instant reply,
    team notification and follow-up) can all work from this same
    persisted lead record.
  */
  const {
    data: savedLead,
    error: saveLeadError,
  } =
    await supabase
      .from("leads")
      .insert({
        user_id:
          lead.userId,

        lead_flow_id:
          lead.leadFlowId,

        source_id:
          lead.sourceId,

        source_type:
          lead.sourceType,

        email:
          lead.contact.email,

        phone:
          lead.contact.phone,

        fields:
          lead.fields,

        created_at:
          lead.receivedAt,
      })
      .select("id")
      .single();

  if (
    saveLeadError ||
    !savedLead
  ) {
    console.error(
      "Flowex lead save error:",
      saveLeadError?.message ||
        "Unknown lead save error"
    );

    return json(
      {
        success: false,
        error:
          "Flowex received this lead but could not save it.",
      },
      500,
      allowedOrigin
    );
  }

  try {
    await sendLeadToGoogleSheets(
      supabase,
      lead
    );
  } catch (error) {
    console.error(
      "Flowex Google Sheets delivery error:",
      error
    );
  }

  try {
    await sendLeadToAirtable(
      supabase,
      lead
    );
  } catch (error) {
    console.error(
      "Flowex Airtable delivery error:",
      error
    );
  }

  try {
    await sendLeadToMicrosoftExcel(
      supabase,
      lead
    );
  } catch (error) {
    console.error(
      "Flowex Microsoft Excel delivery error:",
      error
    );
  }

  console.log("Flowex lead received:", {
    leadId: savedLead.id,
    sourceId: lead.sourceId,
    sourceType: lead.sourceType,
    leadFlowId: lead.leadFlowId,
    receivedAt: lead.receivedAt,
    fieldCount: Object.keys(lead.fields).length,
    hasEmail: !!lead.contact.email,
    hasPhone: !!lead.contact.phone,
  });

  return json(
    {
      success: true,
      received: true,
      message: "Lead received by Flowex.",
    },
    200,
    allowedOrigin
  );
}