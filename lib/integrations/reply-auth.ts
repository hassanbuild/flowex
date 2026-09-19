import { createAdminClient } from "@/lib/supabase/admin";
import { requirePremiumAccess } from "@/lib/billing/plan";

export async function authenticateRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization") || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const token =
    authorization.slice(7).trim();

  if (!token) {
    return null;
  }

  const supabase =
    createAdminClient();

  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser(token);

  if (
    error ||
    !user
  ) {
    return null;
  }

  const accessError = await requirePremiumAccess(user.id);

  if (accessError) {
    return { accessError };
  }

  return {
    user,
    supabase,
  };
}
