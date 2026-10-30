import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// DIGITALE_EDITOR_FONTS_API_V1
const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-fonts";
const MAX_BYTES = 2 * 1024 * 1024;

const inputSchema = z.object({
  fileName: z.string().min(1).max(150),
  base64: z.string().min(1).max(2_900_000),
});

function detectFont(buffer: Buffer): "woff2" | "woff" | "ttf" {
  const signature = buffer.subarray(0, 4).toString("ascii");

  if (signature === "wOF2" && buffer.length >= 48) {
    if (buffer.readUInt32BE(8) !== buffer.length) {
      throw new Error("Arquivo WOFF2 inválido.");
    }
    return "woff2";
  }

  if (signature === "wOFF" && buffer.length >= 44) {
    if (buffer.readUInt32BE(8) !== buffer.length) {
      throw new Error("Arquivo WOFF inválido.");
    }
    return "woff";
  }

  if (
    buffer.length >= 12 &&
    buffer.readUInt32BE(0) === 0x00010000
  ) {
    return "ttf";
  }

  throw new Error("Fonte inválida. Use WOFF2, WOFF ou TTF.");
}

export const uploadEditorFont = createServerFn({
  method: "POST",
})
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireDisparoUser } = await import(
      "./disparo-auth.server"
    );

    await requireDisparoUser({ allowSdk: true });

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const crypto = await import("node:crypto");

    const raw = data.base64.replace(
      /^data:[^,]*;base64,/i,
      ""
    );

    if (
      raw.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)
    ) {
      throw new Error("Conteúdo inválido.");
    }

    const bytes = Buffer.from(raw, "base64");

    if (!bytes.length || bytes.length > MAX_BYTES) {
      throw new Error("A fonte deve ter no máximo 2 MB.");
    }

    const ext = detectFont(bytes);

    const originalExt = path.extname(data.fileName)
      .toLowerCase()
      .replace(".", "");

    if (originalExt !== ext) {
      throw new Error("A extensão não corresponde ao arquivo.");
    }

    // DIGITALE_FONT_SCAN_VALIDATION_V1
    // Valida a fonte em um diretorio temporario antes de salva-la.
    const os = await import("node:os");
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");

    const temporaryDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "disparo-font-")
    );

    try {
      const temporaryFile = path.join(
        temporaryDirectory,
        `candidate.${ext}`
      );

      await fs.writeFile(temporaryFile, bytes, {
        mode: 0o600,
      });

      const run = promisify(execFile);
      const { stdout } = await run(
        "fc-scan",
        ["--format=%{family}\\n", temporaryFile],
        {
          timeout: 5000,
          maxBuffer: 4096,
        }
      );

      if (!stdout.trim()) {
        throw new Error("Fonte nao reconhecida.");
      }
    } catch {
      throw new Error(
        "Arquivo de fonte invalido ou incompatível."
      );
    } finally {
      await fs.rm(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }

    const displayName = path.basename(
      data.fileName,
      path.extname(data.fileName)
    ).replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 80);

    if (!displayName) {
      throw new Error("Nome da fonte inválido.");
    }

    await fs.mkdir(STORAGE, { recursive: true });

    const hash = crypto
      .createHash("sha256")
      .update(bytes)
      .digest("hex");

    const id = `${hash}.${ext}`;

    try {
      await fs.writeFile(path.join(STORAGE, id), bytes, {
        flag: "wx",
        mode: 0o644,
      });
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) throw error;
    }

    const metadata = {
      id,
      name: displayName,
      format: ext,
      size: bytes.length,
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(STORAGE, `${hash}.json`),
      JSON.stringify(metadata),
      { flag: "wx", mode: 0o644 }
    ).catch((error) => {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) throw error;
    });

    return metadata;
  });

export const listEditorFonts = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireDisparoUser } = await import(
    "./disparo-auth.server"
  );

  await requireDisparoUser({ allowSdk: true });

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  await fs.mkdir(STORAGE, { recursive: true });

  const entries = await fs.readdir(STORAGE);

  const result = await Promise.all(
    entries
      .filter((name) =>
        /^[a-f0-9]{64}\.(woff2|woff|ttf)$/.test(name)
      )
      .map(async (id) => {
        const stat = await fs.stat(path.join(STORAGE, id));

        const metadata = await fs.readFile(
          path.join(
            STORAGE,
            id.replace(/\.(woff2|woff|ttf)$/, ".json")
          ),
          "utf8"
        ).then(JSON.parse).catch(() => null);

        return {
          id,
          name: typeof metadata?.name === "string"
            ? metadata.name
            : id,
          format: id.split(".").pop() ?? "",
          size: stat.size,
          createdAt: typeof metadata?.createdAt === "string"
            ? metadata.createdAt
            : stat.birthtime.toISOString(),
        };
      })
  );

  return result.sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
});
