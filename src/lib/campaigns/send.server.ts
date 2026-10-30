
/** Domínio delegado verificado usado para autenticação (SPF/DKIM). */
export const SENDER_DOMAIN = "envios.digitaletextil.com.br";
/** Domínio visível na caixa de entrada. */
export const FROM_DOMAIN = "envios.digitaletextil.com.br";
export const DEFAULT_FROM_NAME = "Digitale Têxtil";
export const DEFAULT_FROM_EMAIL = `mailapi@${FROM_DOMAIN}`;

export interface SendHtmlEmailInput {
  to: string;
  subject: string;
  html: string;
  fromName?: string | undefined;
  replyTo?: string | undefined;
  idempotencyKey?: string | undefined;
  campaignId?: string | undefined;
  tracking?: {
    contactId: string;
    listId: string;
  } | undefined;
  /** Rótulo do envio usado nos logs de entrega (ex.: "campaign", "campaign-test"). */
  label?: string | undefined;
}


export type SendHtmlEmailResult =
  | { sent: true; messageId?: string | undefined }
  | { sent: false; simulated: true; messageId?: string | undefined }
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
async function sendHtmlEmailCore(input: SendHtmlEmailInput): Promise<SendHtmlEmailResult> {
  if (process.env["MAIL_API_PROVIDER"] === "digitale") {
    const { enqueueMailApi } = await import("./mail-api.server");
    const result = await enqueueMailApi({
      to: input.to,
      subject: input.subject,
      html: input.html,
      idempotencyKey: input.idempotencyKey,
    });

    if (!result.accepted) {
      return { sent: false, reason: result.reason };
    }

    // A simulacao continua sendo identificada corretamente.
    if (result.status === "simulated") {
      return {
        sent: false,
        simulated: true,
        ...(result.messageId
          ? { messageId: result.messageId }
          : {}),
      };
    }

    // Confirmacao real de aceite/fila/envio pela API.
    return {
      sent: true,
      ...(result.messageId
        ? { messageId: result.messageId }
        : {}),
    };
  }

  // Bloqueio de seguranca: nunca utilizar provedores alternativos.
  return {
    sent: false,
    reason: "mail_api_provider_not_digitale",
  };
}


/** Registra o resultado real retornado pelo remetente. */
export async function sendHtmlEmail(
  input: SendHtmlEmailInput
): Promise<SendHtmlEmailResult> {
  const {
    createEmailAttempt,
    finishEmailAttempt
  } = await import("../disparo-email-history.server");

  const attemptId = createEmailAttempt({
    kind: input.campaignId ? "campaign" : "test",
    provider:
      process.env["MAIL_API_PROVIDER"] === "digitale"
        ? "digitale"
        : "lovable",
    ...(input.campaignId
      ? { campaignId: input.campaignId }
      : {}),
    ...(input.idempotencyKey
      ? { idempotencyKey: input.idempotencyKey }
      : {})
  });

  let trackingPrepared = false;
  let result: SendHtmlEmailResult;

  try {

    let preparedInput = input;

    // Desativado ate a auditoria do envio MariaDB.
    const TRACKING_RELEASED = true;

    const { rewriteTrackedLinks } =
      await import("../disparo-click-tracking.server");

    const campaignId = input.campaignId;
    const tracking = input.tracking;

    if (
      TRACKING_RELEASED &&
      process.env["DISPARO_OPEN_TRACKING_ENABLED"] !== "0" &&
      campaignId &&
      tracking
    ) {
      const { prepareTrackedRecipient } =
        await import("../disparo-open-tracking.server");

      const { appendOpenTrackingPixel } =
        await import("../disparo-open-pixel.server");

      const token = prepareTrackedRecipient({
        campaignId,
        attemptId,
        contactId: tracking.contactId,
        listId: tracking.listId,
        email: input.to
      });

      preparedInput = {
        ...input,
        html: appendOpenTrackingPixel(
          process.env["DISPARO_CLICK_TRACKING_ENABLED"] === "1"
            ? rewriteTrackedLinks(input.html, {
                campaignId,
                attemptId
              })
            : input.html,
          token
        )
      };

      trackingPrepared = true;
    }

    result = await sendHtmlEmailCore(preparedInput);
  } catch (error) {
    try {
      finishEmailAttempt({
        id: attemptId,
        status: "failed",
        errorCode: "unexpected_error"
      });
    } catch (historyError) {
      console.error(
        "Falha ao registrar erro do envio",
        historyError
      );
    }
    throw error;
  }

  const status = result.sent
    ? "accepted"
    : "simulated" in result && result.simulated
      ? "simulated"
      : "failed";

  const messageId =
    "messageId" in result ? result.messageId : undefined;

  const errorCode =
    "reason" in result ? result.reason : undefined;

  try {
    finishEmailAttempt({
      id: attemptId,
      status,
      ...(messageId ? { messageId } : {}),
      ...(errorCode ? { errorCode } : {})
    });

    if (trackingPrepared && result.sent) {
      const { confirmTrackedRecipient } =
        await import("../disparo-open-tracking.server");

      confirmTrackedRecipient(attemptId);
    }
  } catch (historyError) {
    console.error(
      "Falha ao atualizar historico",
      historyError
    );
  }

  return result;
}
