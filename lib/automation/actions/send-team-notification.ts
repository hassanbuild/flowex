import type { AutomationLead } from "../engine";

type SendTeamNotificationOptions = {
  lead: AutomationLead;
  notificationEmail: string;
};

type SendTeamNotificationResult = {
  success: boolean;
  emailId?: string;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(
  value: string | null
) {
  if (!value?.trim()) {
    return "Not provided";
  }

  return escapeHtml(
    value.trim()
  );
}

export async function sendTeamNotification({
  lead,
  notificationEmail,
}: SendTeamNotificationOptions): Promise<SendTeamNotificationResult> {
  /*
    =========================================================
    VALIDATION
    =========================================================
  */

  const destination =
    notificationEmail.trim();

  if (!destination) {
    return {
      success: false,
      error:
        "Notification email is not configured.",
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
    LEAD INFORMATION
    =========================================================
  */

  const name =
    displayValue(
      lead.name
    );

  const email =
    displayValue(
      lead.email
    );

  const phone =
    displayValue(
      lead.phone
    );

  const company =
    displayValue(
      lead.company
    );

  const source =
    displayValue(
      lead.source
    );

  const message =
    displayValue(
      lead.message
    );

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
              destination,
            ],

            subject:
              lead.name?.trim()
                ? `New Flowex lead: ${lead.name.trim()}`
                : "New Flowex lead",

            html: `
              <div style="
                font-family: Arial, Helvetica, sans-serif;
                max-width: 620px;
                margin: 0 auto;
                padding: 24px;
                color: #111827;
              ">

                <h1 style="
                  margin: 0 0 8px;
                  font-size: 24px;
                  line-height: 1.3;
                ">
                  New lead captured
                </h1>

                <p style="
                  margin: 0 0 24px;
                  color: #6b7280;
                  font-size: 14px;
                  line-height: 1.6;
                ">
                  Flowex captured a new lead for your business.
                </p>

                <div style="
                  border: 1px solid #e5e7eb;
                  border-radius: 14px;
                  overflow: hidden;
                ">

                  <div style="
                    padding: 14px 16px;
                    border-bottom: 1px solid #e5e7eb;
                  ">
                    <strong>Name:</strong>
                    ${name}
                  </div>

                  <div style="
                    padding: 14px 16px;
                    border-bottom: 1px solid #e5e7eb;
                  ">
                    <strong>Email:</strong>
                    ${email}
                  </div>

                  <div style="
                    padding: 14px 16px;
                    border-bottom: 1px solid #e5e7eb;
                  ">
                    <strong>Phone:</strong>
                    ${phone}
                  </div>

                  <div style="
                    padding: 14px 16px;
                    border-bottom: 1px solid #e5e7eb;
                  ">
                    <strong>Company:</strong>
                    ${company}
                  </div>

                  <div style="
                    padding: 14px 16px;
                    border-bottom: 1px solid #e5e7eb;
                  ">
                    <strong>Source:</strong>
                    ${source}
                  </div>

                  <div style="
                    padding: 14px 16px;
                  ">
                    <strong>Message:</strong>

                    <div style="
                      margin-top: 8px;
                      white-space: pre-wrap;
                      line-height: 1.6;
                    ">
                      ${message}
                    </div>
                  </div>

                </div>

                <p style="
                  margin: 24px 0 0;
                  color: #9ca3af;
                  font-size: 12px;
                  line-height: 1.6;
                ">
                  Captured and processed automatically by Flowex.
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
            : "Resend rejected the notification email.",
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
      "Flowex team notification error:",
      error
    );

    return {
      success: false,
      error:
        "Flowex could not connect to the email provider.",
    };
  }
}