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
  const apiKey =
    process.env.RESEND_API_KEY?.trim() || "";

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "";

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured."
    );
  }

  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL is not configured."
    );
  }

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

        body:
          JSON.stringify({
            from,
            to: [to],
            subject,
            text,
          }),

        cache:
          "no-store",
      }
    );

  const result =
    await response
      .json()
      .catch(
        () => null
      );

  if (!response.ok) {
    const message =
      result &&
      typeof result.message ===
        "string"
        ? result.message
        : "Resend rejected the notification email.";

    throw new Error(
      message
    );
  }

  return result;
}