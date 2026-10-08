import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const lemonApiKey = process.env.LEMONSQUEEZY_API_KEY;

type BillingAction = "update_payment_method" | "customer_portal";

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceRoleKey || !lemonApiKey) {
    return NextResponse.json({ error: "Billing is not configured correctly." }, { status: 500 });
  }

  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { action?: BillingAction } | null;
  if (body?.action !== "update_payment_method" && body?.action !== "customer_portal") {
    return NextResponse.json({ error: "Invalid billing action." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("lemon_squeezy_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError || !subscription?.lemon_squeezy_subscription_id) {
    return NextResponse.json({ error: "No active billing subscription was found." }, { status: 404 });
  }

  const lemonResponse = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscription.lemon_squeezy_subscription_id)}`,
    { headers: { Accept: "application/vnd.api+json", Authorization: `Bearer ${lemonApiKey}` }, cache: "no-store" }
  );
  const lemonData = await lemonResponse.json().catch(() => null);
  const url = lemonData?.data?.attributes?.urls?.[body.action];

  if (!lemonResponse.ok || typeof url !== "string") {
    console.error("Flowex could not retrieve a Lemon Squeezy billing URL.", lemonResponse.status);
    return NextResponse.json({ error: "Could not open Lemon Squeezy billing." }, { status: 502 });
  }

  return NextResponse.json({ url });
}
