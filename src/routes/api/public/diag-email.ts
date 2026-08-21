import { createFileRoute } from "@tanstack/react-router";

/** Rota temporária de diagnóstico do envio de e-mails (remover após validação). */
export const Route = createFileRoute("/api/public/diag-email")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") ?? "";
        if (!to) return Response.json({ error: "missing to" }, { status: 400 });
        const { sendHtmlEmail } = await import("@/lib/campaigns/send.server");
        const result = await sendHtmlEmail({
          to,
          subject: "Diagnóstico de envio",
          html: "<p>Teste de diagnóstico do disparo de campanhas.</p>",
          idempotencyKey: `diag-${to}-${Date.now()}`,
        });
        return Response.json({
          result,
          hasApiKey: Boolean(process.env["LOVABLE_API_KEY"]),
        });
      },
    },
  },
});
