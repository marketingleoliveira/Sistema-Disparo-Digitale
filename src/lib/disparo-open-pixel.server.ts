
import {
  isValidTrackingToken,
  registerTrackedOpenAsync,
} from "./disparo-open-tracking.server";

const PIXEL_BASE64 =
  "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export async function handleOpenTrackingRequest(
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") ?? "";

  const enabled =
    process.env["DISPARO_OPEN_TRACKING_ENABLED"] !== "0";

  if (enabled && isValidTrackingToken(token)) {
    try {
      await registerTrackedOpenAsync(token);
    } catch (error) {
      console.error(
        "Falha interna ao registrar evento de abertura.", error instanceof Error ? error.message : "erro desconhecido"
      );
    }
  }

  const buffer = Buffer.from(
    PIXEL_BASE64,
    "base64"
  );

  const image = Uint8Array.from(buffer);

  return new Response(
    image.buffer as ArrayBuffer,
    {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control":
          "private, no-store, no-cache, max-age=0",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    }
  );
}


/** Insere o pixel somente no HTML individualizado. */
export function appendOpenTrackingPixel(
  html: string,
  token: string
): string {
  if (!isValidTrackingToken(token)) {
    throw new Error("Token invalido");
  }

  const src =
    "https://disparo.digitaletextil.com.br/track/open?t=" +
    encodeURIComponent(token);

  const tag =
    `<img src="${src}" width="1" height="1" alt="" ` +
    'style="display:none!important" />';

  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, tag + "</body>")
    : html + tag;
}
