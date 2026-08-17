import type { EditorBlock } from "@/components/editor/editor-types";

/** Escapa texto para uso seguro dentro de HTML. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Aceita apenas http/https/mailto; evita javascript: em CTAs. */
function safeUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^(https?:|mailto:)/i.test(raw)) return raw;
  if (raw.startsWith("data:image/")) return raw;
  return "#";
}

function pad(styles: Record<string, unknown>): string {
  const top = esc(styles["paddingTop"] ?? "10px");
  const bottom = esc(styles["paddingBottom"] ?? "10px");
  return `padding:${top} 0 ${bottom} 0;`;
}

function renderBlock(block: EditorBlock): string {
  const s = block.styles ?? {};
  const align = esc(s["textAlign"] ?? "left");
  const content = block.content ?? {};

  switch (block.type) {
    case "logo":
    case "image": {
      const width = block.type === "logo" ? "200" : "600";
      return `<tr><td align="${align}" style="${pad(s)}"><img src="${esc(safeUrl(content.url))}" alt="${esc(content.alt ?? "")}" width="${width}" style="display:inline-block;max-width:100%;height:auto;border:0;border-radius:${esc(s["borderRadius"] ?? "0")};" /></td></tr>`;
    }
    case "title":
      return `<tr><td align="${align}" style="${pad(s)}"><h2 style="margin:0;font-size:${esc(s["fontSize"] ?? "24px")};font-weight:${esc(s["fontWeight"] ?? "bold")};color:${esc(s["color"] ?? "#1e2d4d")};">${esc(content.text)}</h2></td></tr>`;
    case "text":
    case "footer":
      return `<tr><td align="${align}" style="${pad(s)}"><p style="margin:0;font-size:${esc(s["fontSize"] ?? "16px")};line-height:${esc(s["lineHeight"] ?? "1.5")};color:${esc(s["color"] ?? "#5b6579")};">${esc(content.text)}</p></td></tr>`;
    case "button":
      return `<tr><td align="${align}" style="${pad(s)}"><a href="${esc(safeUrl(content.url))}" style="background-color:${esc(s["backgroundColor"] ?? "#ee6c1f")};color:${esc(s["color"] ?? "#ffffff")};border-radius:${esc(s["borderRadius"] ?? "6px")};padding:12px 24px;display:inline-block;text-decoration:none;font-weight:bold;font-size:14px;">${esc(content.text ?? "Saiba mais")}</a></td></tr>`;
    case "divider":
      return `<tr><td style="${pad(s)}"><hr style="border:0;border-top:1px solid #e4e7ef;margin:0;" /></td></tr>`;
    case "spacer":
      return `<tr><td style="height:24px;line-height:24px;font-size:0;">&nbsp;</td></tr>`;
    case "html":
      return `<tr><td style="${pad(s)}">${String(content.html ?? content.text ?? "")}</td></tr>`;
    default:
      return content.text
        ? `<tr><td align="${align}" style="${pad(s)}"><p style="margin:0;font-size:14px;color:#5b6579;">${esc(content.text)}</p></td></tr>`
        : "";
  }
}

/** Converte os blocos do editor visual em HTML compatível com clientes de e-mail. */
export function blocksToEmailHtml(blocks: EditorBlock[], title = "Template"): string {
  const rows = blocks.map(renderBlock).join("\n");
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:12px;padding:24px;">
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
