import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const lemonApiKey = process.env.LEMONSQUEEZY_API_KEY;
const lemonStoreId = process.env.LEMONSQUEEZY_STORE_ID;
const monthlyVariantId = process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID;
const annualVariantId = process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID;

type BillingInterval = "monthly" | "annual";

export async function POST(request: NextRequest) {
  try {
    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey ||
      !lemonApiKey ||
      !lemonStoreId ||
      !monthlyVariantId ||
      !annualVariantId
    ) {
      return NextResponse.json(
        { error: "Billing is not configured correctly." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length);

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const interval = body?.interval as BillingInterval;

    if (interval !== "monthly" && interval !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing interval." },
        { status: 400 }
      );
    }

    const variantId =
      interval === "monthly"
        ? monthlyVariantId
        : annualVariantId;

    const checkoutResponse = await fetch(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${lemonApiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: user.email ?? undefined,
                custom: {
                  user_id: user.id,
                  billing_interval: interval,
                },
              },
              product_options: {
                redirect_url:
                  "https://flowex-snowy.vercel.app/dashboard",
              },
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: lemonStoreId,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        }),
      }
    );

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error(
        "Lemon Squeezy checkout error:",
        checkoutData
      );

      return NextResponse.json(
        { error: "Could not create checkout." },
        { status: 500 }
      );
    }

    const checkoutUrl =
      checkoutData?.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout URL was not returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: checkoutUrl,
    });
  } catch (error) {
    console.error("Flowex billing checkout error:", error);

    return NextResponse.json(
      { error: "Could not create checkout." },
      { status: 500 }
    );
  }
}