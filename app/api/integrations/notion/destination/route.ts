import { NextResponse } from "next/server";

import {
  NOTION_API_URL,
  NOTION_PROVIDER,
  NOTION_VERSION,
} from "@/lib/integrations/notion";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SourceField = {
  key: string;
  label: string;
  type: string;
  options: string[];
};

type DesiredProperty = {
  key: string;
  name: string;
  type:
    | "title"
    | "rich_text"
    | "number"
    | "select"
    | "date"
    | "url"
    | "email"
    | "phone_number"
    | "checkbox";
  options: string[];
};

type PropertyMap = Record<string, string>;
type PropertyTypes = Record<string, DesiredProperty["type"]>;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cleanOption(value: string) {
  return value
    .replace(/,/g, " -")
    .trim()
    .slice(0, 100);
}

function richTextContent(value: unknown): string {
  if (!Array.isArray(value)) return "";

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const plain = (item as { plain_text?: unknown }).plain_text;
      if (typeof plain === "string") return plain;
      const content = (item as { text?: { content?: unknown } }).text?.content;
      return typeof content === "string" ? content : "";
    })
    .join("")
    .trim();
}

function pageTitle(page: Record<string, any>) {
  const properties =
    page?.properties && typeof page.properties === "object"
      ? page.properties
      : {};

  for (const property of Object.values(properties) as any[]) {
    if (property?.type === "title" && Array.isArray(property.title)) {
      const title = richTextContent(property.title);
      if (title) return title;
    }
  }

  return "Untitled page";
}

function dataSourceTitle(source: Record<string, any>) {
  const title = richTextContent(source?.title);
  return title || "Untitled database";
}

function parseSourceFields(
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

function notionType(field: SourceField): DesiredProperty["type"] {
  const type = field.type.toLowerCase();

  if (type === "email") return "email";
  if (type === "phone") return "phone_number";
  if (type === "number" || type === "range") return "number";
  if (type === "dropdown" || type === "select") return "select";
  if (type === "date") return "date";
  if (type === "website" || type === "url") return "url";
  if (type === "checkbox") return "checkbox";

  return "rich_text";
}

function buildDesiredProperties(fields: SourceField[]): DesiredProperty[] {
  const desired: DesiredProperty[] = [
    {
      key: "__name",
      name: "Name",
      type: "title",
      options: [],
    },
    {
      key: "__date",
      name: "Date",
      type: "date",
      options: [],
    },
    {
      key: "__email",
      name: "Email",
      type: "email",
      options: [],
    },
    {
      key: "__phone",
      name: "Phone",
      type: "phone_number",
      options: [],
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

  const used = new Set(desired.map((property) => normalize(property.name)));

  for (const field of fields) {
    const normalized = normalize(field.label);

    if (!normalized || reserved.has(normalized) || used.has(normalized)) {
      continue;
    }

    used.add(normalized);

    desired.push({
      key: field.key,
      name: field.label.trim().slice(0, 100),
      type: notionType(field),
      options: field.options,
    });
  }

  return desired;
}

function schemaForProperty(property: DesiredProperty) {
  switch (property.type) {
    case "title":
      return { title: {} };
    case "number":
      return { number: { format: "number" } };
    case "select":
      return {
        select: {
          options: property.options.map((name) => ({ name })),
        },
      };
    case "date":
      return { date: {} };
    case "url":
      return { url: {} };
    case "email":
      return { email: {} };
    case "phone_number":
      return { phone_number: {} };
    case "checkbox":
      return { checkbox: {} };
    default:
      return { rich_text: {} };
  }
}

function compatibleType(
  desired: DesiredProperty["type"],
  existing: string
) {
  return desired === existing;
}

function aliasesFor(key: string) {
  if (key === "__name") {
    return ["name", "fullname", "firstname", "leadname", "title"];
  }
  if (key === "__date") {
    return ["date", "leaddate", "capturedat", "createdat"];
  }
  if (key === "__email") {
    return ["email", "emailaddress"];
  }
  if (key === "__phone") {
    return [
      "phone",
      "phonenumber",
      "mobile",
      "contact",
      "telephone",
      "whatsapp",
    ];
  }
  return [];
}

function uniquePropertyName(
  preferred: string,
  existingNames: Set<string>
) {
  if (!existingNames.has(normalize(preferred))) {
    return preferred;
  }

  let counter = 2;
  let candidate = `${preferred} (Flowex)`;

  while (existingNames.has(normalize(candidate))) {
    candidate = `${preferred} (Flowex ${counter})`;
    counter += 1;
  }

  return candidate.slice(0, 100);
}

function resolvePropertyMapping(
  existingProperties: Record<string, any>,
  desired: DesiredProperty[]
) {
  const propertyMap: PropertyMap = {};
  const propertyTypes: PropertyTypes = {};
  const additions: Record<string, any> = {};
  const existingNames = new Set(
    Object.keys(existingProperties).map(normalize)
  );

  const entries = Object.entries(existingProperties);

  for (const property of desired) {
    if (property.type === "title") {
      const titleEntry = entries.find(([, value]) => value?.type === "title");

      if (titleEntry) {
        propertyMap[property.key] = titleEntry[0];
        propertyTypes[property.key] = "title";
        continue;
      }
    }

    const candidates = new Set([
      normalize(property.name),
      ...aliasesFor(property.key),
    ]);

    const exact = entries.find(
      ([name, value]) =>
        candidates.has(normalize(name)) &&
        compatibleType(property.type, String(value?.type || ""))
    );

    if (exact) {
      propertyMap[property.key] = exact[0];
      propertyTypes[property.key] = property.type;
      continue;
    }

    const newName = uniquePropertyName(property.name, existingNames);
    existingNames.add(normalize(newName));
    additions[newName] = schemaForProperty(property);
    propertyMap[property.key] = newName;
    propertyTypes[property.key] = property.type;
  }

  return {
    propertyMap,
    propertyTypes,
    additions,
  };
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

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

async function getNotionConnection(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("credentials, provider_account_email")
    .eq("user_id", userId)
    .eq("provider", NOTION_PROVIDER)
    .maybeSingle();

  const credentials =
    connection?.credentials && typeof connection.credentials === "object"
      ? (connection.credentials as Record<string, unknown>)
      : null;

  const accessToken =
    typeof credentials?.access_token === "string"
      ? credentials.access_token
      : "";

  if (!accessToken) {
    throw new Error("Connect your Notion workspace first.");
  }

  return {
    accessToken,
    email: connection?.provider_account_email || null,
    workspaceName:
      typeof credentials?.workspace_name === "string"
        ? credentials.workspace_name
        : null,
  };
}

async function notionFetch(
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(`${NOTION_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_VERSION,
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
    const message =
      data?.message ||
      data?.error ||
      "Notion rejected the request.";

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
    ? parseSourceFields(
        source.source_type,
        source.config,
        source.detected_fields
      )
    : [];

  return buildDesiredProperties(fields);
}

async function searchNotion(
  accessToken: string,
  object: "page" | "data_source"
) {
  const results: any[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 5; page += 1) {
    const body: Record<string, unknown> = {
      filter: {
        property: "object",
        value: object,
      },
      page_size: 100,
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
    };

    if (cursor) body.start_cursor = cursor;

    const data = await notionFetch(accessToken, "/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (Array.isArray(data?.results)) {
      results.push(...data.results);
    }

    if (!data?.has_more || typeof data?.next_cursor !== "string") {
      break;
    }

    cursor = data.next_cursor;
  }

  return results;
}

async function prepareExisting(
  accessToken: string,
  dataSourceId: string,
  desired: DesiredProperty[],
  mutate: boolean
) {
  let source = await notionFetch(
    accessToken,
    `/data_sources/${encodeURIComponent(dataSourceId)}`
  );

  const properties =
    source?.properties && typeof source.properties === "object"
      ? source.properties
      : {};

  const resolved = resolvePropertyMapping(properties, desired);

  if (mutate && Object.keys(resolved.additions).length > 0) {
    await notionFetch(
      accessToken,
      `/data_sources/${encodeURIComponent(dataSourceId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          properties: resolved.additions,
        }),
      }
    );

    source = await notionFetch(
      accessToken,
      `/data_sources/${encodeURIComponent(dataSourceId)}`
    );
  }

  const databaseId =
    typeof source?.parent?.database_id === "string"
      ? source.parent.database_id
      : "";

  const databaseUrl = databaseId
    ? `https://www.notion.so/${databaseId.replace(/-/g, "")}`
    : "";

  return {
    dataSource: source,
    dataSourceId,
    databaseId,
    databaseUrl,
    title: dataSourceTitle(source),
    propertyMap: resolved.propertyMap,
    propertyTypes: resolved.propertyTypes,
    missingCount: Object.keys(resolved.additions).length,
  };
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);

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
    const connection = await getNotionConnection(
      auth.supabase,
      auth.user.id
    );

    if (action === "list_pages") {
      const results = await searchNotion(connection.accessToken, "page");

      return NextResponse.json({
        pages: results.map((page) => ({
          id: String(page?.id || ""),
          title: pageTitle(page),
          url: typeof page?.url === "string" ? page.url : null,
        })),
        workspaceName: connection.workspaceName,
        email: connection.email,
      });
    }

    if (action === "list_databases") {
      const results = await searchNotion(
        connection.accessToken,
        "data_source"
      );

      return NextResponse.json({
        databases: results.map((source) => ({
          id: String(source?.id || ""),
          title: dataSourceTitle(source),
          databaseId:
            typeof source?.parent?.database_id === "string"
              ? source.parent.database_id
              : "",
          url:
            typeof source?.url === "string"
              ? source.url
              : typeof source?.parent?.database_id === "string"
                ? `https://www.notion.so/${source.parent.database_id.replace(/-/g, "")}`
                : null,
        })),
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
        .eq("provider", "notion");

      return NextResponse.json({ unlinked: true });
    }

    const desired = await desiredForFlow(
      auth.supabase,
      auth.user.id,
      leadFlowId
    );

    if (desired.length <= 4) {
      return NextResponse.json(
        {
          error:
            "Create or connect the lead form first so Flowex knows which Notion properties to build.",
        },
        { status: 422 }
      );
    }

    if (action === "create_new") {
      const parentPageId =
        typeof body.parentPageId === "string"
          ? body.parentPageId.trim()
          : "";

      const displayName =
        typeof body.displayName === "string"
          ? body.displayName.trim().slice(0, 80)
          : "";

      if (!parentPageId || !displayName) {
        return NextResponse.json(
          { error: "Choose a Notion page and give the database a name." },
          { status: 400 }
        );
      }

      const properties: Record<string, any> = {};

      for (const property of desired) {
        properties[property.name] = schemaForProperty(property);
      }

      const created = await notionFetch(
        connection.accessToken,
        "/databases",
        {
          method: "POST",
          body: JSON.stringify({
            parent: {
              type: "page_id",
              page_id: parentPageId,
            },
            title: [
              {
                type: "text",
                text: {
                  content: displayName,
                },
              },
            ],
            is_inline: false,
            initial_data_source: {
              properties,
            },
          }),
        }
      );

      const databaseId = String(created?.id || "");
      let dataSourceId =
        Array.isArray(created?.data_sources) &&
        typeof created.data_sources[0]?.id === "string"
          ? created.data_sources[0].id
          : "";

      if (!dataSourceId && databaseId) {
        const database = await notionFetch(
          connection.accessToken,
          `/databases/${encodeURIComponent(databaseId)}`
        );

        dataSourceId =
          Array.isArray(database?.data_sources) &&
          typeof database.data_sources[0]?.id === "string"
            ? database.data_sources[0].id
            : "";
      }

      if (!databaseId || !dataSourceId) {
        throw new Error(
          "Notion created the database, but Flowex could not identify its data source."
        );
      }

      const prepared = await prepareExisting(
        connection.accessToken,
        dataSourceId,
        desired,
        false
      );

      return NextResponse.json({
        ready: true,
        mode: "create_new",
        createdByFlowex: true,
        parentPageId,
        databaseId,
        dataSourceId,
        databaseName: displayName,
        databaseUrl:
          typeof created?.url === "string"
            ? created.url
            : prepared.databaseUrl,
        propertyMap: prepared.propertyMap,
        propertyTypes: prepared.propertyTypes,
      });
    }

    const dataSourceId =
      typeof body.dataSourceId === "string"
        ? body.dataSourceId.trim()
        : "";

    if (!dataSourceId) {
      return NextResponse.json(
        { error: "Choose a Notion database first." },
        { status: 400 }
      );
    }

    if (action === "verify_existing") {
      const prepared = await prepareExisting(
        connection.accessToken,
        dataSourceId,
        desired,
        false
      );

      return NextResponse.json({
        verified: true,
        dataSourceId,
        databaseId: prepared.databaseId,
        databaseName: prepared.title,
        databaseUrl: prepared.databaseUrl,
        propertyMap: prepared.propertyMap,
        propertyTypes: prepared.propertyTypes,
        missingCount: prepared.missingCount,
      });
    }

    const databaseId =
      typeof body.databaseId === "string"
        ? body.databaseId.trim()
        : "";

    if (action === "trash_created") {
      if (!databaseId) {
        return NextResponse.json(
          { error: "Notion database could not be identified." },
          { status: 400 }
        );
      }

      await notionFetch(
        connection.accessToken,
        `/databases/${encodeURIComponent(databaseId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ in_trash: true }),
        }
      );

      const { data: current } = await auth.supabase
        .from("lead_destinations")
        .select("config")
        .eq("lead_flow_id", leadFlowId)
        .eq("user_id", auth.user.id)
        .eq("provider", "notion")
        .maybeSingle();

      const config =
        current?.config && typeof current.config === "object"
          ? (current.config as Record<string, unknown>)
          : null;

      if (
        config?.database_id === databaseId &&
        config?.created_by_flowex === true
      ) {
        await auth.supabase
          .from("lead_destinations")
          .delete()
          .eq("lead_flow_id", leadFlowId)
          .eq("user_id", auth.user.id)
          .eq("provider", "notion");
      }

      return NextResponse.json({ deleted: true });
    }

    if (action === "commit") {
      const mode = body.mode === "existing" ? "existing" : "create_new";
      const createdByFlowex = body.createdByFlowex === true;

      const prepared = await prepareExisting(
        connection.accessToken,
        dataSourceId,
        desired,
        true
      );

      const finalDatabaseId =
        databaseId || prepared.databaseId;

      const displayName =
        typeof body.displayName === "string" && body.displayName.trim()
          ? body.displayName.trim().slice(0, 80)
          : prepared.title || "Flowex Leads";

      const { error } = await auth.supabase
        .from("lead_destinations")
        .upsert(
          {
            user_id: auth.user.id,
            lead_flow_id: leadFlowId,
            provider: "notion",
            mode,
            display_name: displayName,
            connected: true,
            config: {
              database_id: finalDatabaseId,
              data_source_id: dataSourceId,
              database_name: displayName,
              database_url: prepared.databaseUrl,
              parent_page_id:
                typeof body.parentPageId === "string"
                  ? body.parentPageId
                  : null,
              property_map: prepared.propertyMap,
              property_types: prepared.propertyTypes,
              created_by_flowex: createdByFlowex,
              notion_email: connection.email,
              workspace_name: connection.workspaceName,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "lead_flow_id" }
        );

      if (error) {
        throw new Error(
          "Notion is ready, but Flowex could not save this destination."
        );
      }

      return NextResponse.json({
        connected: true,
        databaseId: finalDatabaseId,
        dataSourceId,
        databaseName: displayName,
        databaseUrl: prepared.databaseUrl,
        propertyMap: prepared.propertyMap,
        propertyTypes: prepared.propertyTypes,
      });
    }

    return NextResponse.json(
      { error: "Unsupported Notion destination action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Flowex Notion destination error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Flowex could not update Notion.",
      },
      { status: 500 }
    );
  }
}
