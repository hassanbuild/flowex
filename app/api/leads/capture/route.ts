import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  runLeadAutomation,
  type AutomationLead,
} from "@/lib/automation/engine";

type CapturePayload = {
  public_key?: unknown;

  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;

  source?: unknown;
  message?: unknown;
};

function cleanString(
  value: unknown,
  maxLength: number
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(
    0,
    maxLength
  );
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

export async function POST(
  request: Request
) {
  try {
    /*
      =========================================================
      READ REQUEST
      =========================================================
    */

    let body: CapturePayload;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON payload.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      =========================================================
      PUBLIC KEY
      =========================================================
    */

    const publicKey =
      cleanString(
        body.public_key,
        120
      );

    if (!publicKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Flowex public key.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      =========================================================
      LEAD DATA
      =========================================================
    */

    const name =
      cleanString(
        body.name,
        150
      );

    const email =
      cleanString(
        body.email,
        320
      );

    const phone =
      cleanString(
        body.phone,
        80
      );

    const company =
      cleanString(
        body.company,
        200
      );

    const source =
      cleanString(
        body.source,
        100
      ) || "api";

    const message =
      cleanString(
        body.message,
        5000
      );

    /*
      Require at least one way to identify/contact
      the lead.

      We don't require email because some future
      sources may provide only phone/WhatsApp.
    */

    if (
      !email &&
      !phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Lead must contain an email address or phone number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email &&
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      =========================================================
      ADMIN SUPABASE CLIENT
      =========================================================

      The service-role client is server-only.

      It is used because this public endpoint must:
      - resolve the integration key
      - insert leads for the correct owner
      - run backend automation

      Browser clients never receive this key.
    */

    const supabase =
      createAdminClient();

    /*
      =========================================================
      RESOLVE FLOWEX OWNER
      =========================================================
    */

    const {
      data: settings,
      error: settingsError,
    } =
      await supabase
        .from(
          "lead_capture_settings"
        )
        .select(
          "user_id, enabled"
        )
        .eq(
          "public_key",
          publicKey
        )
        .maybeSingle();

    if (
      settingsError
    ) {
      console.error(
        "Flowex public key lookup error:",
        settingsError.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to process lead.",
        },
        {
          status: 500,
        }
      );
    }

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Flowex public key.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      =========================================================
      INSERT LEAD
      =========================================================

      The lead is ALWAYS saved before automation runs.

      Automation failure must never mean lead loss.
    */

    const {
      data: lead,
      error: leadError,
    } =
      await supabase
        .from("leads")
        .insert({
          user_id:
            settings.user_id,

          name,
          email,
          phone,
          company,

          source,

          status:
            "new",

          message,
        })
        .select(
          `
            id,
            user_id,
            name,
            email,
            phone,
            company,
            source,
            status,
            message
          `
        )
        .single<AutomationLead>();

    if (
      leadError ||
      !lead
    ) {
      console.error(
        "Flowex lead insert error:",
        leadError?.message ||
          "Lead was not returned."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to save lead.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      =========================================================
      LEAD CAPTURED EVENT
      =========================================================
    */

    const {
      error: eventError,
    } =
      await supabase
        .from("lead_events")
        .insert({
          user_id:
            lead.user_id,

          lead_id:
            lead.id,

          event_type:
            "lead_captured",

          detail:
            `Lead captured from ${source}.`,
        });

    if (eventError) {
      console.error(
        "Flowex lead captured event error:",
        eventError.message
      );
    }

    /*
      =========================================================
      RUN AUTOMATION
      =========================================================

      At this point the lead already exists safely.

      Even if automation fails, this endpoint can
      still return the captured lead ID.
    */

    const automation =
      await runLeadAutomation(
        supabase,
        lead
      );

    /*
      =========================================================
      RESPONSE
      =========================================================
    */

    return NextResponse.json(
      {
        success: true,

        lead_id:
          lead.id,

        automation,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Flowex capture route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}