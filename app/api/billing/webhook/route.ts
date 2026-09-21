import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

type FlowexPlan = "free" | "trial" | "pro";

function getFlowexPlan(
  status: string,
  trialEndsAt: string | null
): FlowexPlan {
  if (status === "expired") {
    return "free";
  }

  if (status === "on_trial") {
    return "trial";
  }

  /*
    A cancelled subscription remains valid until ends_at.

    If the customer cancels during the trial,
    keep them on the trial plan until that period ends.
  */
  if (
    status === "cancelled" &&
    trialEndsAt &&
    new Date(trialEndsAt).getTime() > Date.now()
  ) {
    return "trial";
  }

  /*
    Lemon Squeezy subscriptions should retain access
    while active, cancelled during the paid grace period,
    past_due, unpaid, or paused.

    The subscription_expired event is what removes access.
  */
  if (
    status === "active" ||
    status === "cancelled" ||
    status === "past_due" ||
    status === "unpaid" ||
    status === "paused"
  ) {
    return "pro";
  }

  return "free";
}

export async function POST(request: NextRequest) {
  try {
    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey ||
      !webhookSecret
    ) {
      console.error("Flowex webhook environment is not configured.");

      return NextResponse.json(
        { error: "Webhook is not configured." },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature." },
        { status: 401 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    const eventName =
      payload?.meta?.event_name;

    /*
      We only sync subscription-object events here.

      Payment events contain invoice data rather than
      the Subscription object, so the subscription state
      itself remains the source of truth.
    */
    const supportedEvents = new Set([
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_resumed",
      "subscription_expired",
      "subscription_paused",
      "subscription_unpaused",
    ]);

    if (!supportedEvents.has(eventName)) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const subscriptionId =
      payload?.data?.id?.toString();

    const attributes =
      payload?.data?.attributes;

    if (!subscriptionId || !attributes) {
      return NextResponse.json(
        { error: "Invalid subscription payload." },
        { status: 400 }
      );
    }

    const customData =
      payload?.meta?.custom_data ?? {};

    let userId =
      typeof customData.user_id === "string"
        ? customData.user_id
        : null;

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

    /*
      Later subscription webhooks normally carry the
      custom checkout data too.

      As an extra safeguard, if user_id is ever absent,
      recover the Flowex user from the stored Lemon
      Squeezy subscription ID.
    */
    if (!userId) {
      const {
        data: existingSubscription,
        error: lookupError,
      } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq(
          "lemon_squeezy_subscription_id",
          subscriptionId
        )
        .maybeSingle();

      if (lookupError) {
        console.error(
          "Flowex subscription lookup error:",
          lookupError.message
        );
      }

      userId =
        existingSubscription?.user_id ?? null;
    }

    if (!userId) {
      console.error(
        "Flowex webhook could not identify user:",
        subscriptionId
      );

      return NextResponse.json(
        { error: "Flowex user could not be identified." },
        { status: 400 }
      );
    }

    const status =
      attributes.status?.toString() ?? "";

    const providerUpdatedAt =
      typeof attributes.updated_at === "string"
        ? attributes.updated_at
        : "";

    if (
      !providerUpdatedAt ||
      Number.isNaN(new Date(providerUpdatedAt).getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid subscription payload." },
        { status: 400 }
      );
    }

    const trialEndsAt =
      attributes.trial_ends_at ?? null;

    const renewsAt =
      attributes.renews_at ?? null;

    const endsAt =
      attributes.ends_at ?? null;

    const cancelled =
      Boolean(attributes.cancelled);

    const flowexPlan = getFlowexPlan(
      status,
      trialEndsAt
    );

    const variantId =
      attributes.variant_id != null
        ? attributes.variant_id.toString()
        : null;

    const customerId =
      attributes.customer_id != null
        ? attributes.customer_id.toString()
        : null;

    let billingInterval: "monthly" | "annual" | null =
      null;

    if (
      variantId ===
      process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID
    ) {
      billingInterval = "monthly";
    } else if (
      variantId ===
      process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID
    ) {
      billingInterval = "annual";
    }

    const deliveryHash = crypto
      .createHash("sha256")
      .update(rawBody)
      .digest("hex");

    const { error: syncError } = await supabase.rpc(
      "apply_lemon_squeezy_subscription_webhook",
      {
        p_delivery_hash: deliveryHash,
        p_event_name: eventName,
        p_user_id: userId,
        p_customer_id: customerId,
        p_subscription_id: subscriptionId,
        p_variant_id: variantId,
        p_status: status,
        p_billing_interval: billingInterval,
        p_trial_ends_at: trialEndsAt,
        p_current_period_ends_at: endsAt ?? renewsAt,
        p_cancel_at_period_end: cancelled,
        p_plan: flowexPlan,
        p_provider_updated_at: providerUpdatedAt,
      }
    );

    if (syncError) {
      console.error(
        "Flowex subscription sync error:",
        syncError.message
      );

      return NextResponse.json(
        { error: "Could not sync subscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      event: eventName,
      plan: flowexPlan,
    });
  } catch (error) {
    console.error(
      "Flowex Lemon Squeezy webhook error:",
      error
    );

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
