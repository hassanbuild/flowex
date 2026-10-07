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
  if (error) return NextResponse.json({ success: false, error: "Outbox claim failed." }, { status: 500 });

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
      if (settleError) continue; // Stale-claim recovery will safely retry; provider idempotency is best-effort.
      succeeded += 1;
    } catch (error) {
      if (error instanceof OutboxDeliveryError) {
        failureCode = error.code;
        retryable = error.retryable;
      } else if (error instanceof TypeError) {
        failureCode = "network_error";
      }
      const shouldRetry = retryable && action.attempts < MAX_ATTEMPTS;
      const update = shouldRetry
        ? {
            status: "pending",
            next_attempt_at: new Date(Date.now() + retryDelay(action.attempts)).toISOString(),
            claim_token: null,
            claimed_at: null,
            completed_at: null,
            last_error_code: failureCode.slice(0, 100).toLowerCase().replace(/[^a-z0-9_.-]/g, "_"),
            updated_at: new Date().toISOString(),
          }
        : {
            status: "blocked",
            claim_token: null,
            claimed_at: null,
            completed_at: new Date().toISOString(),
            last_error_code: failureCode.slice(0, 100).toLowerCase().replace(/[^a-z0-9_.-]/g, "_"),
            updated_at: new Date().toISOString(),
          };
      const { error: settleError } = await supabase.from("lead_outbox").update(update)
        .eq("id", action.id).eq("status", "processing").eq("claim_token", action.claim_token);
      if (!settleError) {
        if (shouldRetry) retried += 1;
        else blocked += 1;
      }
    }
  }

  return NextResponse.json({ success: true, claimed: actions?.length || 0, succeeded, retried, blocked });
}
