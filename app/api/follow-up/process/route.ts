import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGoogleOAuthClient } from "@/lib/integrations/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEmailHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

async function getGmailConnection(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  for (const provider of ["google_email", "google_sheets"] as const) {
    const { data } = await supabase
      .from("integration_connections")
      .select("credentials, provider_account_email")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (
      data?.credentials &&
      typeof data.credentials === "object" &&
      data.provider_account_email
    ) {
      return {
        provider,
        credentials: data.credentials as Record<string, unknown>,
        email: String(data.provider_account_email),
      };
    }
  }

  return null;
}

async function sendFollowUpEmail(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    userId: string;
    to: string;
    subject: string;
    text: string;
  }
) {
  const connection =
    await getGmailConnection(
      supabase,
      input.userId
    );

  if (!connection) {
    throw new Error(
      "Connected Flowex Gmail account is unavailable."
    );
  }

  const oauth2Client =
    createGoogleOAuthClient();

  oauth2Client.setCredentials(
    connection.credentials
  );

  oauth2Client.on(
    "tokens",
    async (tokens) => {
      if (
        !tokens.access_token &&
        !tokens.refresh_token
      ) {
        return;
      }

      await supabase
        .from("integration_connections")
        .update({
          credentials: {
            ...connection.credentials,
            ...tokens,
            refresh_token:
              tokens.refresh_token ||
              connection.credentials
                .refresh_token,
          },
          updated_at:
            new Date().toISOString(),
        })
        .eq("user_id", input.userId)
        .eq(
          "provider",
          connection.provider
        );
    }
  );

  const gmail =
    google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

  const rawMessage = [
    `From: ${connection.email}`,
    `To: ${input.to}`,
    `Reply-To: ${connection.email}`,
    `Subject: ${encodeEmailHeader(input.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(
      input.text,
      "utf8"
    ).toString("base64"),
  ].join("\r\n");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: Buffer.from(
        rawMessage,
        "utf8"
      ).toString("base64url"),
    },
  });
}

function authorized(request: Request) {
  const secret =
    process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return (
    request.headers.get(
      "authorization"
    ) === `Bearer ${secret}`
  );
}

export async function GET(
  request: Request
) {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const supabase =
    createAdminClient();

  const now =
    new Date().toISOString();

  /*
    Privacy cleanup: Flowex keeps the lightweight lead record
    for no longer than seven days.
  */
  const { error: cleanupError } =
    await supabase
      .from("leads")
      .delete()
      .lte("expires_at", now);

  if (cleanupError) {
    console.error(
      "Flowex lead retention cleanup error:",
      cleanupError.message
    );
  }

  const {
    data: dueLeads,
    error: dueError,
  } =
    await supabase
      .from("leads")
      .select(
        "id, user_id, lead_flow_id, email, status, contacted_at, follow_up_due_at, follow_up_sent_at"
      )
      .eq("status", "new")
      .is("contacted_at", null)
      .is("follow_up_sent_at", null)
      .not("follow_up_due_at", "is", null)
      .lte("follow_up_due_at", now)
      .limit(100);

  if (dueError) {
    return NextResponse.json(
      {
        success: false,
        error: dueError.message,
      },
      { status: 500 }
    );
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of dueLeads || []) {
    /*
      Re-read immediately before sending. This is what prevents a
      follow-up if the business marked Contacted at the last moment.
    */
    const {
      data: lead,
      error: leadError,
    } =
      await supabase
        .from("leads")
        .select(
          "id, user_id, lead_flow_id, email, status, contacted_at, follow_up_due_at, follow_up_sent_at"
        )
        .eq("id", candidate.id)
        .maybeSingle();

    if (
      leadError ||
      !lead ||
      lead.status !== "new" ||
      lead.contacted_at ||
      lead.follow_up_sent_at ||
      !lead.email
    ) {
      skipped += 1;
      continue;
    }

    const {
      data: settings,
    } =
      await supabase
        .from(
          "lead_follow_up_settings"
        )
        .select(
          "enabled, message"
        )
        .eq(
          "lead_flow_id",
          lead.lead_flow_id
        )
        .eq(
          "user_id",
          lead.user_id
        )
        .maybeSingle();

    if (
      !settings ||
      settings.enabled !== true ||
      !settings.message?.trim()
    ) {
      await supabase
        .from("leads")
        .update({
          follow_up_due_at: null,
        })
        .eq("id", lead.id);

      skipped += 1;
      continue;
    }

    const {
      data: flow,
    } =
      await supabase
        .from("lead_flows")
        .select("name")
        .eq(
          "id",
          lead.lead_flow_id
        )
        .eq(
          "user_id",
          lead.user_id
        )
        .maybeSingle();

    try {
      await sendFollowUpEmail(
        supabase,
        {
          userId:
            lead.user_id,
          to:
            lead.email,
          subject:
            `Follow-up — ${
              flow?.name ||
              "Flowex"
            }`,
          text:
            settings.message.trim(),
        }
      );

      await supabase
        .from("leads")
        .update({
          follow_up_sent_at:
            new Date().toISOString(),
        })
        .eq("id", lead.id)
        .eq("status", "new")
        .is(
          "contacted_at",
          null
        )
        .is(
          "follow_up_sent_at",
          null
        );

      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        "Flowex follow-up delivery error:",
        error
      );
    }
  }

  return NextResponse.json({
    success: true,
    checked:
      dueLeads?.length || 0,
    sent,
    skipped,
    failed,
  });
}
