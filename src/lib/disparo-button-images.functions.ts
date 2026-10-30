import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STORAGE = "/var/www/TESTE_DISPARO/storage/button-images";
const BASE = "https://disparo.digitaletextil.com.br";
const MAX_BYTES = 15 * 1024 * 1024;

const TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp",
  gif: "image/gif", bmp: "image/bmp",
  tif: "image/tiff", tiff: "image/tiff",
  avif: "image/avif", heic: "image/heic",
  heif: "image/heif",
};

function validImage(bytes: Buffer, ext: string): boolean {
  const a = bytes.toString("ascii", 0, 12);
  const box = bytes.toString("ascii", 4, 32);

  if (ext === "jpg" || ext === "jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (ext === "png")
    return bytes.subarray(0, 8).equals(
      Buffer.from([137,80,78,71,13,10,26,10]));
  if (ext === "gif")
    return a.startsWith("GIF87a") || a.startsWith("GIF89a");
  if (ext === "webp")
    return a.startsWith("RIFF") && a.slice(8,12) === "WEBP";
  if (ext === "bmp") return a.startsWith("BM");
  if (ext === "tif" || ext === "tiff")
    return a.startsWith("II*\x00") || a.startsWith("MM\x00*");
  if (ext === "avif")
    return box.includes("avif") || box.includes("avis");
  if (ext === "heic" || ext === "heif")
    return /heic|heix|hevc|hevx|mif1|msf1/.test(box);
  return false;
}

export const uploadButtonImage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      fileName: z.string().min(1).max(255),
      base64: z.string().min(1).max(21_000_000),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { requireDisparoUser } = await import("./disparo-auth.server");
    await requireDisparoUser({ allowSdk: true });

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const crypto = await import("node:crypto");
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");

    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "";
    if (!TYPES[ext]) throw new Error("Formato de imagem nao suportado.");

    const raw = data.base64.replace(/^data:[^,]*;base64,/i, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw) || raw.length % 4)
      throw new Error("Imagem invalida.");

    const bytes = Buffer.from(raw, "base64");

    if (!bytes.length || bytes.length > MAX_BYTES)
      throw new Error("Limite de 15 MB por imagem.");

    if (!validImage(bytes, ext))
      throw new Error("O conteudo nao corresponde a uma imagem valida.");

    const id = crypto.createHash("sha256").update(bytes).digest("hex");
    await fs.mkdir(STORAGE, { recursive: true });

    const original = path.join(STORAGE, id + ".orig");
    const preview = path.join(STORAGE, id + ".jpg");
    const metadata = path.join(STORAGE, id + ".json");

    try {
      await fs.writeFile(original, bytes, { flag: "wx", mode: 0o640 });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }

    try {
      await fs.access(preview);
    } catch {
      const temp = path.join(STORAGE, id + ".processing.jpg");
      try {
        await promisify(execFile)(
          "/usr/bin/convert",
          [
            "-limit", "memory", "128MiB",
            "-limit", "map", "256MiB",
            "-limit", "disk", "512MiB",
            "-limit", "time", "30",
            original + "[0]",
            "-auto-orient",
            "-thumbnail", "1800x1800>",
            "-background", "white",
            "-alpha", "remove",
            "-strip",
            "-quality", "88",
            temp
          ],
          { timeout: 35000, maxBuffer: 65536 }
        );
        await fs.rename(temp, preview);
      } catch {
        await fs.rm(temp, { force: true }).catch(() => {});
        throw new Error(
          "Nao foi possivel converter esta imagem. "
          + "Verifique se o formato possui suporte no servidor."
        );
      }
    }

    try {
      await fs.writeFile(
        metadata,
        JSON.stringify({
          id,
          fileName: data.fileName,
          mime: TYPES[ext],
          size: bytes.length,
          extension: ext,
          createdAt: new Date().toISOString()
        }),
        { flag: "wx", mode: 0o640 }
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }

    return { url: BASE + "/button-image/" + id };
  });
