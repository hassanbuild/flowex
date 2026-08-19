import type { AutomationLead } from "../engine";

type SendInstantReplyOptions = {
  lead: AutomationLead;
  message: string | null;
};

type SendInstantReplyResult = {
  success: boolean;
  emailId?: string;
  error?: string;
};

const DEFAULT_REPLY =
  "Thanks for reaching out. We received your message and someone from our team will get back to you shortly.";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendInstantReply({
  lead,
  message,
}: SendInstantReplyOptions): Promise<SendInstantReplyResult> {
  /*
    =========================================================
    VALIDATION
    =========================================================
  */

  if (!lead.email) {
    return {
      success: false,
      error:
        "Lead does not have an email address.",
    };
  }

  const apiKey =
    process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.FLOWEX_FROM_EMAIL;

  const fromName =
    process.env.FLOWEX_FROM_NAME ||
    "Flowex";

  if (!apiKey) {
    return {
      success: false,
      error:
        "RESEND_API_KEY is not configured.",
    };
  }

  if (!fromEmail) {
    return {
      success: false,
      error:
        "FLOWEX_FROM_EMAIL is not configured.",
    };
  }

  /*
    =========================================================
    MESSAGE
    =========================================================
  */

  const replyMessage =
    message?.trim() ||
    DEFAULT_REPLY;

  const leadName =
    lead.name?.trim();

  const greeting =
    leadName
      ? `Hi ${leadName},`
      : "Hi,";

  const safeGreeting =
    escapeHtml(greeting);

  const safeMessage =
    escapeHtml(replyMessage);

  /*
    =========================================================
    SEND THROUGH RESEND
    =========================================================
  */

  try {
    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            from:
              `${fromName} <${fromEmail}>`,

            to: [
              lead.email,
            ],

            subject:
              "We received your message",

            html: `
              <div style="
                font-family: Arial, Helvetica, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
                color: #111827;
              ">
                <p style="
                  font-size: 16px;
                  line-height: 1.7;
                  margin: 0 0 16px;
                ">
                  ${safeGreeting}
                </p>

                <p style="
                  font-size: 16px;
                  line-height: 1.7;
                  margin: 0 0 20px;
                ">
                  ${safeMessage}
                </p>

                <p style="
                  font-size: 14px;
                  line-height: 1.6;
                  color: #6b7280;
                  margin: 24px 0 0;
                ">
                  Sent automatically by Flowex.
                </p>
              </div>
            `,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return {
        success: false,

        error:
          typeof data?.message ===
          "string"
            ? data.message
            : "Resend rejected the email request.",
      };
    }

    return {
      success: true,
      emailId:
        typeof data?.id ===
        "string"
          ? data.id
          : undefined,
    };
  } catch (error) {
    console.error(
      "Flowex instant reply error:",
      error
    );

    return {
      success: false,
      error:
        "Flowex could not connect to the email provider.",
    };
  }
}