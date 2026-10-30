import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-pdfs";
const BASE = "https://disparo.digitaletextil.com.br";
const MAX_BYTES = 25 * 1024 * 1024;

export const uploadEditorPdf = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({
    fileName: z.string().min(1).max(255),
    base64: z.string().min(1).max(36_000_000)
  }).parse(input))
  .handler(async ({ data }) => {
    const { requireDisparoUser } =
      await import("./disparo-auth.server");
    await requireDisparoUser({ allowSdk: true });

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const crypto = await import("node:crypto");
    const { PDFDocument } = await import("pdf-lib");

    if (!/\.pdf$/i.test(data.fileName)) {
      throw new Error("Selecione um arquivo PDF.");
    }

    const raw = data.base64.replace(
      /^data:application\/pdf;base64,/i, ""
    );

    if (
      raw.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)
    ) {
      throw new Error("PDF em base64 invalido.");
    }

    const buffer = Buffer.from(raw, "base64");

    if (
      !buffer.length ||
      buffer.length > MAX_BYTES ||
      buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
      throw new Error("PDF invalido ou maior que 25 MB.");
    }

    try {
      const pdf = await PDFDocument.load(buffer, {
        updateMetadata: false
      });
      if (pdf.getPageCount() < 1) {
        throw new Error("PDF sem paginas.");
      }
    } catch {
      throw new Error("PDF corrompido ou protegido.");
    }

    const hash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    const id = `${hash}.pdf`;
    const filePath = path.join(STORAGE, id);
    const metadataPath = path.join(STORAGE, `${hash}.json`);

    await fs.mkdir(STORAGE, { recursive: true });

    try {
      await fs.writeFile(filePath, buffer, {
        flag: "wx",
        mode: 0o644
      });
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) throw error;
    }

    const name = path.basename(data.fileName)
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .slice(0, 120) || "documento.pdf";

    try {
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          id,
          name,
          size: buffer.length,
          createdAt: new Date().toISOString()
        }),
        { flag: "wx", mode: 0o644 }
      );
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) throw error;
    }

    return {
      id,
      url: `${BASE}/editor-pdfs/${id}`,
      fileName: name,
      size: buffer.length
    };
  });

export const listEditorPdfs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { requireDisparoUser } =
      await import("./disparo-auth.server");
    await requireDisparoUser({ allowSdk: true });

    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    await fs.mkdir(STORAGE, { recursive: true });

    const entries = await fs.readdir(STORAGE);
    const items = [];

    for (const name of entries) {
      if (!/^[a-f0-9]{64}\.pdf$/.test(name)) continue;

      const hash = name.slice(0, 64);
      const metadata = await fs.readFile(
        path.join(STORAGE, `${hash}.json`),
        "utf8"
      ).then(JSON.parse).catch(() => null);

      const stat = await fs.stat(path.join(STORAGE, name));

      items.push({
        id: name,
        url: `${BASE}/editor-pdfs/${name}`,
        fileName: metadata?.name || name,
        size: stat.size,
        createdAt: metadata?.createdAt ||
          stat.birthtime.toISOString()
      });
    }

    return items.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  });
