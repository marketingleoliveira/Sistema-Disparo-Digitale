import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({ name: z.string().min(1) });

/**
 * Renderiza um template de e-mail em HTML no servidor.
 * Usado apenas pela tela interna de pré-visualização — nenhum envio ocorre aqui.
 */
export const renderEmailPreview = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const [{ EMAIL_TEMPLATES }, { render }, { createElement }] = await Promise.all([
      import("./email-templates/index"),
      import("@react-email/render"),
      import("react"),
    ]);

    const entry = EMAIL_TEMPLATES[data.name];
    if (!entry) {
      throw new Error(`Template não encontrado: ${data.name}`);
    }

    const html = await render(
      createElement(entry.component, (entry.previewData ?? {}) as never),
      { pretty: false },
    );

    return { html, subject: entry.subject };
  });