
import { createFileRoute } from "@tanstack/react-router";
import { handleOpenTrackingRequest }
  from "@/lib/disparo-open-pixel.server";

// Trava: nao liberar antes de validar envio e SQL.
const TRACKING_RELEASED = true;

const GIF = "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export const Route = createFileRoute("/track/open")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!TRACKING_RELEASED) {
          const image = Uint8Array.from(
            Buffer.from(GIF, "base64")
          );

          return new Response(
            image.buffer as ArrayBuffer,
            {
              status: 200,
              headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "no-store, max-age=0",
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer",
                "Cross-Origin-Resource-Policy":
                  "cross-origin"
              }
            }
          );
        }

        return handleOpenTrackingRequest(request);
      }
    }
  }
});
