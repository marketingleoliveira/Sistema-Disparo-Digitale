
import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";

// DIGITALE_BUTTON_PNG_GALLERY_V1

const STORAGE = "/var/lib/disparo-pdf-campaigns";
const BASE = "https://disparo.digitaletextil.com.br";

export const Route = createFileRoute("/button-gallery/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;

        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            .test(id)
        ) {
          return new Response("Nao encontrado", {
            status: 404
          });
        }

        const fs = await import("node:fs/promises");
        const path = await import("node:path");

        let entries: string[];

        try {
          entries = await fs.readdir(
            path.join(STORAGE, id)
          );
        } catch {
          return new Response("Nao encontrado", {
            status: 404
          });
        }

        const images = entries
          .filter(name =>
            /^pagina-\d{3}\.png$/.test(name)
          )
          .sort();

        if (!images.length || images.length > 12) {
          return new Response(
            "Galeria nao disponivel",
            { status: 404 }
          );
        }

        const imageHtml = images.map((name, index) => {
          const src =
            `${BASE}/pdf-campaigns/${id}/${name}`;

          return `<section class="page">
            <img
              src="${src}"
              alt="Pagina ${index + 1}"
              loading="${index === 0 ? "eager" : "lazy"}"
            >
          </section>`;
        }).join("\n");

        const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport"
 content="width=device-width,initial-scale=1">
<title>Visualizacao do material</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#f1f2f4}
body{font-family:Arial,Helvetica,sans-serif}
header{padding:18px;text-align:center;background:white;
color:#283142;font-size:14px}
main{max-width:1200px;margin:0 auto;padding:12px}
.page{margin:0 auto 15px;background:white}
.page img{display:block;width:100%;height:auto;
object-fit:contain}
footer{padding:20px;text-align:center;color:#666;
font-size:12px}
</style>
</head>
<body>
<header>Visualizacao do material ·
${images.length} pagina(s)</header>
<main>${imageHtml}</main>
<footer>Disparo Digitale</footer>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type":
              "text/html; charset=utf-8",
            "Cache-Control":
              "public, max-age=300",
            "X-Content-Type-Options":
              "nosniff",
            "Referrer-Policy":
              "no-referrer",
            "X-Frame-Options":
              "DENY",
            "Content-Security-Policy":
              "default-src 'none'; " +
              "img-src 'self'; " +
              "style-src 'unsafe-inline'; " +
              "base-uri 'none'; " +
              "form-action 'none'; " +
              "frame-ancestors 'none'"
          }
        });
      }
    }
  }
});
