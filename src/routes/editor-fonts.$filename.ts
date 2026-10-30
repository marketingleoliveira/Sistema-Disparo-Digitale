import { createFileRoute } from "@tanstack/react-router";

// DIGITALE_EDITOR_FONT_ROUTE_V1
const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-fonts";

export const Route = createFileRoute("/editor-fonts/$filename")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const filename = params.filename;

        if (
          !/^[a-f0-9]{64}\.(woff2|woff|ttf)$/.test(filename)
        ) {
          return new Response("Fonte não encontrada", {
            status: 404,
          });
        }

        const fs = await import("node:fs/promises");
        const path = await import("node:path");

        try {
          const bytes = await fs.readFile(
            path.join(STORAGE, filename)
          );

          const mime = filename.endsWith(".woff2")
            ? "font/woff2"
            : filename.endsWith(".woff")
              ? "font/woff"
              : "font/ttf";

          return new Response(bytes, {
            headers: {
              "Content-Type": mime,
              "Cache-Control": "public, max-age=86400",
              "X-Content-Type-Options": "nosniff",
              "Access-Control-Allow-Origin":
                "https://disparo.digitaletextil.com.br",
            },
          });
        } catch (error) {
          if (
            (error as NodeJS.ErrnoException).code === "ENOENT"
          ) {
            return new Response("Fonte não encontrada", {
              status: 404,
            });
          }

          throw error;
        }
      },
    },
  },
});
