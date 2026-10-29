type SendNotificationEmailInput = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
};

export class NotificationEmailError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly fallbackSafe: boolean,
  ) {
    super(code);
  }
}

export async function sendNotificationEmail({
  to,
  replyTo,
  subject,
  text,
  html,
  idempotencyKey,
}: SendNotificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "";

  if (!apiKey) throw new NotificationEmailError("resend_not_configured", false, true);
  if (!from) throw new NotificationEmailError("resend_sender_not_configured", false, true);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(html ? { html } : {}),
      }),
      cache: "no-store",
    });

    if (response.ok) return response.json().catch(() => null);

    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    const fallbackSafe = response.status >= 400 && response.status < 500 && ![408, 409, 429].includes(response.status);
    if (!retryable) {
      throw new NotificationEmailError(`resend_${response.status}`, false, fallbackSafe);
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    if (attempt === 2) {
      throw new NotificationEmailError(`resend_${response.status}`, true, false);
    }
  }
  throw new NotificationEmailError("resend_request_failed", true, false);
}
