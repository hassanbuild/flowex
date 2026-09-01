import { NextResponse } from "next/server";

import {
  HUBSPOT_API_URL,
  HUBSPOT_PROVIDER,
  HUBSPOT_SCOPES,
  HUBSPOT_TOKEN_URL,
  getHubSpotOAuthConfig,
  hubSpotPropertyName,
} from "@/lib/integrations/hubspot";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SourceField = {
  key: string;
  label: string;
  type: string;
  options: string[];
};

type HubSpotFieldMapEntry = {
  property: string;
  secondary?: string;
  kind?: "full_name";
};

type HubSpotFieldMap = Record<string, HubSpotFieldMapEntry>;

type PropertySpec = {
  name: string;
  label: string;
  type: "string" | "number" | "enumeration" | "date" | "bool";
  fieldType:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "date"
    | "booleancheckbox";
  options: string[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cleanOption(value: string) {
  return value.trim().slice(0, 100);
}

function parseFields(
  sourceType: string,
  config: unknown,
  detectedFields: unknown
): SourceField[] {
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
            label?: string;
            type?: string;
            options?: unknown;
          } =>
            !!field &&
            typeof field === "object" &&
            typeof (field as { id?: unknown }).id === "string"
        )
        .map((field) => ({
          key: field.id,
          label:
            typeof field.label === "string" && field.label.trim()
              ? field.label.trim()
              : field.id,
          type:
            typeof field.type === "string"
              ? field.type
              : "short_text",
          options: Array.isArray(field.options)
            ? field.options
                .filter(
                  (option): option is string =>
                    typeof option === "string" && !!option.trim()
                )
                .map(cleanOption)
                .filter(Boolean)
            : [],
        }));
    }
  }

  if (sourceType === "external_form" && Array.isArray(detectedFields)) {
    return detectedFields
      .filter(
        (field): field is {
          key: string;
          label?: string;
          type?: string;
          options?: unknown;
        } =>
          !!field &&
          typeof field === "object" &&
          typeof (field as { key?: unknown }).key === "string"
      )
      .map((field) => ({
        key: field.key,
        label:
          typeof field.label === "string" && field.label.trim()
            ? field.label.trim()
            : field.key,
        type:
          typeof field.type === "string"
            ? field.type
            : "text",
        options: Array.isArray(field.options)
          ? field.options
              .filter(
                (option): option is string =>
                  typeof option === "string" && !!option.trim()
              )
              .map(cleanOption)
              .filter(Boolean)
          : [],
      }));
  }

  return [];
}

function standardMapping(field: SourceField): HubSpotFieldMapEntry | null {
  const type = field.type.toLowerCase();
  const label = normalize(field.label);

  if (
    type === "full_name" ||
    label === "name" ||
    label === "fullname" ||
    label === "contactname"
  ) {
    return {
      property: "firstname",
      secondary: "lastname",
      kind: "full_name",
    };
  }

  if (type === "email" || label === "email" || label === "emailaddress") {
    return { property: "email" };
  }

  if (
    type === "phone" ||
    label === "phone" ||
    label === "phonenumber" ||
    label === "mobile" ||
    label === "telephone" ||
    label === "whatsapp"
  ) {
    return { property: "phone" };
  }

  if (type === "company" || label === "company" || label === "companyname") {
    return { property: "company" };
  }

  if (
    type === "website" ||
    type === "url" ||
    label === "website" ||
    label === "url"
  ) {
    return { property: "website" };
  }

  return null;
}

function propertySpec(field: SourceField): PropertySpec {
  const type = field.type.toLowerCase();

  if (type === "number" || type === "range") {
    return {
      name: hubSpotPropertyName(field.key),
      label: field.label.slice(0, 100),
      type: "number",
      fieldType: "number",
      options: [],
    };
  }

  if (type === "dropdown" || type === "select" || type === "radio") {
    return {
      name: hubSpotPropertyName(field.key),
      label: field.label.slice(0, 100),
      type: "enumeration",
      fieldType: "select",
      options: field.options,
    };
  }

  if (type === "date") {
    return {
      name: hubSpotPropertyName(field.key),
      label: field.label.slice(0, 100),
      type: "date",
      fieldType: "date",
      options: [],
    };
  }

  if (type === "checkbox") {
    return {
      name: hubSpotPropertyName(field.key),
      label: field.label.slice(0, 100),
      type: "bool",
      fieldType: "booleancheckbox",
      options: [],
    };
  }

  return {
    name: hubSpotPropertyName(field.key),
    label: field.label.slice(0, 100),
    type: "string",
    fieldType: type === "long_text" || type === "textarea" ? "textarea" : "text",
    options: [],
  };
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;

  const token = authorization.slice(7).trim();
  if (!token) return null;

  const supabase = createAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return { user, supabase };
}

async function getHubSpotAccessToken(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("provider", HUBSPOT_PROVIDER)
    .maybeSingle();

  if (
    !connection?.credentials ||
    typeof connection.credentials !== "object"
  ) {
    throw new Error("Connect your HubSpot account first.");
  }

  const credentials = connection.credentials as Record<string, unknown>;
  const accessToken =
    typeof credentials.access_token === "string"
      ? credentials.access_token
      : "";
  const expiresAt =
    typeof credentials.expires_at === "string"
      ? Date.parse(credentials.expires_at)
      : 0;

  if (accessToken && (!expiresAt || expiresAt > Date.now() + 60_000)) {
    return {
      accessToken,
      hubId:
        typeof credentials.hub_id === "number" ||
        typeof credentials.hub_id === "string"
          ? String(credentials.hub_id)
          : "",
    };
  }

  const refreshToken =
    typeof credentials.refresh_token === "string"
      ? credentials.refresh_token
      : "";

  if (!refreshToken) {
    throw new Error("Reconnect your HubSpot account.");
  }

  const { clientId, clientSecret } = getHubSpotOAuthConfig();

  const response = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const token = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    hub_id?: number;
    scopes?: string[];
    error?: string;
    error_description?: string;
    message?: string;
  };

  if (!response.ok || !token.access_token) {
    throw new Error(
      token.error_description ||
        token.message ||
        token.error ||
        "Reconnect your HubSpot account."
    );
  }

  const updatedCredentials = {
    ...credentials,
    access_token: token.access_token,
    refresh_token: token.refresh_token || refreshToken,
    expires_in: token.expires_in || null,
    expires_at:
      typeof token.expires_in === "number"
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
    hub_id: token.hub_id || credentials.hub_id || null,
    scopes: token.scopes || credentials.scopes || [],
  };

  await supabase
    .from("integration_connections")
    .update({
      credentials: updatedCredentials,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", HUBSPOT_PROVIDER);

  return {
    accessToken: token.access_token,
    hubId:
      typeof updatedCredentials.hub_id === "number" ||
      typeof updatedCredentials.hub_id === "string"
        ? String(updatedCredentials.hub_id)
        : "",
  };
}

async function hubSpotFetch(
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(`${HUBSPOT_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (response.status === 204) return {};

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      String(
        data?.message ||
          data?.error_description ||
          data?.error ||
          "HubSpot rejected the request."
      )
    );
  }

  return data;
}

async function sourceFieldsForFlow(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  leadFlowId: string
) {
  const { data: source } = await supabase
    .from("lead_sources")
    .select("source_type, config, detected_fields")
    .eq("lead_flow_id", leadFlowId)
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return source
    ? parseFields(source.source_type, source.config, source.detected_fields)
    : [];
}

async function buildHubSpotMapping(
  accessToken: string,
  fields: SourceField[],
  createMissing: boolean
) {
  const propertyResponse = await hubSpotFetch(
    accessToken,
    "/crm/properties/2026-03/contacts"
  );

  const existing = Array.isArray(propertyResponse?.results)
    ? propertyResponse.results
    : [];

  const existingNames = new Set(
    existing
      .map((property: any) =>
        typeof property?.name === "string" ? property.name : ""
      )
      .filter(Boolean)
  );

  const fieldMap: HubSpotFieldMap = {};
  const missingSpecs: PropertySpec[] = [];

  for (const field of fields) {
    const standard = standardMapping(field);

    if (standard) {
      fieldMap[field.key] = standard;
      continue;
    }

    const spec = propertySpec(field);
    fieldMap[field.key] = { property: spec.name };

    if (!existingNames.has(spec.name)) {
      missingSpecs.push(spec);
    }
  }

  if (createMissing) {
    for (const spec of missingSpecs) {
      await hubSpotFetch(
        accessToken,
        "/crm/properties/2026-03/contacts",
        {
          method: "POST",
          body: JSON.stringify({
            groupName: "contactinformation",
            name: spec.name,
            label: spec.label,
            type: spec.type,
            fieldType: spec.fieldType,
            formField: false,
            hidden: false,
            hasUniqueValue: false,
            options:
              spec.type === "enumeration"
                ? spec.options.map((option, index) => ({
                    label: option,
                    value: option,
                    displayOrder: index,
                    hidden: false,
                  }))
                : [],
          }),
        }
      );
    }
  }

  return {
    fieldMap,
    missingCount: missingSpecs.length,
    customPropertyCount: fields.filter((field) => !standardMapping(field)).length,
  };
}

export async function POST(request: Request) {
  const auth = await authenticatedUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: "Your session could not be verified." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const action = typeof body.action === "string" ? body.action : "";
  const leadFlowId =
    typeof body.leadFlowId === "string" ? body.leadFlowId.trim() : "";

  if (!leadFlowId) {
    return NextResponse.json(
      { error: "Select a Lead Flow first." },
      { status: 400 }
    );
  }

  try {
    const { data: flow } = await auth.supabase
      .from("lead_flows")
      .select("id")
      .eq("id", leadFlowId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!flow) {
      return NextResponse.json(
        { error: "The selected Lead Flow could not be verified." },
        { status: 404 }
      );
    }

    if (action === "unlink_destination") {
      await auth.supabase
        .from("lead_destinations")
        .delete()
        .eq("lead_flow_id", leadFlowId)
        .eq("user_id", auth.user.id)
        .eq("provider", "hubspot");

      return NextResponse.json({ unlinked: true });
    }

    const { accessToken, hubId } = await getHubSpotAccessToken(
      auth.supabase,
      auth.user.id
    );

    const fields = await sourceFieldsForFlow(
      auth.supabase,
      auth.user.id,
      leadFlowId
    );

    if (fields.length === 0) {
      return NextResponse.json(
        {
          error:
            "Create or connect the lead form first so Flowex knows which HubSpot properties to map.",
        },
        { status: 422 }
      );
    }

    if (action === "inspect") {
      const mapping = await buildHubSpotMapping(accessToken, fields, false);

      return NextResponse.json({
        ready: true,
        hubId,
        mappedFieldCount: fields.length,
        customPropertyCount: mapping.customPropertyCount,
        missingCount: mapping.missingCount,
      });
    }

    if (action === "commit") {
      const mapping = await buildHubSpotMapping(accessToken, fields, true);

      const { error } = await auth.supabase
        .from("lead_destinations")
        .upsert(
          {
            user_id: auth.user.id,
            lead_flow_id: leadFlowId,
            provider: "hubspot",
            mode: "existing",
            display_name: "HubSpot Contacts",
            connected: true,
            config: {
              object_type: "contacts",
              hub_id: hubId || null,
              field_map: mapping.fieldMap,
              mapped_field_count: fields.length,
              custom_property_count: mapping.customPropertyCount,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "lead_flow_id" }
        );

      if (error) {
        throw new Error(
          "HubSpot is ready, but Flowex could not save this destination."
        );
      }

      return NextResponse.json({
        connected: true,
        hubId,
        mappedFieldCount: fields.length,
        customPropertyCount: mapping.customPropertyCount,
        fieldMap: mapping.fieldMap,
      });
    }

    return NextResponse.json(
      { error: "Unsupported HubSpot destination action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Flowex HubSpot destination error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Flowex could not update HubSpot.",
      },
      { status: 500 }
    );
  }
}
