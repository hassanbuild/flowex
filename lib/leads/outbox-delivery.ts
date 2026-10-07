import "server-only";

import { google } from "googleapis";
import { createGoogleOAuthClient } from "@/lib/integrations/google";
import { AIRTABLE_API_URL, AIRTABLE_PROVIDER, AIRTABLE_TOKEN_URL, getAirtableOAuthConfig } from "@/lib/integrations/airtable";
import { HUBSPOT_API_URL, HUBSPOT_PROVIDER, HUBSPOT_TOKEN_URL, getHubSpotOAuthConfig } from "@/lib/integrations/hubspot";
import { MICROSOFT_GRAPH_URL, MICROSOFT_PROVIDER, MICROSOFT_SCOPES, MICROSOFT_TOKEN_URL, getMicrosoftOAuthConfig } from "@/lib/integrations/microsoft";
import { NOTION_API_URL, NOTION_PROVIDER, NOTION_VERSION } from "@/lib/integrations/notion";
import { encryptOAuthCredentials, readOAuthCredentials } from "@/lib/integrations/oauth-credentials";
import { createStableContactActionUrl } from "@/lib/leads/contact-action";
import { sendNotificationEmail } from "@/lib/integrations/resend";
import { createAdminClient } from "@/lib/supabase/admin";

type Lead = {
  id: string;
  user_id: string;
  lead_flow_id: string;
  source_id: string;
  email: string | null;
  phone: string | null;
  fields: Record<string, string | number | boolean>;
  created_at: string;
};

type OutboxAction = {
  id: string;
  lead_id: string;
  provider: string;
  action_type: string;
  action_snapshot: Record<string, unknown>;
};

export class OutboxDeliveryError extends Error {
  constructor(public readonly code: string, public readonly retryable: boolean) {
    super(code);
  }
}

function fail(code: string, retryable = false): never {
  throw new OutboxDeliveryError(code, retryable);
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value : "";
}

function statusError(status: number, provider: string): never {
  fail(`${provider}_${status}`, status === 429 || status >= 500);
}

async function providerJson(response: Response, provider: string) {
  if (!response.ok) statusError(response.status, provider);
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

async function getLead(supabase: ReturnType<typeof createAdminClient>, leadId: string): Promise<Lead> {
  const { data, error } = await supabase.from("leads")
    .select("id,user_id,lead_flow_id,source_id,email,phone,fields,created_at")
    .eq("id", leadId).maybeSingle();
  if (error) fail("lead_lookup_failed", true);
  if (!data) fail("lead_missing");
  return data as Lead;
}

async function getConnection(supabase: ReturnType<typeof createAdminClient>, userId: string, provider: string) {
  const { data, error } = await supabase.from("integration_connections")
    .select("credentials,provider_account_email")
    .eq("user_id", userId).eq("provider", provider).maybeSingle();
  if (error) fail("connection_lookup_failed", true);
  if (!data?.credentials) fail("integration_not_connected");
  try {
    return { credentials: readOAuthCredentials(data.credentials), email: string(data.provider_account_email) };
  } catch {
    fail("credentials_unavailable");
  }
}

async function saveCredentials(supabase: ReturnType<typeof createAdminClient>, userId: string, provider: string, credentials: Record<string, unknown>) {
  const { error } = await supabase.from("integration_connections").update({
    credentials: encryptOAuthCredentials(credentials), updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("provider", provider);
  if (error) fail("credential_refresh_persist_failed", true);
}

async function refreshToken(supabase: ReturnType<typeof createAdminClient>, userId: string, provider: string) {
  const connection = await getConnection(supabase, userId, provider);
  const credentials = connection.credentials;
  const accessToken = string(credentials.access_token);
  const expires = typeof credentials.expires_at === "string" ? Date.parse(credentials.expires_at) : 0;
  if (accessToken && (!expires || expires > Date.now() + 60_000)) return accessToken;
  const refresh = string(credentials.refresh_token);
  if (!refresh) fail("refresh_token_missing");

  let url = "";
  let params: Record<string, string> = { grant_type: "refresh_token", refresh_token: refresh };
  let headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (provider === AIRTABLE_PROVIDER) {
    const { clientId, clientSecret } = getAirtableOAuthConfig();
    url = AIRTABLE_TOKEN_URL;
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  } else if (provider === MICROSOFT_PROVIDER) {
    const config = getMicrosoftOAuthConfig();
    url = MICROSOFT_TOKEN_URL;
    params = { ...params, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, scope: MICROSOFT_SCOPES.join(" ") };
  } else if (provider === HUBSPOT_PROVIDER) {
    const config = getHubSpotOAuthConfig();
    url = HUBSPOT_TOKEN_URL;
    params = { ...params, client_id: config.clientId, client_secret: config.clientSecret };
  } else {
    fail("refresh_not_supported");
  }

  const response = await fetch(url, { method: "POST", headers, body: new URLSearchParams(params), cache: "no-store" });
  if (!response.ok) statusError(response.status, `${provider}_refresh`);
  const token = await response.json().catch(() => null) as { access_token?: string; refresh_token?: string; expires_in?: number } | null;
  if (!token?.access_token) fail(`${provider}_refresh_invalid`, true);
  const updated = {
    ...credentials,
    access_token: token.access_token,
    refresh_token: token.refresh_token || refresh,
    expires_in: token.expires_in || null,
    expires_at: typeof token.expires_in === "number" ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
  };
  await saveCredentials(supabase, userId, provider, updated);
  return token.access_token;
}

async function googleClient(supabase: ReturnType<typeof createAdminClient>, userId: string, provider: "google_sheets" | "google_email") {
  const connection = await getConnection(supabase, userId, provider);
  const client = createGoogleOAuthClient();
  client.setCredentials(connection.credentials);
  client.on("tokens", async (tokens) => {
    if (!tokens.access_token && !tokens.refresh_token) return;
    await saveCredentials(supabase, userId, provider, {
      ...connection.credentials, ...tokens,
      refresh_token: tokens.refresh_token || connection.credentials.refresh_token,
    });
  });
  return { client, email: connection.email };
}

function leadValue(lead: Lead, key: string, displayName: string) {
  if (key === "__name") return displayName;
  if (key === "__date" || key === "__captured_at") return lead.created_at;
  if (key === "__lead_date") return new Date(lead.created_at).getTime() / 86400000 + 25569;
  if (key === "__email") return lead.email || "";
  if (key === "__phone") return lead.phone || "";
  return lead.fields?.[key] ?? "";
}

async function deliverSheets(supabase: ReturnType<typeof createAdminClient>, lead: Lead, snapshot: Record<string, unknown>) {
  const spreadsheetId = string(snapshot.spreadsheet_id);
  const keys = Array.isArray(snapshot.column_keys) ? snapshot.column_keys.filter((v): v is string => typeof v === "string") : [];
  if (!spreadsheetId || keys.length === 0) fail("sheets_configuration_invalid");
  const { client } = await googleClient(supabase, lead.user_id, "google_sheets");
  const sheets = google.sheets({ version: "v4", auth: client });
  const title = typeof snapshot.sheet_title === "string" ? string(snapshot.sheet_title) : "Sheet1";
  const result = await sheets.spreadsheets.values.append({
    spreadsheetId, range: `'${title.replace(/'/g, "''")}'!A:ZZ`, valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS", includeValuesInResponse: true,
    requestBody: { values: [keys.map((key) => {
      if (key === "__lead_date" || key === "__captured_at") return new Date(lead.created_at).getTime() / 86400000 + 25569;
      if (key === "__email") return lead.email || "";
      if (key === "__phone") return lead.phone || "";
      return key ? lead.fields?.[key] ?? "" : "";
    })] },
  });
  const tableId = string(snapshot.table_id);
  const match = (result.data.updates?.updatedRange || "").match(/!(?:[A-Z]+)(\d+):/);
  const appendedRow = match?.[1] ? Number(match[1]) : 0;
  if (!tableId || !appendedRow) return;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets(properties(sheetId),tables(tableId,range))" });
  const sheet = spreadsheet.data.sheets?.[0];
  const table = sheet?.tables?.find((entry) => entry.tableId === tableId);
  if (!table || typeof sheet?.properties?.sheetId !== "number" || (table.range?.endRowIndex || 0) >= appendedRow) return;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ updateTable: { table: { ...table, range: { ...table.range, sheetId: sheet.properties.sheetId, endRowIndex: appendedRow } }, fields: "range" } }] } });
}

async function deliverAirtable(supabase: ReturnType<typeof createAdminClient>, lead: Lead, snapshot: Record<string, unknown>) {
  const base = string(snapshot.base_id); const table = string(snapshot.table_id);
  const mapping = object(snapshot.field_mapping);
  if (!base || !table) fail("airtable_configuration_invalid");
  const token = await refreshToken(supabase, lead.user_id, AIRTABLE_PROVIDER);
  const fields: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(mapping)) {
    const fieldName = string(object(raw).fieldName);
    if (!fieldName) continue;
    if (key === "__email" && !lead.email) continue;
    if (key === "__phone" && !lead.phone) continue;
    if (!key.startsWith("__") && lead.fields?.[key] === undefined) continue;
    fields[fieldName] = leadValue(lead, key, string(snapshot.display_name));
  }
  const response = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(base)}/${encodeURIComponent(table)}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records: [{ fields }], typecast: true }), cache: "no-store",
  });
  await providerJson(response, "airtable");
}

async function deliverExcel(supabase: ReturnType<typeof createAdminClient>, lead: Lead, snapshot: Record<string, unknown>) {
  const workbook = string(snapshot.workbook_id); const table = string(snapshot.table_id);
  const keys = Array.isArray(snapshot.column_keys) ? snapshot.column_keys.filter((v): v is string => typeof v === "string") : [];
  if (!workbook || !table || !keys.length) fail("excel_configuration_invalid");
  const token = await refreshToken(supabase, lead.user_id, MICROSOFT_PROVIDER);
  const response = await fetch(`${MICROSOFT_GRAPH_URL}/me/drive/items/${encodeURIComponent(workbook)}/workbook/tables/${encodeURIComponent(table)}/rows/add`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [keys.map((key) => leadValue(lead, key, string(snapshot.display_name)))] }), cache: "no-store",
  });
  await providerJson(response, "excel");
}

function notionValue(type: string, raw: unknown): unknown {
  const value = String(raw ?? "").trim().slice(0, 2000);
  if (type === "title" || type === "rich_text") return { [type]: value ? [{ type: "text", text: { content: value } }] : [] };
  if (type === "number") { const number = typeof raw === "number" ? raw : Number(value); return { number: Number.isFinite(number) ? number : null }; }
  if (type === "select") return { select: value ? { name: value.replace(/,/g, " -").slice(0, 100) } : null };
  if (type === "date") return { date: value ? { start: value } : null };
  if (type === "url") return { url: value || null };
  if (type === "email") return { email: value || null };
  if (type === "phone_number") return { phone_number: value || null };
  if (type === "checkbox") return { checkbox: raw === true || ["true", "1", "yes"].includes(value.toLowerCase()) };
  return { rich_text: value ? [{ type: "text", text: { content: value } }] : [] };
}

async function deliverNotion(supabase: ReturnType<typeof createAdminClient>, lead: Lead, snapshot: Record<string, unknown>) {
  const database = string(snapshot.database_id); const dataSource = string(snapshot.data_source_id);
  const map = object(snapshot.property_map); const types = object(snapshot.property_types);
  if ((!database && !dataSource) || !Object.keys(map).length) fail("notion_configuration_invalid");
  const { credentials } = await getConnection(supabase, lead.user_id, NOTION_PROVIDER);
  const token = string(credentials.access_token);
  if (!token) fail("notion_access_token_missing");
  const properties: Record<string, unknown> = {};
  for (const [key, rawName] of Object.entries(map)) {
    if (typeof rawName !== "string" || !rawName) continue;
    properties[rawName] = notionValue(string(types[key]) || "rich_text", leadValue(lead, key, string(snapshot.display_name)));
  }
  const create = (parent: Record<string, string>) => fetch(`${NOTION_API_URL}/pages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
    body: JSON.stringify({ parent, properties }), cache: "no-store",
  });
  let response = dataSource ? await create({ type: "data_source_id", data_source_id: dataSource }) : await create({ type: "database_id", database_id: database });
  if (!response.ok && dataSource && database) response = await create({ type: "database_id", database_id: database });
  await providerJson(response, "notion");
}

function splitName(value: unknown) {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstname: parts[0] || "", lastname: parts.slice(1).join(" ") };
}

async function deliverHubSpot(supabase: ReturnType<typeof createAdminClient>, lead: Lead, snapshot: Record<string, unknown>) {
  const map = object(snapshot.field_map);
  const token = await refreshToken(supabase, lead.user_id, HUBSPOT_PROVIDER);
  const properties: Record<string, string> = {};
  for (const [key, raw] of Object.entries(map)) {
    const mapping = object(raw); const property = string(mapping.property);
    if (!property) continue;
    const value = lead.fields?.[key] ?? "";
    if (string(mapping.kind) === "full_name") {
      const name = splitName(value);
      if (name.firstname) properties[property] = name.firstname;
      const secondary = string(mapping.secondary);
      if (secondary && name.lastname) properties[secondary] = name.lastname;
    } else {
      const finalValue = String(value).trim();
      if (property === "email" && lead.email) properties[property] = lead.email;
      else if (property === "phone" && lead.phone) properties[property] = lead.phone;
      else if (finalValue) properties[property] = finalValue;
    }
  }
  if (lead.email && !properties.email) properties.email = lead.email;
  if (lead.phone && !properties.phone) properties.phone = lead.phone;
  if (Object.keys(properties).length === 0) fail("hubspot_mapping_empty");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (lead.email) {
    const search = await fetch(`${HUBSPOT_API_URL}/crm/objects/2026-03/contacts/search`, { method: "POST", headers, body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: lead.email }] }], properties: ["email"], limit: 1 }), cache: "no-store" });
    const found = await providerJson(search, "hubspot_search");
    const results = Array.isArray(found.results) ? found.results as Array<{ id?: string }> : [];
    if (results[0]?.id) {
      const update = await fetch(`${HUBSPOT_API_URL}/crm/objects/2026-03/contacts/${encodeURIComponent(results[0].id)}`, { method: "PATCH", headers, body: JSON.stringify({ properties }), cache: "no-store" });
      await providerJson(update, "hubspot"); return;
    }
  }
  const response = await fetch(`${HUBSPOT_API_URL}/crm/objects/2026-03/contacts`, { method: "POST", headers, body: JSON.stringify({ properties }), cache: "no-store" });
  await providerJson(response, "hubspot");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

async function sendGmail(supabase: ReturnType<typeof createAdminClient>, lead: Lead, action: OutboxAction, input: { to: string; subject: string; text: string; htmlBody?: string }) {
  let connection: { client: ReturnType<typeof createGoogleOAuthClient>; email: string } | null = null;
  for (const provider of ["google_email", "google_sheets"] as const) {
    try {
      const result = await googleClient(supabase, lead.user_id, provider);
      if (result.email) { connection = result; break; }
    } catch { /* Preserve the existing Google Email then Sheets fallback. */ }
  }
  if (!connection) fail("gmail_not_connected");
  const gmail = google.gmail({ version: "v1", auth: connection.client });
  const messageId = `<flowex-outbox-${action.id}@flowex.app>`;
  const existing = await gmail.users.messages.list({ userId: "me", q: `rfc822msgid:${messageId.slice(1, -1)}`, maxResults: 1 });
  if (existing.data.messages?.length) return;
  const isHtml = typeof input.htmlBody === "string";
  const body = input.htmlBody ?? input.text;
  const headers = [
    `From: ${connection.email}`, `To: ${input.to}`, `Reply-To: ${connection.email}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`,
    `Message-ID: ${messageId}`, "MIME-Version: 1.0",
    `Content-Type: ${isHtml ? 'text/html; charset="UTF-8"' : 'text/plain; charset="UTF-8"'}`,
    "Content-Transfer-Encoding: base64", "", Buffer.from(body, "utf8").toString("base64"),
  ].join("\r\n");
  await gmail.users.messages.send({ userId: "me", requestBody: { raw: Buffer.from(headers, "utf8").toString("base64url") } });
}

async function deliverReply(supabase: ReturnType<typeof createAdminClient>, lead: Lead, action: OutboxAction) {
  if (!lead.email) fail("reply_email_missing");
  const snapshot = action.action_snapshot;
  const message = string(snapshot.message).trim();
  if (!message) fail("reply_configuration_invalid");
  await sendGmail(supabase, lead, action, { to: lead.email, subject: string(snapshot.subject) || "Thanks for reaching out", text: message });
}

async function deliverTeamNotification(supabase: ReturnType<typeof createAdminClient>, lead: Lead, action: OutboxAction) {
  const snapshot = action.action_snapshot;
  const recipient = string(snapshot.recipient).trim(); const flowName = string(snapshot.flow_name) || "Lead Flow";
  const origin = string(snapshot.origin);
  if (!recipient || !origin) fail("notification_configuration_invalid");
  const actionUrl = await createStableContactActionUrl({
    supabase, leadId: lead.id, outboxId: action.id, userId: lead.user_id, origin,
    expiresAt: new Date(Date.parse(lead.created_at) + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const submitted = Object.entries(lead.fields || {}).map(([key, value]) => `${key}: ${String(value)}`).join("\n");
  const message = ["A new lead has been captured by Flowex.", "", `Lead Flow: ${flowName}`, `Received: ${lead.created_at}`, "", submitted || "No lead fields were provided.", "", "This notification was sent automatically by Flowex."].join("\n");
  const subject = `New lead — ${flowName}`;
  const text = `${message}\n\nContacted? Mark this lead here: ${actionUrl}`;
  const html = `${escapeHtml(message).replace(/\r?\n/g, "<br>")}<p style="margin-top:24px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Contacted</a></p>`;
  try {
    await sendNotificationEmail({ to: recipient, subject, text, html, idempotencyKey: `flowex-outbox-${action.id}` });
  } catch {
    await sendGmail(supabase, lead, action, { to: recipient, subject, text, htmlBody: html });
  }
}

export async function deliverLeadOutboxAction(action: OutboxAction) {
  const supabase = createAdminClient();
  const lead = await getLead(supabase, action.lead_id);
  const snapshot = object(action.action_snapshot);
  if (action.action_type === "destination_write") {
    if (action.provider === "sheets") return deliverSheets(supabase, lead, snapshot);
    if (action.provider === "airtable") return deliverAirtable(supabase, lead, snapshot);
    if (action.provider === "excel") return deliverExcel(supabase, lead, snapshot);
    if (action.provider === "notion") return deliverNotion(supabase, lead, snapshot);
    if (action.provider === "hubspot") return deliverHubSpot(supabase, lead, snapshot);
  }
  if (action.action_type === "automatic_reply" && action.provider === "gmail") return deliverReply(supabase, lead, action);
  if (action.action_type === "team_notification" && action.provider === "resend") return deliverTeamNotification(supabase, lead, action);
  fail("unsupported_outbox_action");
}
