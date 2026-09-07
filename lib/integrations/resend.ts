type SendNotificationEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendNotificationEmail({
  to,
  subject,
  text,
}: SendNotificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "";

  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured.");

  let lastError = "Resend rejected the notification email.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);

    if (response.ok) return result;

    lastError =
      result && typeof result.message === "string"
        ? result.message
        : `Resend rejected the notification email (${response.status}).`;

    // Retry only temporary failures / rate limits. Never retry permanent 4xx errors.
    if (response.status !== 429 && response.status < 500) break;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  throw new Error(lastError);
}
