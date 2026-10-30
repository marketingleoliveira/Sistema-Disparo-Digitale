import { createFileRoute } from "@tanstack/react-router";

const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-pdfs";

async function servePdf(filename: string, method: "GET" | "HEAD") {
  if (!/^[a-f0-9]{64}\.pdf$/.test(filename)) {
    return new Response("PDF nao encontrado", { status: 404 });
  }

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const hash = filename.slice(0, 64);
  const filePath = path.join(STORAGE, filename);

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return new Response("PDF nao encontrado", { status: 404 });
    }

    const metadata = await fs.readFile(
      path.join(STORAGE, `${hash}.json`), "utf8"
    ).then(JSON.parse).catch(() => null);

    const originalName = String(
      metadata?.name || "documento.pdf"
    );
    const safeName = originalName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\\r\n;]/g, "_")
      .slice(0, 120);

    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        `attachment; filename="${safeName}"`,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    };

    if (method === "HEAD") {
      return new Response(null, { headers });
    }

    const bytes = await fs.readFile(filePath);
    return new Response(bytes, { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response("PDF nao encontrado", { status: 404 });
    }
    throw error;
  }
}

export const Route = createFileRoute("/editor-pdfs/$filename")({
  server: {
    handlers: {
      GET: async ({ params }) =>
        servePdf(params.filename, "GET"),
      HEAD: async ({ params }) =>
        servePdf(params.filename, "HEAD")
    }
  }
});
