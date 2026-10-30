import { createFileRoute } from "@tanstack/react-router";

const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-media";

export const Route = createFileRoute("/editor-media/$filename")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const filename = params.filename;

        if (!/^[a-f0-9]{64}\.(jpg|png|webp)$/.test(filename)) {
          return new Response("Imagem não encontrada", { status: 404 });
        }

        const fs = await import("node:fs/promises");
        const path = await import("node:path");

        try {
          const bytes = await fs.readFile(path.join(STORAGE, filename));

          const mime = filename.endsWith(".png")
            ? "image/png"
            : filename.endsWith(".webp")
              ? "image/webp"
              : "image/jpeg";

          return new Response(bytes, {
            headers: {
              "Content-Type": mime,
              "Cache-Control": "public, max-age=86400",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return new Response("Imagem não encontrada", {
              status: 404,
            });
          }
          throw error;
        }
      },
    },
  },
});
