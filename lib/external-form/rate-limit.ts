import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 60 * 1000;
const LIMIT = 10;

export async function consumeExternalFormBrowserCheck(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const windowStart = new Date(
    Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS
  ).toISOString();

  const { data, error } = await supabase.rpc(
    "check_external_form_browser_limit",
    {
      p_user_id: userId,
      p_window_start: windowStart,
      p_limit: LIMIT,
    }
  );

  if (error) {
    return { allowed: false, failed: true };
  }

  return { allowed: data === true, failed: false };
}
