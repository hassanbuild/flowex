import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/integrations/resend";

export const runtime = "nodejs";

const SUPPORT_EMAIL = "syedhasanali548@gmail.com";
const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function consumeRateLimit(request: Request) {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }

  const ip = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";
  const current = rateLimitBuckets.get(ip);

  if (!current || current.resetAt <= now) {
    if (rateLimitBuckets.size >= 10_000) {
      const oldestKey = rateLimitBuckets.keys().next().value;
      if (oldestKey) rateLimitBuckets.delete(oldestKey);
    }
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return jsonError("Unable to send your message.", 403);
  }

  if (!consumeRateLimit(request)) {
    return jsonError("Please wait before sending another message.", 429);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonError("Unable to send your message.", 400);
  }

  const body = await readBody(request);
  if (!body) return jsonError("Unable to send your message.", 400);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    name.length < 1 || name.length > 120 ||
    !isValidEmail(email) ||
    subject.length < 1 || subject.length > 160 || /[\r\n]/.test(subject) ||
    message.length < 1 || message.length > 8000
  ) {
    return jsonError("Please check the required fields and try again.", 400);
  }

  try {
    await sendNotificationEmail({
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Flowex Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("We couldn't send your message right now. Please try again later.", 503);
  }
}
