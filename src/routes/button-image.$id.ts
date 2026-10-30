import { createFileRoute } from "@tanstack/react-router";

const STORAGE = "/var/www/TESTE_DISPARO/storage/button-images";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const Route = createFileRoute("/button-image/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.id;
        if (!/^[a-f0-9]{64}$/.test(id))
          return new Response("Imagem nao encontrada", { status: 404 });

        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const dir = STORAGE;
        const url = new URL(request.url);
        let meta: {
          fileName: string;
          mime: string;
          extension: string;
        };

        try {
          meta = JSON.parse(
            await fs.readFile(path.join(dir, id + ".json"), "utf8")
          );
        } catch {
          return new Response("Imagem nao encontrada", { status: 404 });
        }

        const mode = url.searchParams.get("mode");

        if (mode === "preview" || mode === "download") {
          try {
            const bytes = await fs.readFile(
              path.join(dir, id + (mode === "preview" ? ".jpg" : ".orig"))
            );
            const headers: Record<string, string> = {
              "Content-Type": mode === "preview" ? "image/jpeg" : meta.mime,
              "Content-Length": String(bytes.length),
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "public, max-age=86400"
            };

            if (mode === "download") {
              const safeName = ("imagem." + meta.extension)
                .replace(/[^a-zA-Z0-9._-]/g, "");
              headers["Content-Disposition"] =
                `attachment; filename="${safeName}"; filename*=UTF-8''${
                  encodeURIComponent(meta.fileName)
                }`;
            }

            return new Response(bytes, { headers });
          } catch {
            return new Response("Imagem nao encontrada", { status: 404 });
          }
        }

        const name = escapeHtml(meta.fileName);
        const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Visualizar imagem - Digitale</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#10141c;color:white;
font-family:Arial,Helvetica,sans-serif;min-height:100vh}
header{display:flex;align-items:center;justify-content:space-between;
gap:16px;padding:16px 24px;background:#1b2230}
header strong{overflow-wrap:anywhere;font-size:14px}
.actions{display:flex;gap:10px;flex-wrap:wrap}
a.action{background:#ec6c20;color:white;text-decoration:none;
border-radius:8px;padding:12px 18px;font-size:14px;font-weight:bold}
a.secondary{background:#323b4c}
main{display:flex;align-items:center;justify-content:center;
padding:24px;min-height:calc(100vh - 90px)}
img{display:block;max-width:100%;max-height:85vh;
width:auto;height:auto;object-fit:contain;border-radius:4px}
@media(max-width:650px){header{flex-direction:column;align-items:stretch}
.actions a{flex:1;text-align:center}main{padding:12px}}
</style>
</head>
<body>
<header>
<strong>${name}</strong>
<div class="actions">
<a class="action" href="?mode=download">Baixar imagem</a>
<a class="action secondary" href="javascript:history.back()"
onclick="return false" style="display:none">Voltar</a>
</div>
</header>
<main><img src="?mode=preview" alt="${name}"></main>
</body></html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy":
              "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
          }
        });
      }
    }
  }
});
