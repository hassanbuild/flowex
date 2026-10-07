import { createHash, randomBytes } from "node:crypto";

import type { createAdminClient } from "@/lib/supabase/admin";

export async function createContactActionUrl(input: {
  supabase: ReturnType<typeof createAdminClient>;
  leadId: string;
  userId: string;
  origin: string;
  expiresAt: string;
}) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await input.supabase
    .from("lead_contact_action_tokens")
    .delete()
    .lte("expires_at", new Date().toISOString());

  const { error } = await input.supabase
    .from("lead_contact_action_tokens")
    .insert({
      token_hash: tokenHash,
      lead_id: input.leadId,
      user_id: input.userId,
      expires_at: input.expiresAt,
    });

  if (error) {
    throw new Error("Could not create the lead contact action.");
  }

  return new URL(
    `/api/lead-contact?token=${encodeURIComponent(token)}`,
    input.origin
  ).toString();
}

export function hashContactActionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isContactActionToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
