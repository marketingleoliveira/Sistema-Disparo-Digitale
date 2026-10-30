import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-media";
const MAX_BYTES = 5 * 1024 * 1024;

function detectImage(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return { ext: "jpg", mime: "image/jpeg" };

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) return { ext: "png", mime: "image/png" };

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return { ext: "webp", mime: "image/webp" };

  throw new Error("Formato inválido. Use JPG, PNG ou WebP.");
}

export const uploadEditorImage = createServerFn({
  method: "POST",
})
  .inputValidator((input) =>
    z.object({
      fileName: z.string().min(1).max(255),
      base64: z.string().min(1).max(7_100_000),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { requireDisparoUser } = await import(
      "./disparo-auth.server"
    );

    await requireDisparoUser({ allowSdk: true });

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const crypto = await import("node:crypto");

    const raw = data.base64.replace(
      /^data:image\/(?:png|jpeg|webp);base64,/i,
      ""
    );

    if (
      raw.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)
    ) throw new Error("Imagem inválida.");

    const buffer = Buffer.from(raw, "base64");

    if (!buffer.length || buffer.length > MAX_BYTES) {
      throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const image = detectImage(buffer);

    await fs.mkdir(STORAGE, { recursive: true });

    const hash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    const id = `${hash}.${image.ext}`;
    const filePath = path.join(STORAGE, id);

    // DIGITALE_MEDIA_METADATA_V2
    let reused = false;
    try {
      await fs.writeFile(filePath, buffer, {
        flag: "wx",
        mode: 0o644,
      });
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) throw error;
      reused = true;
    }

    const metadataPath = path.join(STORAGE, `${hash}.json`);

    if (!reused) {
      const metadata = {
        id,
        name: data.fileName,
        mime: image.mime,
        size: buffer.length,
        createdAt: new Date().toISOString(),
      };

      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadata),
        { flag: "wx", mode: 0o644 }
      ).catch((error) => {
        if (
          (error as NodeJS.ErrnoException).code !== "EEXIST"
        ) throw error;
      });
    }

    return {
      id,
      fileName: data.fileName,
      mime: image.mime,
      size: buffer.length,
      reused,
    };
  });

export const listEditorImages = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireDisparoUser } = await import(
    "./disparo-auth.server"
  );

  await requireDisparoUser({ allowSdk: true });

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  await fs.mkdir(STORAGE, { recursive: true });

  const entries = await fs.readdir(STORAGE, {
    withFileTypes: true,
  });

  const images = await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          /^[a-f0-9]{64}\.(jpg|png|webp)$/.test(entry.name)
      )
      .map(async (entry) => {
        const stat = await fs.stat(
          path.join(STORAGE, entry.name)
        );

        const metadataPath = path.join(
          STORAGE,
          entry.name.replace(/\.(jpg|png|webp)$/, ".json")
        );

        const metadata = await fs.readFile(
          metadataPath, "utf8"
        ).then(JSON.parse).catch(() => null);

        return {
          id: entry.name,
          name: typeof metadata?.name === "string"
            ? metadata.name : entry.name,
          size: stat.size,
          createdAt: typeof metadata?.createdAt === "string"
            ? metadata.createdAt : stat.birthtime.toISOString(),
        };
      })
  );

  return images.sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
});
