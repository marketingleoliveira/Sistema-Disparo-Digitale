/**
 * Utilitários de importação de designs do Canva para templates de e-mail.
 *
 * Contexto técnico: o Canva não expõe exportação em HTML.
 * Os dois caminhos suportados aqui são os únicos confiáveis:
 *  1. Exportar o design como PNG/JPG e envolvê-lo em um HTML e-mail-safe (tabela + <img>).
 *  2. Importar um arquivo .html já pronto (exportado por outra ferramenta / editado à mão).
 */

export type CanvaImportKind = "image" | "html";

export interface ImportedTemplate {
  id: string;
  name: string;
  category: string;
  /** Miniatura usada nos cards da biblioteca (data URL ou URL remota). */
  image: string;
  /** HTML final, pronto para envio. */
  html: string;
  kind: CanvaImportKind;
  linkUrl?: string;
  createdAt: string;
  isOfficial: false;
}

export const MAX_IMPORT_BYTES = 4 * 1024 * 1024; // 4 MB

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateImportFile(
  file: File,
): { ok: true; kind: CanvaImportKind } | { ok: false; error: string } {
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, error: "Arquivo maior que 4 MB. Reduza a qualidade da exportação no Canva." };
  }
  if (IMAGE_TYPES.includes(file.type)) return { ok: true, kind: "image" };
  if (file.type === "text/html" || file.name.toLowerCase().endsWith(".html")) {
    return { ok: true, kind: "html" };
  }
  return { ok: false, error: "Formato não suportado. Use PNG, JPG, WEBP ou HTML." };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsText(file);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Aceita apenas http/https para evitar javascript: em links de CTA. */
export function sanitizeUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Envolve a imagem exportada do Canva em um HTML compatível com clientes de e-mail
 * (tabela centralizada, largura fixa de 600px, imagem responsiva e alt text).
 */
export function buildEmailHtmlFromImage(params: {
  name: string;
  imageSrc: string;
  linkUrl?: string;
  altText?: string;
}): string {
  const alt = escapeHtml(params.altText || params.name);
  const img = `<img src="${escapeHtml(params.imageSrc)}" alt="${alt}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />`;
  const body = params.linkUrl
    ? `<a href="${escapeHtml(params.linkUrl)}" target="_blank" style="text-decoration:none;">${img}</a>`
    : img;

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(params.name)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f7fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr><td align="center" style="line-height:0;">${body}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Limpeza defensiva de HTML importado: remove scripts, iframes e handlers inline,
 * que são bloqueados (ou perigosos) em clientes de e-mail.
 */
export function sanitizeImportedHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

/** Extrai a primeira imagem do HTML para usar como miniatura do card. */
export function extractFirstImage(html: string): string | undefined {
  const match = /<img[^>]+src\s*=\s*["']([^"']+)["']/i.exec(html);
  return match?.[1];
}