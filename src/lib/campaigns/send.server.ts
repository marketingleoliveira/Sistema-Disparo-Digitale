import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";

/** Domínio delegado verificado usado para autenticação (SPF/DKIM). */
export const SENDER_DOMAIN = "atendimento.digitaletextil.com.br";
/** Domínio visível na caixa de entrada. */
export const FROM_DOMAIN = "digitaletextil.com.br";
export const DEFAULT_FROM_NAME = "Digitale Têxtil";
export const DEFAULT_FROM_EMAIL = `atendimento@${FROM_DOMAIN}`;

export interface SendHtmlEmailInput {
  to: string;
  subject: string;
  html: string;
  fromName?: string | undefined;
  replyTo?: string | undefined;
  idempotencyKey?: string | undefined;
  /** Rótulo do envio usado nos logs de entrega (ex.: "campaign", "campaign-test"). */
  label?: string | undefined;
}


export type SendHtmlEmailResult =
  | { sent: true; messageId?: string | undefined }
  | { sent: false; reason: string };

/** Converte o HTML do template em texto simples (fallback exigido pelo provedor). */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Envia um e-mail HTML pela infraestrutura gerenciada de e-mails.
 * Nunca lança em falhas esperadas (supressão, rate limit, domínio pendente):
 * devolve `{ sent: false, reason }` para o chamador tratar na interface.
 */
export async function sendHtmlEmail(input: SendHtmlEmailInput): Promise<SendHtmlEmailResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: false, reason: "api_key_missing" };

  const fromName = input.fromName?.trim() || DEFAULT_FROM_NAME;

  try {
    const response = await sendLovableEmail(
      {
        to: input.to,
        from: `${fromName} <${DEFAULT_FROM_EMAIL}>`,
        sender_domain: SENDER_DOMAIN,
        subject: input.subject,
        html: input.html,
        text: htmlToText(input.html),
        // A API exige `purpose`; sem ele o envio é recusado com "missing_parameter".
        purpose: "transactional",
        label: input.label ?? "campaign",
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),

      },
      { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
    if (!response.success) return { sent: false, reason: response.status ?? "send_failed" };
    return { sent: true, messageId: response.message_id };
  } catch (error) {
    if (error instanceof EmailAPIError) {
      return { sent: false, reason: error.code ?? `http_${error.status}` };
    }
    return { sent: false, reason: error instanceof Error ? error.message : "unknown_error" };
  }
}
