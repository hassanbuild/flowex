import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function requirePremiumAccess(userId: string) {
  const { data, error } = await createAdminClient()
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Flowex subscription access check error:", error.message);
    return NextResponse.json(
      { error: "Flowex could not verify access." },
      { status: 500 }
    );
  }

  if (data?.plan !== "trial" && data?.plan !== "pro") {
    return NextResponse.json(
      { error: "This feature requires Flowex Pro." },
      { status: 403 }
    );
  }

  return null;
}
