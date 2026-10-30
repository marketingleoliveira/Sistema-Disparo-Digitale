import type { EditorBlock } from "@/components/editor/editor-types";
import { richRunsToHtml } from "./rich-runs";

/** Escapa texto para uso seguro dentro de HTML. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// DIGITALE_LINEBREAK_FIX_V2
function renderLineBreakContent(content: {
  text?: unknown;
  richRuns?: Array<{ text: string; [key: string]: any }>;
}): string {
  const text = String(content.text ?? "");

  if (
    Array.isArray(content.richRuns) &&
    content.richRuns.length > 0
  ) {
    return richRunsToHtml(content.richRuns, text, true);
  }

  return esc(text).replace(/\r?\n/g, "<br>");
}


// DIGITALE_TEXT_CARD_APPEARANCE_V1
function textCardCss(styles: Record<string, unknown>): string {
  const parts: string[] = [];

  const bg = String(styles["backgroundColor"] || "");
  if (/^#[0-9a-f]{6}$/i.test(bg)) {
    parts.push(`background-color:${bg}`);
  }

  const pixels = (key: string, max: number) => {
    const value = String(styles[key] ?? "");
    const match = /^(\d{1,3})px$/.exec(value);
    if (!match) return null;
    const number = Number(match[1]);
    return number >= 0 && number <= max
      ? number + "px"
      : null;
  };

  const radius = pixels("borderRadius", 32);
  const left = pixels("paddingLeft", 60);
  const right = pixels("paddingRight", 60);

  if (radius) parts.push(`border-radius:${radius}`);
  if (left) parts.push(`padding-left:${left}`);
  if (right) parts.push(`padding-right:${right}`);

  // DIGITALE_SHADOW_VISIBLE_V2
  if (
    typeof styles["boxShadow"] === "string" &&
    styles["boxShadow"] !== "" &&
    styles["boxShadow"] !== "none"
  ) {
    // Sombra em clientes compativeis.
    parts.push(
      "box-shadow:0 3px 12px rgba(0,0,0,0.16)"
    );

    // Alternativa visual para clientes sem box-shadow.
    parts.push("border:1px solid #e1e5eb");
  }

  return parts.length ? parts.join(";") + ";" : "";
}

/** Aceita apenas http/https/mailto; evita javascript: em CTAs. */
function safeUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^(https?:|mailto:)/i.test(raw)) return raw;
  if (raw.startsWith("data:image/")) return raw;
  return "#";
}

// DIGITALE_EMAIL_FONTS_V1
// DIGITALE_EMAIL_CUSTOM_FONTS_V2
function customFontFile(styles: Record<string, unknown>): string | null {
  const id = String(styles["fontFileId"] ?? "");
  const match = /^([a-f0-9]{64})\.(woff2|woff|ttf)$/.exec(id);

  if (!match) return null;

  const family = `"DigitaleFont-${match[1]}", Arial, Helvetica, sans-serif`;

  return styles["fontFamily"] === family ? id : null;
}

function emailFontFamily(styles: Record<string, unknown>): string {
  const allowed = [
    "Arial, Helvetica, sans-serif",
    "Helvetica, Arial, sans-serif",
    "Verdana, Geneva, sans-serif",
    "Georgia, serif",
    '"Times New Roman", Times, serif',
    "Tahoma, Geneva, sans-serif",
    '"Trebuchet MS", Arial, sans-serif',
    '"Courier New", Courier, monospace',
  ];

  const selected = String(styles["fontFamily"] ?? "");

  if (customFontFile(styles)) {
    return selected;
  }

  return allowed.includes(selected)
    ? selected
    : "Arial, Helvetica, sans-serif";
}

function pad(styles: Record<string, unknown>): string {
  const top = esc(styles["paddingTop"] ?? "10px");
  const bottom = esc(styles["paddingBottom"] ?? "10px");
  return `padding:${top} 0 ${bottom} 0;`;
}

function renderBlock(block: EditorBlock): string {
  const s = block.styles ?? {};
  const align = (
    s["textAlign"] === "left" ||
    s["textAlign"] === "center" ||
    s["textAlign"] === "right"
      ? s["textAlign"]
      : block.type === "button" ? "center" : "left"
  );
  const content = block.content ?? {};

  // DIGITALE_RICH_TEXT_V2
  if (
    (block.type === "text" || block.type === "title") &&
    Array.isArray(content.richRuns) &&
    content.richRuns.length > 0
  ) {
    const title = block.type === "title";
    const tag = title ? "h2" : "div";
    const rich = richRunsToHtml(
      content.richRuns,
      String(content.text ?? ""),
      true
    );

    return `<tr>
      <td align="${align}" style="${pad(s)}">
        <${tag} style="margin:0;
          font-family:${emailFontFamily(s)};
          font-size:${esc(s["fontSize"] ?? (title ? "24px" : "16px"))};
          font-weight:${esc(s["fontWeight"] ?? (title ? "bold" : "normal"))};
          color:${esc(s["color"] ?? "#1e293b")};
          line-height:${esc(s["lineHeight"] ?? "1.5")};
          text-align:${align};overflow-wrap:break-word;">
          ${rich}
        </${tag}>
      </td>
    </tr>`;
  }

  switch (block.type) {
    case "logo":
    case "image": {

      // DIGITALE_EMAIL_IMAGE_LINKS_V1
      const defaultWidth = block.type === "logo" ? 180 : 600;
      const rawWidth = String(s["width"] ?? "").trim();
      const widthMatch = rawWidth.match(/^([0-9]+)(?:px)?$/i);
      const requestedWidth = widthMatch
        ? Number(widthMatch[1])
        : defaultWidth;
      const width = Math.min(900, Math.max(40, requestedWidth));

      const rawHref = String(content.href ?? "").trim();
      const href = rawHref.startsWith("https://") || rawHref.startsWith("http://")
        ? rawHref
        : "";


      // DIGITALE_HOTSPOTS_EMAIL_V2
      const hotspotData = (content as any).hotspotData;
      const areas = Array.isArray(hotspotData?.areas)
        ? hotspotData.areas.filter((a:any) =>
            a && typeof a.url === "string" &&
            /^https?:\/\//i.test(a.url.trim()) &&
            [a.x,a.y,a.w,a.h].every(
              (n:unknown)=>typeof n==="number" &&
                Number.isFinite(n) && n>=0 && n<=1
            ) &&
            a.w>.005 && a.h>.005 &&
            a.x+a.w<=1.00001 && a.y+a.h<=1.00001
          ).slice(0,12)
        : [];

      if (areas.length) {
        // DIGITALE_HOTSPOT_FULL_IMAGE_V4
        // Preserva a imagem original inteira no email.
        // Mantem as areas salvas, mas usa um link unico.
        const source = safeUrl(content.url);
        const destination = areas[0].url.trim();
        const alt = String(content.alt || "Imagem da campanha");
        const alignment = esc(s["textAlign"] || "center");

        const image = `<img src="${esc(source)}"
          alt="${esc(alt)}"
          width="600"
          style="display:block;width:100%;max-width:600px;height:auto;margin:0;padding:0;border:0;outline:none;text-decoration:none;" />`;

        return `<tr>
          <td align="${alignment}"
              style="${pad(s)}font-size:0;line-height:0;">
            <a href="${esc(destination)}"
               target="_blank"
               style="display:block;text-decoration:none;border:0;">
              ${image}
            </a>
          </td>
        </tr>`;



        // DIGITALE_HOTSPOTS_EMAIL_V3
        // Nunca mostrar links extras abaixo da imagem.
        // Para imagens externas, preservar somente a arte
        // enquanto o usuario importa o PNG para a biblioteca.
        const fallbackHtml = () => {
          const source = safeUrl(content.url);
          const alt = String(content.alt || "Imagem");
          return `<tr>
            <td align="${esc(s["textAlign"] || "center")}"
                style="${pad(s)}font-size:0;line-height:0;">
              <img src="${esc(source)}"
                   alt="${esc(alt)}"
                   width="600"
                   style="display:block;display:block;width:100%;height:auto;line-height:0;font-size:0;border:0;outline:none;text-decoration:none;vertical-align:top;
                   max-width:600px;height:auto;border:0;" />
            </td>
          </tr>`;
        };

        const imageUrl = String(content.url || "");
        const match = /^(?:https:\/\/disparo\.digitaletextil\.com\.br)?\/editor-media\/([a-f0-9]{64}\.(?:png|jpg|webp))(?:[?#].*)?$/i.exec(imageUrl);

        if (!match) {
          return fallbackHtml();
        }

        const ratio = Number(hotspotData?.ratio);
        if (!Number.isFinite(ratio) || ratio<=0) {
          return fallbackHtml();
        }

        const defaultWidth = block.type==="logo" ? 180 : 600;
        const rawWidth = String(s["width"] ?? "").trim();
        const wm = rawWidth.match(/^([0-9]+)(?:px)?$/i);
        const width = Math.min(900,Math.max(40,
          wm ? Number(wm[1]) : defaultWidth
        ));

        const dimension = 10000;

        const rects = areas.map((a:any)=>({
          x1:Math.round(a.x*dimension),
          y1:Math.round(a.y*dimension),
          x2:Math.round((a.x+a.w)*dimension),
          y2:Math.round((a.y+a.h)*dimension),
          url:a.url.trim(),
          title:String(a.title||"Abrir link")
        }));

        const xs = Array.from(new Set([
          0,dimension,...rects.flatMap((r:any)=>[r.x1,r.x2])
        ])).sort((a,b)=>a-b);

        const ys = Array.from(new Set([
          0,dimension,...rects.flatMap((r:any)=>[r.y1,r.y2])
        ])).sort((a,b)=>a-b);

        const file = match[1];
        const height = width/ratio;

        const bodyRows = ys.slice(0,-1).map((top,ri)=>{
          const bottom=ys[ri+1];

          const cells=xs.slice(0,-1).map((left,ci)=>{
            const right=xs[ci+1];
            if(right<=left||bottom<=top)return "";

            const mx=(left+right)/2;
            const my=(top+bottom)/2;

            const target=rects.find((r:any)=>
              mx>=r.x1 && mx<r.x2 &&
              my>=r.y1 && my<r.y2
            );


          // HOTSPOT_SEAMLESS_INTEGER_GRID_V1
          // Calcular bordas compartilhadas em pixels inteiros.
          const cellX1=Math.round(width*left/dimension);
          const cellX2=Math.round(width*right/dimension);
          const cellY1=Math.round(height*top/dimension);
          const cellY2=Math.round(height*bottom/dimension);
          const cellWidthPx=cellX2-cellX1;
          const cellHeightPx=cellY2-cellY1;
          if(cellWidthPx<=0||cellHeightPx<=0)return "";

            const src="https://disparo.digitaletextil.com.br/hotspot-slice/"
              +file+
              `?x=${left}&y=${top}&w=${right-left}&h=${bottom-top}`;

            const image=`<img src="${esc(src)}"
              alt="${esc(target?.title||"")}"
              width="${cellWidthPx}"
              height="${cellHeightPx}"
              style="display:block;width:${cellWidthPx}px;height:${cellHeightPx}px;max-width:none;margin:0;padding:0;border:0;outline:0;vertical-align:top;" />`;

            const linked=target
              ? `<a href="${esc(target.url)}" target="_blank"
                  style="display:block;text-decoration:none;">${image}</a>`
              : image;

            return `<td width="${cellWidthPx}"
              height="${cellHeightPx}"
              valign="top"
              style="width:${cellWidthPx}px;height:${cellHeightPx}px;padding:0;margin:0;border:0;font-size:0;line-height:0;vertical-align:top;">
                ${linked}
              </td>`;
          }).join("");

          return `<tr style="padding:0;margin:0;">${cells}</tr>`;
        }).join("");

        return `<tr><td align="${esc(s["textAlign"]||"left")}"
          style="${pad(s)}font-size:0;line-height:0;">
          <table role="presentation"
            width="${width}"
            cellpadding="0" cellspacing="0" border="0"
            style="border-collapse:collapse;border-spacing:0;table-layout:fixed;width:${width}px;max-width:100%;">
            ${bodyRows}
          </table>
        </td></tr>`;
      }

      const image = `<img src="${esc(safeUrl(content.url))}" alt="${esc(content.alt ?? (block.type === "logo" ? "Logo Digitale Têxtil" : ""))}" width="${width}" style="display:inline-block;width:${width}px;max-width:100%;height:auto;border:0;border-radius:${esc(s["borderRadius"] ?? "0")};vertical-align:middle;" />`;

      const imageContent = href
        ? `<a href="${esc(href)}" target="_blank" style="display:inline-block;max-width:100%;text-decoration:none;">${image}</a>`
        : image;

      // MOBILE_PDF_HTML_V2
      const rawUrl = String(content.url ?? "");

      if (
        block.type === "image" &&
        rawUrl.includes("/pdf-campaigns/")
      ) {
        
const mobileUrl = esc(safeUrl(
          rawUrl.replace(/-mobile\.jpg(?=$|[?#])/i, ".png")
        ));

        const originalUrl = esc(safeUrl(
          rawUrl.replace(/-mobile\.jpg(?=$|[?#])/i, ".png")
        ));

        const img = `<img
          src="${mobileUrl}"
          alt="Pagina do material"
          width="600"
          style="display:block;width:100%;max-width:600px;
          height:auto;border:0;outline:none;text-decoration:none;"
        />`;

        return `<tr>
          <td align="center" style="padding:0;width:100%;">
            <a href="${originalUrl}" target="_blank"
               style="display:block;text-decoration:none;">
              ${img}
            </a>
            <div style="font-family:Arial,Helvetica,sans-serif;
              font-size:14px;line-height:20px;text-align:center;
              padding:12px 4px 18px;">
              <a href="${originalUrl}" target="_blank"
                 style="color:#145078;text-decoration:underline;">
                Toque para abrir a pagina em alta resolucao
              </a>
            </div>
          </td>
        </tr>`;
      }


      return `<tr><td align="${align}" style="${pad(s)}text-align:${align};">${imageContent}</td></tr>`;
    }
    case "title":
      return `<tr><td align="${align}" style="${pad(s)}${textCardCss(s)}"><h2 style="margin:0;font-size:${esc(s["fontSize"] ?? "24px")};font-family:${emailFontFamily(s)};font-weight:${esc(s["fontWeight"] ?? "bold")};color:${esc(s["color"] ?? "#1e2d4d")};">${renderLineBreakContent(content)}</h2></td></tr>`;
    case "text":
    case "footer":
      return `<tr><td align="${align}" style="${pad(s)}${textCardCss(s)}"><p style="margin:0;font-size:${esc(s["fontSize"] ?? "16px")};font-family:${emailFontFamily(s)};line-height:${esc(s["lineHeight"] ?? "1.5")};color:${esc(s["color"] ?? "#5b6579")};">${renderLineBreakContent(content)}</p></td></tr>`;
    // DIGITALE_OUTLOOK_BUTTON_TABLE_V1
    case "button": {
      const background = esc(s["backgroundColor"] ?? "#ee6c1f");
      const foreground = esc(s["color"] ?? "#ffffff");
      const radius = esc(s["borderRadius"] ?? "6px");
      const href = esc(safeUrl(content.url));
      const text = esc(content.text ?? "Saiba mais");
      const font = emailFontFamily(s);

      return `<tr>
        <td align="${align}" style="${pad(s)}text-align:${align};">
          <table role="presentation"
            cellpadding="0" cellspacing="0" border="0"
            align="${align}"
            style="border-collapse:separate;margin:${align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0"};">
            <tr>
              <td align="center"
                bgcolor="${background}"
                style="background-color:${background};
                border-radius:${radius};
                padding:12px 24px;
                mso-padding-alt:12px 24px;">
                <a href="${href}"
                  target="_blank"
                  style="font-family:${font};
                  font-size:14px;
                  line-height:20px;
                  font-weight:bold;
                  color:${foreground};
                  text-decoration:none;
                  display:inline-block;">
                  <span style="color:${foreground};
                    text-decoration:none;">${text}</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    }
    case "divider":
      return `<tr><td style="${pad(s)}"><hr style="border:0;border-top:1px solid #e4e7ef;margin:0;" /></td></tr>`;
    case "spacer":
      return `<tr><td style="height:24px;line-height:24px;font-size:0;">&nbsp;</td></tr>`;
    // DIGITALE_ADVANCED_BLOCKS_V1
    case "column":
    case "columns-2":
    case "columns-3": {
      const count = block.type === "columns-3" ? 3 :
        block.type === "columns-2" ? 2 : 1;
      const parts = String(content.text ?? "").split("|");
      const width = Math.floor(100 / count);
      const cells = Array.from({ length: count }, (_, i) =>
        `<td width="${width}%" valign="top" style="padding:12px;border:1px solid #e2e8f0;font-size:${esc(s["fontSize"] ?? "16px")};font-family:${emailFontFamily(s)};color:${esc(s["color"] ?? "#1e293b")};word-break:break-word;">${esc(parts[i]?.trim() || `Coluna ${i + 1}`)}</td>`
      ).join("");
      return `<tr><td style="${pad(s)}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table></td></tr>`;
    }
    case "image-text":
      return `<tr><td style="${pad(s)}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="45%" valign="middle" style="padding-right:12px;"><img src="${esc(safeUrl(content.url))}" alt="${esc(content.alt ?? "")}" width="240" style="display:block;max-width:100%;height:auto;border:0;" /></td><td width="55%" valign="middle" style="font-size:${esc(s["fontSize"] ?? "16px")};font-family:${emailFontFamily(s)};color:${esc(s["color"] ?? "#1e293b")};">${esc(content.text)}</td></tr></table></td></tr>`;
    case "social": {
      const links = content.socialLinks as Record<string, unknown> | undefined;

      if (!links) {
        return `<tr><td align="${align}" style="${pad(s)}"><a href="${esc(safeUrl(content.url))}" style="font-size:14px;color:#2563eb;text-decoration:underline;">${esc(content.text ?? "Rede social")}</a></td></tr>`;
      }

      const color = /^#[0-9a-f]{6}$/i.test(String(s.socialColor))
        ? String(s.socialColor).slice(1) : "EC6C20";
      const size = Math.max(16, Math.min(64, Number(s.socialSize) || 30));
      const gap = Math.max(0, Math.min(40, Number(s.socialGap) || 12));
      const networks = ["instagram", "facebook", "site"];

      const cells = networks.map(network => {
        const href = safeUrl(String(links[network] || "").trim());
        if (!/^https?:\/\//i.test(href)) return "";

        const src = `https://disparo.digitaletextil.com.br/social-icon/${network}/${color}.png`;

        return `<td align="center" style="padding:0 ${Math.floor(gap/2)}px;">
          <a href="${esc(href)}" target="_blank" style="text-decoration:none;">
          <img src="${src}" alt="${network}" width="${size}" height="${size}"
          style="display:block;width:${size}px;height:${size}px;border:0;" /></a></td>`;
      }).join("");

      if (!cells) return "";

      return `<tr><td align="${align}" style="${pad(s)}">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="${align}">
          <tr>${cells}</tr>
        </table></td></tr>`;
    }
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
  const hasPdfPages = blocks.some(
    b => b.type === "image" &&
      String(b.content?.url ?? "").includes("/pdf-campaigns/")
  );

  const tableWidth = hasPdfPages ? "100%" : "600";
  const tableCssWidth = hasPdfPages ? "100%" : "600px";
  // DIGITALE_OUTLOOK_CONTAINER_V1
  // PDF em paginas preserva a estrutura sem espacos adicionais.
  const emailRows = hasPdfPages
    ? rows
    : `<tr><td style="padding:24px;" bgcolor="#ffffff">
        <table role="presentation" width="100%"
          cellpadding="0" cellspacing="0" border="0"
          style="width:100%;border-collapse:collapse;">
          ${rows}
        </table>
      </td></tr>`;

  const fontIds = Array.from(new Set(
    blocks
      .map((block) => customFontFile(block.styles ?? {}))
      .filter((id): id is string => id !== null)
  ));

  const fontStyles = fontIds.map((id) => {
    const hash = id.split(".")[0];
    const format = id.endsWith(".woff2")
      ? "woff2"
      : id.endsWith(".woff")
        ? "woff"
        : "truetype";

    return `@font-face {
      font-family: "DigitaleFont-${hash}";
      src: url("https://disparo.digitaletextil.com.br/editor-fonts/${id}")
        format("${format}");
      font-display: swap;
    }`;
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${esc(title)}</title>
    ${fontStyles ? `<style type="text/css">${fontStyles}</style>` : ""}
  </head>
  <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="${tableWidth}" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#ffffff" style="width:${tableCssWidth};max-width:100%;background-color:#ffffff;border-collapse:collapse;">
            ${emailRows}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
