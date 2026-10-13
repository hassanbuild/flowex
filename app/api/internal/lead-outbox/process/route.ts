import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { OutboxDeliveryError, deliverLeadOutboxAction } from "@/lib/leads/outbox-delivery";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 5;
const MAX_ATTEMPTS = 12;
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  const expected = Buffer.from(secret, "utf8");
  const provided = Buffer.from(authorization.slice(7).trim(), "utf8");
  return expected.byteLength >= 32 && provided.byteLength === expected.byteLength && timingSafeEqual(provided, expected);
}

function retryDelay(attempt: number) {
  const base = Math.min(30_000 * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);
  return Math.round(base * (0.8 + Math.random() * 0.4));
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = createAdminClient();
  const { data: actions, error } = await supabase.rpc("claim_due_lead_outbox", { p_limit: BATCH_SIZE });
  if (error) {
    console.error("Flowex lead outbox claim failed:", { code: error.code || "unknown" });
    return NextResponse.json({ success: false, error: "Outbox claim failed." }, { status: 500 });
  }

  let succeeded = 0;
  let retried = 0;
  let blocked = 0;
  for (const action of actions || []) {
    let failureCode = "delivery_failed";
    let retryable = true;
    try {
      await deliverLeadOutboxAction(action);
      const { error: settleError } = await supabase.from("lead_outbox").update({
        status: "succeeded", completed_at: new Date().toISOString(), claim_token: null, claimed_at: null,
        last_error_code: null, updated_at: new Date().toISOString(),
      }).eq("id", action.id).eq("status", "processing").eq("claim_token", action.claim_token);
      if (settleError) {
        console.error("Flowex lead outbox success settlement failed:", {
          eventId: action.id, leadId: action.lead_id, provider: action.provider,
          attempt: action.attempts, code: settleError.code || "unknown",
        });
        continue;
      }
      succeeded += 1;
    } catch (error) {
      if (error instanceof OutboxDeliveryError) {
        failureCode = error.code;
        retryable = error.retryable;
      } else if (error instanceof TypeError) {
        failureCode = "network_error";
      }
      const shouldRetry = retryable && action.attempts < MAX_ATTEMPTS;
      const safeFailureCode = failureCode.slice(0, 100).toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
      const update = shouldRetry
        ? {
            status: "pending",
            next_attempt_at: new Date(Date.now() + retryDelay(action.attempts)).toISOString(),
            claim_token: null,
            claimed_at: null,
            completed_at: null,
            last_error_code: safeFailureCode,
            updated_at: new Date().toISOString(),
          }
        : {
            status: "blocked",
            claim_token: null,
            claimed_at: null,
            completed_at: new Date().toISOString(),
            last_error_code: safeFailureCode,
            updated_at: new Date().toISOString(),
          };
      const { error: settleError } = await supabase.from("lead_outbox").update(update)
        .eq("id", action.id).eq("status", "processing").eq("claim_token", action.claim_token);
      if (!settleError) {
        if (shouldRetry) retried += 1;
        else blocked += 1;
        console.error("Flowex lead outbox delivery failed:", {
          eventId: action.id, leadId: action.lead_id, provider: action.provider,
          attempt: action.attempts, retryable, status: shouldRetry ? "retrying" : "blocked",
          reason: safeFailureCode,
        });
      } else {
        console.error("Flowex lead outbox failure settlement failed:", {
          eventId: action.id, leadId: action.lead_id, provider: action.provider,
          attempt: action.attempts, code: settleError.code || "unknown",
        });
      }
    }
  }

  return NextResponse.json({ success: true, claimed: actions?.length || 0, succeeded, retried, blocked });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rawBody = await request.text();
  if (rawBody.length > 4096) return NextResponse.json({ error: "Replay request is too large." }, { status: 413 });
  let body: { eventIds?: unknown; confirmPossibleDuplicate?: unknown } | null;
  try {
    body = JSON.parse(rawBody || "null");
  } catch {
    return NextResponse.json({ error: "Invalid replay request." }, { status: 400 });
  }
  const eventIds = Array.isArray(body?.eventIds) ? [...new Set(body.eventIds)] : [];
  if (
    body?.confirmPossibleDuplicate !== true ||
    eventIds.length < 1 || eventIds.length > BATCH_SIZE ||
    eventIds.some((id) => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
  ) {
    return NextResponse.json({ error: "Provide 1–5 eventIds and confirmPossibleDuplicate: true." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: candidates, error: lookupError } = await supabase.from("lead_outbox")
    .select("id,attempts").in("id", eventIds as string[]).eq("status", "blocked");
  if (lookupError) {
    console.error("Flowex lead outbox replay lookup failed:", { code: lookupError.code || "unknown" });
    return NextResponse.json({ error: "Could not identify blocked outbox events." }, { status: 500 });
  }
  const previousAttempts = new Map((candidates || []).map((event) => [event.id, event.attempts]));
  const { data, error } = await supabase.from("lead_outbox").update({
    status: "pending", attempts: 0, next_attempt_at: new Date().toISOString(),
    claim_token: null, claimed_at: null, completed_at: null, updated_at: new Date().toISOString(),
  }).in("id", eventIds as string[]).eq("status", "blocked")
    .select("id,lead_id,provider,attempts,last_error_code");

  if (error) {
    console.error("Flowex lead outbox replay failed:", { code: error.code || "unknown" });
    return NextResponse.json({ error: "Could not replay blocked outbox events." }, { status: 500 });
  }

  for (const event of data || []) {
    console.warn("Flowex lead outbox event replayed:", {
      eventId: event.id, leadId: event.lead_id, provider: event.provider,
      previousAttempts: previousAttempts.get(event.id) ?? null,
      attempt: 0, previousReason: event.last_error_code,
    });
  }
  return NextResponse.json({ replayed: data?.length || 0, eventIds: (data || []).map((event) => event.id) });
}
