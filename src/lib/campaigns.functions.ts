
// DIGITALE_REPLY_TO_ATENDIMENTO_V1
function normalizeDisparoReplyTo(value: unknown): string {
  const address = typeof value === "string"
    ? value.trim()
    : "";

  if (
    !address ||
    address.toLowerCase() === "mailapi@envios.digitaletextil.com.br"
  ) {
    return "atendimento@digitaletextil.com.br";
  }

  return address;
}

import { createServerFn } from "@tanstack/react-start";

interface TestEmailInput {
  to: string;
  subject: string;
  html: string;
  fromName?: string | undefined;
  replyTo?: string | undefined;
}

function parseTestInput(input: TestEmailInput): TestEmailInput {
  const to = String(input?.to ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error("E-mail de teste inválido.");
  const subject = String(input?.subject ?? "").trim();
  if (!subject) throw new Error("Informe o assunto do e-mail.");
  const html = String(input?.html ?? "");
  if (!html.trim()) throw new Error("A campanha não possui conteúdo para enviar.");
  return { to, subject, html, fromName: input.fromName, replyTo: input.replyTo };
}

/** Envia um e-mail de teste da campanha para um único destinatário. */
export const sendCampaignTest = createServerFn({ method: "POST" })
  .inputValidator(parseTestInput)
  .handler(async ({ data }) => {
    const { requireDisparoUser } = await import("./disparo-auth.server");
    await requireDisparoUser();
    const { sendHtmlEmail } = await import("./campaigns/send.server");
    const result = await sendHtmlEmail({
      to: data.to,
      subject: `[TESTE] ${data.subject}`,
      html: data.html,
      ...(data.fromName ? { fromName: data.fromName } : {}),
      ...{ replyTo: normalizeDisparoReplyTo(data.replyTo) },
      label: "campaign-test",
      idempotencyKey: `campaign-test-${data.to}-${Date.now()}`,

    });
    return result;
  });


interface DispatchInput {
  campaignId: string;
}

/**
 * Envio de campanhas utilizando exclusivamente MariaDB.
 * A confirmacao manual continua na interface.
 */
export const dispatchCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: DispatchInput) => {
    const campaignId = String(input?.campaignId ?? "").trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        .test(campaignId)
    ) {
      throw new Error("Identificador de campanha invalido.");
    }

    return { campaignId };
  })
  .handler(async ({ data }) => {
    const { requireDisparoUser } =
      await import("./disparo-auth.server");

    const user = await requireDisparoUser();

    if (![
      "Desenvolvedor",
      "Diretoria",
      "Gerência"
    ].includes(user.role)) {
      throw new Error(
        "Sem permissao para disparar campanhas."
      );
    }

    const {
      getDisparoCampaignByIdDB,
      getDisparoRecipientsDB,
      claimDisparoCampaignForSendingDB,
      finishDisparoCampaignDB
    } = await import("./disparo-campaigns.server");

    const campaign =
      await getDisparoCampaignByIdDB(data.campaignId);

    if (campaign.status !== "Em andamento") {
      throw new Error(
        "Campanha nao esta liberada para execucao."
      );
    }

    const content = campaign.content;

    const html =
      typeof content["html"] === "string"
        ? content["html"]
        : "";

    const subject = campaign.subject.trim();

    const lists = content["lists"];

    if (!Array.isArray(lists) || !lists.every(
      item => typeof item === "string"
    )) {
      throw new Error("Listas da campanha invalidas.");
    }

    if (!html.trim() || !subject) {
      throw new Error(
        "Assunto ou HTML da campanha ausente."
      );
    }

    const audience = await getDisparoRecipientsDB(lists);

    if (audience.length === 0) {
      throw new Error("Nenhum contato ativo selecionado.");
    }

    if (audience.length > 100000) {
      throw new Error(
        "Volume excede limite de seguranca."
      );
    }

    const fromName =
      typeof content["senderName"] === "string"
        ? content["senderName"]
        : undefined;

    const replyTo =
      typeof content["replyTo"] === "string"
        ? content["replyTo"]
        : undefined;

    // Nao chamar o provedor sem reservar a campanha.
    await claimDisparoCampaignForSendingDB(campaign.id);

    const { sendHtmlEmail } =
      await import("./campaigns/send.server");

    let sent = 0;
    let simulated = 0;

    const failures: Array<{
      email: string;
      reason: string;
    }> = [];

    // DIGITALE_FORCE_END_V1
    const { isDisparoCampaignInterruptedDB } =
      await import("./disparo-campaigns.server");

    let interrupted = false;
    let checkCounter = 0;

    for (const contact of audience) {
      // DIGITALE_FORCE_END_BATCH_V2
      // Consulta antes do primeiro envio e depois a cada 10.
      if (
        checkCounter++ % 10 === 0 &&
        isDisparoCampaignInterruptedDB(campaign.id)
      ) {
        interrupted = true;
        break;
      }

      try {
        const result = await sendHtmlEmail({
          to: contact.email,
          subject,
          html,
          ...(fromName ? { fromName } : {}),
          ...{ replyTo: normalizeDisparoReplyTo(replyTo) },
          campaignId: campaign.id,
          tracking: {
            contactId: contact.contactId,
            listId: contact.listId
          },
          idempotencyKey:
            `campaign-${campaign.id}-${contact.email}`,
          label: "campaign"
        });

        if (result.sent) {
          sent++;
        } else if (
          "simulated" in result &&
          result.simulated
        ) {
          simulated++;
        } else {
          failures.push({
            email: contact.email,
            reason: "reason" in result
              ? result.reason
              : "unknown_error"
          });
        }
      } catch {
        failures.push({
          email: contact.email,
          reason: "unexpected_error"
        });
      }
    }

    // Confere novamente o encerramento antes de finalizar.
    if (
      !interrupted &&
      !isDisparoCampaignInterruptedDB(campaign.id)
    ) await finishDisparoCampaignDB({
      campaignId: campaign.id,
      sent,
      simulated,
      failed: failures.length
    });

    return {
      total: audience.length,
      sent,
      simulated,
      failed: failures.length,
      failures: failures.slice(0, 20)
    };
  });

// DIGITALE_FORCE_END_V1
export const forceEndDisparoCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: { campaignId: string }) => {
    const campaignId = String(input?.campaignId ?? "").trim();

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)) {
      throw new Error("ID de campanha invalido.");
    }

    return { campaignId };
  })
  .handler(async ({ data }) => {
    const { forceEndDisparoCampaignDB } =
      await import("./disparo-campaigns.server");

    await forceEndDisparoCampaignDB(data.campaignId);

    return { success: true };
  });
