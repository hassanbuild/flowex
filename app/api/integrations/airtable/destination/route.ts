import { NextResponse } from "next/server";
import {
  AIRTABLE_API_URL,
  AIRTABLE_PROVIDER,
  AIRTABLE_TOKEN_URL,
  getAirtableOAuthConfig,
} from "@/lib/integrations/airtable";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SourceField = {
  key: string;
  label: string;
  type: string;
  options?: string[];
};
type DesiredField = {
  key: string;
  name: string;
  type: string;
  options?: Record<string, unknown>;
};

type AirtableCredentials = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_at?: unknown;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function sourceFields(
  sourceType: string,
  config: unknown,
  detected: unknown
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
          (
            field
          ): field is {
            id: string;
            label?: string;
            type?: string;
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
              : "text",
          options: (() => {
  const rawOptions =
    (field as { options?: unknown }).options;

  return Array.isArray(rawOptions)
    ? rawOptions
        .filter(
          (option): option is string =>
            typeof option === "string" &&
            !!option.trim()
        )
        .map((option) =>
          option.trim()
        )
    : [];
})(),
        }));
    }
  }

  if (
    sourceType === "external_form" &&
    Array.isArray(detected)
  ) {
    return detected
      .filter(
        (
          field
        ): field is {
          key: string;
          type?: string;
        } =>
          !!field &&
          typeof field === "object" &&
          typeof (field as { key?: unknown }).key === "string"
      )
      .map((field) => ({
        key: field.key,
        label: field.key,
        type:
          typeof field.type === "string"
            ? field.type
            : "text",
      }));
  }

  return [];
}

function airtableFieldDefinition(field: SourceField): {
  type: string;
  options?: Record<string, unknown>;
} {
  switch (field.type) {
    case "email":
      return { type: "email" };
    case "phone":
      return { type: "phoneNumber" };
    case "website":
    case "url":
      return { type: "url" };
    case "number":
    case "range":
      return {
        type: "number",
        options: { precision: 0 },
      };
    case "long_text":
    case "textarea":
      return { type: "multilineText" };
    case "dropdown":
    case "select":
    case "radio":
      return {
        type: "singleSelect",
        options: {
          choices: (field.options || []).map((name) => ({ name })),
        },
      };
    case "date":
      return {
        type: "date",
        options: {
          dateFormat: { name: "iso" },
        },
      };
    default:
      return { type: "singleLineText" };
  }
}

function buildDesiredFields(
  fields: SourceField[]
): DesiredField[] {
  const desired: DesiredField[] = [
    {
      key: "__name",
      name: "Name",
      type: "singleLineText",
    },
    {
      key: "__date",
      name: "Date",
      type: "dateTime",
      options: {
        dateFormat: { name: "iso" },
        timeFormat: { name: "24hour" },
        timeZone: "utc",
      },
    },
    {
      key: "__email",
      name: "Email",
      type: "email",
    },
    {
      key: "__phone",
      name: "Phone",
      type: "phoneNumber",
    },
  ];

  const reserved = new Set([
    "name",
    "fullname",
    "firstname",
    "email",
    "emailaddress",
    "phone",
    "phonenumber",
    "mobile",
    "contact",
    "telephone",
    "whatsapp",
    "date",
    "leaddate",
    "capturedat",
    "createdat",
  ]);

  const usedNames = new Set(
    desired.map((field) => normalize(field.name))
  );

  for (const field of fields) {
    const normalizedLabel = normalize(field.label);

    if (
      !normalizedLabel ||
      reserved.has(normalizedLabel) ||
      usedNames.has(normalizedLabel)
    ) {
      continue;
    }

    usedNames.add(normalizedLabel);
    const definition = airtableFieldDefinition(field);

    desired.push({
      key: field.key,
      name: field.label.slice(0, 100),
      type: definition.type,
      ...(definition.options
        ? { options: definition.options }
        : {}),
    });
  }

  return desired;
}

async function authUser(request: Request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return null;
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}

async function getAccessToken(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("credentials, provider_account_email")
    .eq("user_id", userId)
    .eq("provider", AIRTABLE_PROVIDER)
    .maybeSingle();

  if (
    !connection?.credentials ||
    typeof connection.credentials !== "object"
  ) {
    throw new Error("AIRTABLE_NOT_CONNECTED");
  }

  const credentials =
    connection.credentials as AirtableCredentials;

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
    return {
      accessToken,
      email: connection.provider_account_email || null,
    };
  }

  const refreshToken =
    typeof credentials.refresh_token === "string"
      ? credentials.refresh_token
      : "";

  if (!refreshToken) {
    throw new Error("AIRTABLE_RECONNECT");
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
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !token.access_token) {
    throw new Error(
      token.error_description ||
        token.error ||
        "AIRTABLE_RECONNECT"
    );
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

  return {
    accessToken: token.access_token,
    email: connection.provider_account_email || null,
  };
}

async function airtableFetch(
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(
    `${AIRTABLE_API_URL}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init?.headers || {}),
      },
      cache: "no-store",
    }
  );

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.error?.type ||
      data?.error ||
      "Airtable request failed.";

    throw new Error(String(message));
  }

  return data;
}

async function desiredForFlow(
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

  const fields = source
    ? sourceFields(
        source.source_type,
        source.config,
        source.detected_fields
      )
    : [];

  return buildDesiredFields(fields);
}

function mapFields(
  existingFields: any[],
  desired: DesiredField[]
) {
  const aliases: Record<string, string[]> = {
    __name: ["name", "fullname", "firstname", "leadname"],
    __date: ["date", "leaddate", "capturedat", "createdat"],
    __email: ["email", "emailaddress"],
    __phone: [
      "phone",
      "phonenumber",
      "mobile",
      "contact",
      "telephone",
      "whatsapp",
    ],
  };

  const used = new Set<string>();
  const mapping: Record<
    string,
    { fieldId: string; fieldName: string }
  > = {};
  const missing: DesiredField[] = [];

  for (const wanted of desired) {
    const names = new Set([
      normalize(wanted.name),
      ...(aliases[wanted.key] || []),
    ]);

    const match = existingFields.find(
      (field) =>
        !used.has(field.id) &&
        names.has(normalize(String(field.name || "")))
    );

    if (match) {
      used.add(match.id);
      mapping[wanted.key] = {
        fieldId: match.id,
        fieldName: match.name,
      };
    } else {
      missing.push(wanted);
    }
  }

  return { mapping, missing };
}

function workspaceIdFrom(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const match = value.trim().match(/wsp[a-zA-Z0-9]+/);
  return match?.[0] || "";
}

export async function POST(request: Request) {
  const auth = await authUser(request);

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

  const action =
    typeof body.action === "string" ? body.action : "";

  const leadFlowId =
    typeof body.leadFlowId === "string"
      ? body.leadFlowId.trim()
      : "";

  try {
    const { accessToken, email } = await getAccessToken(
      auth.supabase,
      auth.user.id
    );

    if (action === "list_bases") {
      const data = await airtableFetch(
        accessToken,
        "/meta/bases"
      );

      return NextResponse.json({
        bases: Array.isArray(data.bases)
          ? data.bases.map((base: any) => ({
              id: base.id,
              name: base.name,
              permissionLevel: base.permissionLevel || null,
              workspaceId:
                typeof base.workspaceId === "string"
                  ? base.workspaceId
                  : null,
            }))
          : [],
      });
    }

    if (!leadFlowId) {
      return NextResponse.json(
        { error: "Select a Lead Flow first." },
        { status: 400 }
      );
    }

    const { data: flow } = await auth.supabase
      .from("lead_flows")
      .select("id")
      .eq("id", leadFlowId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!flow) {
      return NextResponse.json(
        {
          error:
            "The selected Lead Flow could not be verified.",
        },
        { status: 404 }
      );
    }

    if (action === "unlink_destination") {
      await auth.supabase
        .from("lead_destinations")
        .delete()
        .eq("lead_flow_id", leadFlowId)
        .eq("user_id", auth.user.id)
        .eq("provider", "airtable");

      return NextResponse.json({ unlinked: true });
    }

    const desired = await desiredForFlow(
      auth.supabase,
      auth.user.id,
      leadFlowId
    );

    if (action === "create_base") {
      const workspaceId = workspaceIdFrom(body.workspaceId);
      const baseName =
        typeof body.baseName === "string"
          ? body.baseName.trim().slice(0, 80)
          : "";
      const tableName =
        typeof body.displayName === "string"
          ? body.displayName.trim().slice(0, 80)
          : "";

      if (!workspaceId) {
        return NextResponse.json(
          {
            error:
              "Paste a valid Airtable workspace ID or workspace URL.",
          },
          { status: 400 }
        );
      }

      if (!baseName) {
        return NextResponse.json(
          { error: "Give the Airtable base a name first." },
          { status: 400 }
        );
      }

      if (!tableName) {
        return NextResponse.json(
          { error: "Give the Airtable table a name first." },
          { status: 400 }
        );
      }

      const created = await airtableFetch(
        accessToken,
        "/meta/bases",
        {
          method: "POST",
          body: JSON.stringify({
            workspaceId,
            name: baseName,
            tables: [
              {
                name: tableName,
                fields: desired.map((field) => ({
                  name: field.name,
                  type: field.type,
                  ...(field.options
                    ? { options: field.options }
                    : {}),
                })),
              },
            ],
          }),
        }
      );

      const table = Array.isArray(created.tables)
        ? created.tables[0]
        : null;

      if (!created.id || !table?.id) {
        throw new Error(
          "Airtable created the base but did not return its table."
        );
      }

      const mapped = mapFields(
        Array.isArray(table.fields) ? table.fields : [],
        desired
      );

      return NextResponse.json({
        ready: true,
        mode: "create_new",
        createdBaseByFlowex: true,
        baseId: created.id,
        baseName,
        baseUrl: `https://airtable.com/${created.id}`,
        tableId: table.id,
        tableName: table.name || tableName,
        fieldMapping: mapped.mapping,
      });
    }

    const baseId =
      typeof body.baseId === "string"
        ? body.baseId.trim()
        : "";

    if (!baseId) {
      return NextResponse.json(
        { error: "Choose an Airtable base first." },
        { status: 400 }
      );
    }

    if (action === "list_tables") {
      const data = await airtableFetch(
        accessToken,
        `/meta/bases/${encodeURIComponent(baseId)}/tables`
      );

      return NextResponse.json({
        tables: Array.isArray(data.tables)
          ? data.tables.map((table: any) => ({
              id: table.id,
              name: table.name,
              fields: table.fields || [],
            }))
          : [],
      });
    }

    if (action === "create_new") {
      const displayName =
        typeof body.displayName === "string"
          ? body.displayName.trim().slice(0, 80)
          : "";

      if (!displayName) {
        return NextResponse.json(
          { error: "Give the Airtable table a name first." },
          { status: 400 }
        );
      }

      const created = await airtableFetch(
        accessToken,
        `/meta/bases/${encodeURIComponent(baseId)}/tables`,
        {
          method: "POST",
          body: JSON.stringify({
            name: displayName,
            fields: desired.map((field) => ({
              name: field.name,
              type: field.type,
              ...(field.options
                ? { options: field.options }
                : {}),
            })),
          }),
        }
      );

      const mapped = mapFields(
        Array.isArray(created.fields) ? created.fields : [],
        desired
      );

      return NextResponse.json({
        ready: true,
        mode: "create_new",
        createdBaseByFlowex: false,
        baseId,
        baseUrl: `https://airtable.com/${baseId}`,
        tableId: created.id,
        tableName: created.name || displayName,
        fieldMapping: mapped.mapping,
      });
    }

    const tableId =
      typeof body.tableId === "string"
        ? body.tableId.trim()
        : "";

    if (!tableId) {
      return NextResponse.json(
        { error: "Choose an Airtable table first." },
        { status: 400 }
      );
    }

    const schema = await airtableFetch(
      accessToken,
      `/meta/bases/${encodeURIComponent(baseId)}/tables`
    );

    const table = Array.isArray(schema.tables)
      ? schema.tables.find((item: any) => item.id === tableId)
      : null;

    if (!table) {
      return NextResponse.json(
        { error: "Flowex could not find that Airtable table." },
        { status: 404 }
      );
    }

    let mapped = mapFields(
      Array.isArray(table.fields) ? table.fields : [],
      desired
    );

    if (action === "verify_existing") {
      return NextResponse.json({
        ready: true,
        mode: "existing",
        baseId,
        baseUrl: `https://airtable.com/${baseId}`,
        tableId,
        tableName: table.name,
        missingFields: mapped.missing.map(
          (field) => field.name
        ),
      });
    }

    if (action === "commit") {
      if (body.mode === "existing") {
        for (const field of mapped.missing) {
          const created = await airtableFetch(
            accessToken,
            `/meta/bases/${encodeURIComponent(
              baseId
            )}/tables/${encodeURIComponent(tableId)}/fields`,
            {
              method: "POST",
              body: JSON.stringify({
                name: field.name,
                type: field.type,
                ...(field.options
                  ? { options: field.options }
                  : {}),
              }),
            }
          );

          mapped.mapping[field.key] = {
            fieldId: created.id,
            fieldName: created.name || field.name,
          };
        }
      }

      const displayName =
        typeof body.displayName === "string" &&
        body.displayName.trim()
          ? body.displayName.trim().slice(0, 80)
          : table.name;

      const createdBaseByFlowex =
        body.createdBaseByFlowex === true;

      const baseName =
        typeof body.baseName === "string"
          ? body.baseName.trim().slice(0, 80)
          : "";

      const { error } = await auth.supabase
        .from("lead_destinations")
        .upsert(
          {
            user_id: auth.user.id,
            lead_flow_id: leadFlowId,
            provider: "airtable",
            mode:
              body.mode === "existing"
                ? "existing"
                : "create_new",
            display_name: displayName,
            connected: true,
            config: {
              base_id: baseId,
              base_name: baseName || null,
              base_url: `https://airtable.com/${baseId}`,
              table_id: tableId,
              table_name: table.name,
              field_mapping: mapped.mapping,
              created_base_by_flowex: createdBaseByFlowex,
              airtable_email: email,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "lead_flow_id" }
        );

      if (error) {
        throw new Error(
          "Airtable is ready, but Flowex could not save this destination."
        );
      }

      return NextResponse.json({
        connected: true,
        baseId,
        baseUrl: `https://airtable.com/${baseId}`,
        tableId,
        tableName: table.name,
        fieldMapping: mapped.mapping,
        createdBaseByFlowex,
      });
    }

    return NextResponse.json(
      { error: "Unsupported Airtable destination action." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Flowex could not update Airtable.";

    const needsAirtableConnection =
      message === "AIRTABLE_NOT_CONNECTED" ||
      message === "AIRTABLE_RECONNECT";

    return NextResponse.json(
      {
        error: needsAirtableConnection
          ? "Connect your Airtable account first."
          : message,
        needsAirtableConnection,
      },
      { status: needsAirtableConnection ? 409 : 500 }
    );
  }
}
