import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/integrations/reply-auth";

export const runtime = "nodejs";

export async function GET(
  request: Request
) {
  const auth =
    await authenticateRequest(
      request
    );

  if (!auth) {
    return NextResponse.json(
      {
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const url =
    new URL(
      request.url
    );

  const leadFlowId =
    url.searchParams
      .get("leadFlowId")
      ?.trim() || "";

  if (!leadFlowId) {
    return NextResponse.json(
      {
        error:
          "Select a Lead Flow first.",
      },
      {
        status: 400,
      }
    );
  }

  const [
    {
      data:
        settings,
    },
    {
      data:
        connection,
    },
  ] =
    await Promise.all([
      auth.supabase
        .from(
          "lead_reply_settings"
        )
        .select(
          "channel, template, subject, message, enabled"
        )
        .eq(
          "user_id",
          auth.user.id
        )
        .eq(
          "lead_flow_id",
          leadFlowId
        )
        .maybeSingle(),

      auth.supabase
        .from(
          "integration_connections"
        )
        .select(
          "provider_account_email, credentials"
        )
        .eq(
          "user_id",
          auth.user.id
        )
        .eq(
          "provider",
          "google_email"
        )
        .maybeSingle(),
    ]);

  return NextResponse.json({
    settings,

    emailConnected:
      !!connection?.credentials &&
      typeof connection.credentials ===
        "object" &&
      !!connection.provider_account_email,

    emailAddress:
      connection
        ?.provider_account_email ||
      "",
  });
}

export async function POST(
  request: Request
) {
  const auth =
    await authenticateRequest(
      request
    );

  if (!auth) {
    return NextResponse.json(
      {
        error:
          "Your session could not be verified.",
      },
      {
        status: 401,
      }
    );
  }

  const body =
    (await request
      .json()
      .catch(
        () => null
      )) as {
      leadFlowId?: unknown;
      channel?: unknown;
      template?: unknown;
      subject?: unknown;
      message?: unknown;
    } | null;

  const leadFlowId =
    typeof body
      ?.leadFlowId ===
      "string"
      ? body.leadFlowId.trim()
      : "";

  const channel =
    body?.channel ===
    "whatsapp"
      ? "whatsapp"
      : "email";

  const template =
    typeof body
      ?.template ===
      "string" &&
    [
      "preset_1",
      "preset_2",
      "preset_3",
      "custom",
    ].includes(
      body.template
    )
      ? body.template
      : "preset_1";

  const subject =
    typeof body
      ?.subject ===
      "string"
      ? body.subject
          .trim()
          .slice(
            0,
            200
          )
      : "";

  const message =
    typeof body
      ?.message ===
      "string"
      ? body.message
          .trim()
          .slice(
            0,
            10000
          )
      : "";

  if (
    !leadFlowId ||
    !message ||
    (
      channel ===
        "email" &&
      !subject
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Reply settings are incomplete.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data:
      flow,
  } =
    await auth.supabase
      .from(
        "lead_flows"
      )
      .select("id")
      .eq(
        "id",
        leadFlowId
      )
      .eq(
        "user_id",
        auth.user.id
      )
      .maybeSingle();

  if (!flow) {
    return NextResponse.json(
      {
        error:
          "The selected Lead Flow could not be verified.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    channel ===
    "email"
  ) {
    const {
      data:
        connection,
    } =
      await auth.supabase
        .from(
          "integration_connections"
        )
        .select(
          "provider_account_email"
        )
        .eq(
          "user_id",
          auth.user.id
        )
        .eq(
          "provider",
          "google_email"
        )
        .maybeSingle();

    if (
      !connection
        ?.provider_account_email
    ) {
      return NextResponse.json(
        {
          error:
            "Connect the email you want replies sent from first.",
        },
        {
          status: 409,
        }
      );
    }
  }

  const {
    error,
  } =
    await auth.supabase
      .from(
        "lead_reply_settings"
      )
      .upsert(
        {
          user_id:
            auth.user.id,

          lead_flow_id:
            leadFlowId,

          channel,

          template,

          subject,

          message,

          enabled:
            true,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "lead_flow_id",
        }
      );

  if (error) {
    return NextResponse.json(
      {
        error:
          "Flowex could not save Step 03.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
  });
}