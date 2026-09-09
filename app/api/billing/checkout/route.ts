import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const lemonApiKey = process.env.LEMONSQUEEZY_API_KEY;
const lemonStoreId = process.env.LEMONSQUEEZY_STORE_ID;
const lemonMonthlyVariantId = process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID;
const lemonAnnualVariantId = process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID;

type BillingInterval = "monthly" | "annual";

type CheckoutBody = {
  interval?: BillingInterval;
  fullName?: string;
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey ||
      !lemonApiKey ||
      !lemonStoreId ||
      !lemonMonthlyVariantId ||
      !lemonAnnualVariantId
    ) {
      console.error("Flowex billing environment variables are missing.");
      return NextResponse.json(
        { error: "Billing is not configured correctly." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutBody;
    const interval = body.interval;
    const fullName = body.fullName?.trim();
    const email = body.email?.trim();

    if (interval !== "monthly" && interval !== "annual") {
      return NextResponse.json(
        { error: "Choose a valid billing interval." },
        { status: 400 }
      );
    }

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Please enter your name and email." },
        { status: 400 }
      );
    }

    const variantId =
      interval === "annual" ? lemonAnnualVariantId : lemonMonthlyVariantId;

    const lemonResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
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
              email,
              name: fullName,
              custom: {
                user_id: user.id,
                billing_interval: interval,
              },
            },
            product_options: {
              redirect_url: "https://flowex-snowy.vercel.app/dashboard",
              enabled_variants: [Number(variantId)],
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
    });

    const checkoutData = await lemonResponse.json();

    if (!lemonResponse.ok) {
      console.error("Lemon Squeezy checkout error:", checkoutData);
      return NextResponse.json(
        { error: "Could not create checkout." },
        { status: lemonResponse.status }
      );
    }

    const checkoutUrl = checkoutData?.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error("Lemon Squeezy checkout URL missing:", checkoutData);
      return NextResponse.json(
        { error: "Could not create checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Flowex checkout route error:", error);
    return NextResponse.json(
      { error: "Could not create checkout." },
      { status: 500 }
    );
  }
}
