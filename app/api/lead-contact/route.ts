import {
  hashContactActionToken,
  isContactActionToken,
} from "@/lib/leads/contact-action";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function confirmationPage(token: string) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm lead contacted</title></head><body style="font-family:Arial,sans-serif;max-width:520px;margin:12vh auto;padding:24px;color:#172033"><h1>Mark this lead as contacted?</h1><p>Confirming will stop future automated follow-up emails for this lead.</p><form method="post" action="/api/lead-contact"><input type="hidden" name="token" value="${token}"><button type="submit" style="background:#2563eb;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-size:16px;cursor:pointer">Confirm Contacted</button></form></body></html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; form-action 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      },
    }
  );
}

function resultPage(message: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flowex</title></head><body style="font-family:Arial,sans-serif;max-width:520px;margin:12vh auto;padding:24px;color:#172033"><h1>${message}</h1><p>You can close this page.</p></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      },
    }
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";

  if (!isContactActionToken(token)) {
    return resultPage("This Contacted link is invalid or has expired.", 400);
  }

  return confirmationPage(token);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > 2048) {
    return resultPage("This Contacted request is invalid.", 413);
  }

  let token = "";

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData().catch(() => null);
    const value = form?.get("token");
    token = typeof value === "string" ? value : "";
  } else if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as { token?: unknown } | null;
    token = typeof body?.token === "string" ? body.token : "";
  }

  if (!isContactActionToken(token)) {
    return resultPage("This Contacted link is invalid or has expired.", 400);
  }

  const { data, error } = await createAdminClient().rpc(
    "mark_lead_contacted_with_token",
    { p_token_hash: hashContactActionToken(token) }
  );

  if (error) {
    console.error("Flowex Contacted action failed:", error.message);
    return resultPage("Flowex could not update this lead. Please try again.", 503);
  }

  if (data !== true) {
    return resultPage("This Contacted link is invalid or has expired.", 400);
  }

  return resultPage("This lead is marked as contacted. Future follow-ups are stopped.");
}
