import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface TestEmailInput {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
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
  .middleware([requireSupabaseAuth])
  .inputValidator(parseTestInput)
  .handler(async ({ data }) => {
    const { sendHtmlEmail } = await import("./campaigns/send.server");
    const result = await sendHtmlEmail({
      to: data.to,
      subject: `[TESTE] ${data.subject}`,
      html: data.html,
      ...(data.fromName ? { fromName: data.fromName } : {}),
      ...(data.replyTo ? { replyTo: data.replyTo } : {}),
      idempotencyKey: `campaign-test-${data.to}-${Date.now()}`,
    });
    return result;
  });

interface DispatchInput {
  campaignId: string;
}

/**
 * Dispara a campanha para os contatos ativos das listas selecionadas.
 * Roda como o usuário autenticado (RLS aplicada) e atualiza o status ao final.
 */
export const dispatchCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: DispatchInput) => {
    const campaignId = String(input?.campaignId ?? "").trim();
    if (!campaignId) throw new Error("Campanha não informada.");
    return { campaignId };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.campaignId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!campaign) throw new Error("Campanha não encontrada.");

    const content = (campaign.content ?? {}) as Record<string, unknown>;
    const html = String(content["html"] ?? "");
    const subject = String(campaign.subject ?? content["subject"] ?? "").trim();
    const lists = Array.isArray(content["lists"]) ? (content["lists"] as string[]) : [];
    const fromName = typeof content["senderName"] === "string" ? content["senderName"] : undefined;
    const replyTo = typeof content["replyTo"] === "string" ? content["replyTo"] : undefined;

    if (!html.trim()) throw new Error("A campanha não possui conteúdo (etapa de design).");
    if (!subject) throw new Error("A campanha não possui assunto.");

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("email, lists, status")
      .eq("status", "Ativo");

    if (contactsError) throw new Error(contactsError.message);

    const audience = (contacts ?? []).filter((c) => {
      if (!c.email) return false;
      if (lists.length === 0) return true;
      const contactLists = Array.isArray(c.lists) ? (c.lists as string[]) : [];
      return contactLists.some((l) => lists.includes(l));
    });

    if (audience.length === 0) throw new Error("Nenhum contato ativo encontrado para esta seleção.");

    const { sendHtmlEmail } = await import("./campaigns/send.server");

    let sent = 0;
    const failures: Array<{ email: string; reason: string }> = [];

    for (const contact of audience) {
      const result = await sendHtmlEmail({
        to: contact.email,
        subject,
        html,
        ...(fromName ? { fromName } : {}),
        ...(replyTo ? { replyTo } : {}),
        idempotencyKey: `campaign-${campaign.id}-${contact.email}`,
      });
      if (result.sent) sent += 1;
      else failures.push({ email: contact.email, reason: result.reason });
    }

    await supabase
      .from("campaigns")
      .update({
        status: sent > 0 ? "Enviada" : "Rascunho",
        recipients: sent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return { total: audience.length, sent, failed: failures.length, failures: failures.slice(0, 20) };
  });
