import { NextResponse } from "next/server";

import {
  MICROSOFT_GRAPH_URL,
  MICROSOFT_PROVIDER,
  MICROSOFT_SCOPES,
  MICROSOFT_TOKEN_URL,
  getMicrosoftOAuthConfig,
} from "@/lib/integrations/microsoft";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MicrosoftCredentials = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_at?: unknown;
};

type SourceField = {
  key: string;
  label: string;
  type: string;
};

type DesiredColumn = {
  key: string;
  header: string;
};

const BLANK_XLSX_BASE64 = "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";

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
          (field): field is {
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
        }));
    }
  }

  if (
    sourceType === "external_form" &&
    Array.isArray(detected)
  ) {
    return detected
      .filter(
        (field): field is {
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

function buildDesiredColumns(fields: SourceField[]): DesiredColumn[] {
  const desired: DesiredColumn[] = [
    { key: "__date", header: "Date" },
    { key: "__name", header: "Name" },
    { key: "__email", header: "Email" },
    { key: "__phone", header: "Phone" },
  ];

  const reserved = new Set([
    "date",
    "leaddate",
    "capturedat",
    "createdat",
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
  ]);

  const used = new Set(desired.map((column) => normalize(column.header)));

  for (const field of fields) {
    const label = field.label.trim();
    const normalized = normalize(label);

    if (!label || reserved.has(normalized) || used.has(normalized)) {
      continue;
    }

    used.add(normalized);
    desired.push({
      key: field.key,
      header: label.slice(0, 100),
    });
  }

  return desired;
}

async function authUser(request: Request) {
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

async function getAccessToken(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("credentials, provider_account_email")
    .eq("user_id", userId)
    .eq("provider", MICROSOFT_PROVIDER)
    .maybeSingle();

  if (
    !connection?.credentials ||
    typeof connection.credentials !== "object"
  ) {
    throw new Error("Connect your Microsoft account first.");
  }

  const credentials = connection.credentials as MicrosoftCredentials;

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
    throw new Error("Reconnect your Microsoft account.");
  }

  const {
    clientId,
    clientSecret,
    redirectUri,
  } = getMicrosoftOAuthConfig();

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
        "Reconnect your Microsoft account."
    );
  }

  const updated = {
    ...(credentials as Record<string, unknown>),
    access_token: token.access_token,
    refresh_token: token.refresh_token || refreshToken,
    expires_in: token.expires_in || null,
    expires_at:
      typeof token.expires_in === "number"
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
  };

  await supabase
    .from("integration_connections")
    .update({
      credentials: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", MICROSOFT_PROVIDER);

  return {
    accessToken: token.access_token,
    email: connection.provider_account_email || null,
  };
}

async function graphFetch(
  accessToken: string,
  path: string,
  init?: RequestInit
) {
  const response = await fetch(`${MICROSOFT_GRAPH_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body && !(init.body instanceof Buffer)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return {};
  }

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.error_description ||
      data?.error ||
      "Microsoft Graph request failed.";

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

  return buildDesiredColumns(fields);
}

function resolveColumns(
  existingHeaders: string[],
  desired: DesiredColumn[]
) {
  const aliases: Record<string, string[]> = {
    __date: ["date", "leaddate", "capturedat", "createdat"],
    __name: ["name", "fullname", "firstname", "leadname"],
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

  const headers = [...existingHeaders];
  const keys = new Array<string>(headers.length).fill("");
  const usedDesired = new Set<number>();

  headers.forEach((header, headerIndex) => {
    const normalizedHeader = normalize(header);

    const matchIndex = desired.findIndex((column, desiredIndex) => {
      if (usedDesired.has(desiredIndex)) return false;

      const candidates = new Set([
        normalize(column.header),
        ...(aliases[column.key] || []),
      ]);

      return candidates.has(normalizedHeader);
    });

    if (matchIndex >= 0) {
      keys[headerIndex] = desired[matchIndex].key;
      usedDesired.add(matchIndex);
    }
  });

  desired.forEach((column, index) => {
    if (usedDesired.has(index)) return;
    headers.push(column.header);
    keys.push(column.key);
  });

  return { headers, keys };
}

function columnLetters(count: number) {
  let n = Math.max(1, count);
  let result = "";

  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }

  return result;
}

async function workbookInfo(
  accessToken: string,
  workbookId: string
) {
  return graphFetch(
    accessToken,
    `/me/drive/items/${encodeURIComponent(workbookId)}?$select=id,name,webUrl,file`
  );
}

async function listTables(
  accessToken: string,
  workbookId: string
) {
  const data = await graphFetch(
    accessToken,
    `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/tables?$select=id,name,showHeaders`
  );

  return Array.isArray(data?.value) ? data.value : [];
}

async function firstWorksheet(
  accessToken: string,
  workbookId: string
) {
  const data = await graphFetch(
    accessToken,
    `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/worksheets?$select=id,name,position`
  );

  const sheets = Array.isArray(data?.value) ? data.value : [];
  const sheet = sheets.sort(
    (a: any, b: any) => Number(a.position || 0) - Number(b.position || 0)
  )[0];

  if (!sheet?.id || !sheet?.name) {
    throw new Error("Flowex could not find a worksheet in this workbook.");
  }

  return sheet as { id: string; name: string };
}

async function tableColumns(
  accessToken: string,
  workbookId: string,
  tableId: string
) {
  const data = await graphFetch(
    accessToken,
    `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/tables/${encodeURIComponent(tableId)}/columns?$select=id,name,index`
  );

  return Array.isArray(data?.value) ? data.value : [];
}

async function prepareExistingWorkbook(
  accessToken: string,
  workbookId: string,
  desired: DesiredColumn[],
  mutate: boolean
) {
  const info = await workbookInfo(accessToken, workbookId);
  const tables = await listTables(accessToken, workbookId);

  if (tables.length > 0) {
    const table = tables[0];
    const columns = await tableColumns(
      accessToken,
      workbookId,
      String(table.id)
    );

    const existingHeaders = columns.map((column: any) =>
      String(column.name || "").trim()
    );

    const resolved = resolveColumns(existingHeaders, desired);

    if (mutate && resolved.headers.length > existingHeaders.length) {
      const missingHeaders = resolved.headers.slice(existingHeaders.length);

      for (const header of missingHeaders) {
        await graphFetch(
          accessToken,
          `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/tables/${encodeURIComponent(String(table.id))}/columns/add`,
          {
            method: "POST",
            body: JSON.stringify({ name: header }),
          }
        );
      }
    }

    return {
      workbook: info,
      tableId: String(table.id),
      tableName: String(table.name || "FlowexLeads"),
      headers: resolved.headers,
      columnKeys: resolved.keys,
    };
  }

  const sheet = await firstWorksheet(accessToken, workbookId);

  let usedValues: unknown[][] = [];
  let rowCount = 1;

  try {
    const used = await graphFetch(
      accessToken,
      `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/worksheets/${encodeURIComponent(sheet.id)}/usedRange(valuesOnly=true)?$select=values,rowCount,columnCount`
    );

    usedValues = Array.isArray(used?.values) ? used.values : [];
    rowCount =
      typeof used?.rowCount === "number"
        ? Math.max(1, used.rowCount)
        : Math.max(1, usedValues.length);
  } catch {
    usedValues = [];
    rowCount = 1;
  }

  const existingHeaders =
    Array.isArray(usedValues[0])
      ? usedValues[0].map((value) => String(value ?? "").trim())
      : [];

  const cleanedHeaders =
    existingHeaders.some(Boolean)
      ? existingHeaders
      : [];

  const resolved = resolveColumns(cleanedHeaders, desired);

  if (mutate) {
    const lastColumn = columnLetters(resolved.headers.length);
    const rangeAddress = `A1:${lastColumn}1`;

    await graphFetch(
      accessToken,
      `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/worksheets/${encodeURIComponent(sheet.id)}/range(address='${encodeURIComponent(rangeAddress)}')`,
      {
        method: "PATCH",
        body: JSON.stringify({ values: [resolved.headers] }),
      }
    );

    const tableEndRow = Math.max(2, rowCount);
    const tableAddress = `A1:${lastColumn}${tableEndRow}`;

    const table = await graphFetch(
      accessToken,
      `/me/drive/items/${encodeURIComponent(workbookId)}/workbook/worksheets/${encodeURIComponent(sheet.id)}/tables/add`,
      {
        method: "POST",
        body: JSON.stringify({
          address: tableAddress,
          hasHeaders: true,
        }),
      }
    );

    return {
      workbook: info,
      tableId: String(table.id),
      tableName: String(table.name || "FlowexLeads"),
      headers: resolved.headers,
      columnKeys: resolved.keys,
    };
  }

  return {
    workbook: info,
    tableId: "",
    tableName: "",
    headers: resolved.headers,
    columnKeys: resolved.keys,
  };
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

    if (action === "list_workbooks") {
      const rootData = await graphFetch(
        accessToken,
        `/me/drive/root/children?$select=id,name,webUrl,file,folder&$top=999`
      );

      let searchItems: any[] = [];

      try {
        const searchData = await graphFetch(
          accessToken,
          `/me/drive/root/search(q='.xlsx')?$select=id,name,webUrl,file&$top=200`
        );

        searchItems = Array.isArray(searchData?.value)
          ? searchData.value
          : [];
      } catch {
        searchItems = [];
      }

      const rootItems = Array.isArray(rootData?.value)
        ? rootData.value
        : [];

      const byId = new Map<string, any>();

      for (const item of [...rootItems, ...searchItems]) {
        if (
          typeof item?.id !== "string" ||
          typeof item?.name !== "string" ||
          !item.name.toLowerCase().endsWith(".xlsx")
        ) {
          continue;
        }

        byId.set(item.id, item);
      }

      const workbooks = Array.from(byId.values())
        .sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          webUrl: item.webUrl || null,
        }));

      return NextResponse.json({
        workbooks,
        email,
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
        .eq("provider", "excel");

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
            "Create or connect the lead form first so Flowex knows which columns to build.",
        },
        { status: 422 }
      );
    }

    if (action === "create_new") {
      let displayName =
        typeof body.displayName === "string"
          ? body.displayName.trim().slice(0, 80)
          : "";

      if (!displayName) {
        return NextResponse.json(
          { error: "Give the workbook a name first." },
          { status: 400 }
        );
      }

      if (!displayName.toLowerCase().endsWith(".xlsx")) {
        displayName += ".xlsx";
      }

      const uploadResponse = await fetch(
        `${MICROSOFT_GRAPH_URL}/me/drive/root:/${encodeURIComponent(displayName)}:/content`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
          body: Buffer.from(BLANK_XLSX_BASE64, "base64"),
          cache: "no-store",
        }
      );

      const uploadText = await uploadResponse.text();
      let workbook: any = {};

      try {
        workbook = uploadText ? JSON.parse(uploadText) : {};
      } catch {
        workbook = {};
      }

      if (!uploadResponse.ok || !workbook?.id) {
        throw new Error(
          workbook?.error?.message ||
            "Microsoft could not create the workbook."
        );
      }

      const prepared = await prepareExistingWorkbook(
        accessToken,
        String(workbook.id),
        desired,
        true
      );

      return NextResponse.json({
        ready: true,
        mode: "create_new",
        createdByFlowex: true,
        workbookId: String(workbook.id),
        workbookName: String(workbook.name || displayName),
        workbookUrl: String(workbook.webUrl || ""),
        tableId: prepared.tableId,
        tableName: prepared.tableName,
        headers: prepared.headers,
        columnKeys: prepared.columnKeys,
      });
    }

    const workbookId =
      typeof body.workbookId === "string"
        ? body.workbookId.trim()
        : "";

    if (!workbookId) {
      return NextResponse.json(
        { error: "Choose an Excel workbook first." },
        { status: 400 }
      );
    }

    if (action === "verify_existing") {
      const prepared = await prepareExistingWorkbook(
        accessToken,
        workbookId,
        desired,
        false
      );

      return NextResponse.json({
        verified: true,
        workbookId,
        workbookName: prepared.workbook.name || "",
        workbookUrl: prepared.workbook.webUrl || "",
        tableId: prepared.tableId,
        tableName: prepared.tableName,
        headers: prepared.headers,
        columnKeys: prepared.columnKeys,
      });
    }

    if (action === "trash_created") {
      await graphFetch(
        accessToken,
        `/me/drive/items/${encodeURIComponent(workbookId)}`,
        { method: "DELETE" }
      );

      const { data: current } = await auth.supabase
        .from("lead_destinations")
        .select("config")
        .eq("lead_flow_id", leadFlowId)
        .eq("user_id", auth.user.id)
        .eq("provider", "excel")
        .maybeSingle();

      const config =
        current?.config &&
        typeof current.config === "object"
          ? (current.config as Record<string, unknown>)
          : null;

      if (
        config?.workbook_id === workbookId &&
        config?.created_by_flowex === true
      ) {
        await auth.supabase
          .from("lead_destinations")
          .delete()
          .eq("lead_flow_id", leadFlowId)
          .eq("user_id", auth.user.id)
          .eq("provider", "excel");
      }

      return NextResponse.json({ deleted: true });
    }

    if (action === "commit") {
      const mode =
        body.mode === "existing"
          ? "existing"
          : "create_new";

      const createdByFlowex =
        body.createdByFlowex === true;

      const prepared = await prepareExistingWorkbook(
        accessToken,
        workbookId,
        desired,
        true
      );

      const displayName =
        typeof body.displayName === "string" && body.displayName.trim()
          ? body.displayName.trim().slice(0, 80)
          : String(prepared.workbook.name || "Flowex Leads");

      const { error } = await auth.supabase
        .from("lead_destinations")
        .upsert(
          {
            user_id: auth.user.id,
            lead_flow_id: leadFlowId,
            provider: "excel",
            mode,
            display_name: displayName,
            connected: true,
            config: {
              workbook_id: workbookId,
              workbook_name: prepared.workbook.name || displayName,
              workbook_url: prepared.workbook.webUrl || "",
              table_id: prepared.tableId,
              table_name: prepared.tableName,
              headers: prepared.headers,
              column_keys: prepared.columnKeys,
              created_by_flowex: createdByFlowex,
              microsoft_email: email,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "lead_flow_id" }
        );

      if (error) {
        throw new Error(
          "Excel is ready, but Flowex could not save this destination."
        );
      }

      return NextResponse.json({
        connected: true,
        workbookId,
        workbookName: prepared.workbook.name || displayName,
        workbookUrl: prepared.workbook.webUrl || "",
        tableId: prepared.tableId,
        tableName: prepared.tableName,
        headers: prepared.headers,
        columnKeys: prepared.columnKeys,
      });
    }

    return NextResponse.json(
      { error: "Unsupported Microsoft Excel action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Flowex Microsoft Excel destination error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Flowex could not update Microsoft Excel.",
      },
      { status: 500 }
    );
  }
}
