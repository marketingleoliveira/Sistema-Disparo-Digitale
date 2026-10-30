export interface MailApiInput {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string | undefined;
}

export type MailApiResult =
  | { accepted: true; status: "queued" | "simulated"; messageId?: string }
  | { accepted: false; reason: string };

export async function enqueueMailApi(input: MailApiInput): Promise<MailApiResult> {
  const apiKey = process.env["MAIL_API_KEY"];
  if (!apiKey) {
    return { accepted: false, reason: "mail_api_key_missing" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("http://127.0.0.1:8300/v1/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "mailapi@envios.digitaletextil.com.br",
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.idempotencyKey
          ? { idempotency_key: input.idempotencyKey }
          : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        accepted: false,
        reason: `mail_api_http_${response.status}`,
      };
    }

    const raw: unknown = await response.json();

    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return {
        accepted: false,
        reason: "mail_api_unexpected_response",
      };
    }

    const data = raw as {
      status?: unknown;
      messages?: unknown;
    };

    if (
      !["queued", "accepted"].includes(String(data.status))
      || !Array.isArray(data.messages)
    ) {
      return {
        accepted: false,
        reason: "mail_api_unexpected_response",
      };
    }

    const first: unknown = data.messages[0];

    if (
      !first ||
      typeof first !== "object" ||
      Array.isArray(first)
    ) {
      return {
        accepted: false,
        reason: "mail_api_empty_response",
      };
    }

    const message = first as {
      id?: unknown;
      status?: unknown;
    };

    if (message.status === "suppressed") {
      return {
        accepted: false,
        reason: "recipient_suppressed",
      };
    }

    if (
      !["queued", "accepted"].includes(String(message.status))
      || typeof message.id !== "string"
      || !message.id
    ) {
      return {
        accepted: false,
        reason: "mail_api_message_not_accepted",
      };
    }

    return {
      accepted: true,
      status: "queued",
      messageId: message.id,
    };
  } catch {
    return {
      accepted: false,
      reason: "mail_api_connection_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
