import { NextResponse } from "next/server";

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
  const response = NextResponse.json(body, { status });

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
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
  const supabase =
    createAdminClient();

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