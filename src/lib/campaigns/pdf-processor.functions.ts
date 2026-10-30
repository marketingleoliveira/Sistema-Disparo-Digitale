import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE_URL = "https://disparo.digitaletextil.com.br";
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 12;
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

export const processPdfToEmail = createServerFn({
  method: "POST",
})
  .inputValidator((input) =>
    z.object({
      pdfBase64: z.string().max(36_000_000),
      fileName: z.string().min(1).max(255),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { requireDisparoUser } = await import(
      "../disparo-auth.server"
    );
    await requireDisparoUser();

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const os = await import("node:os");
    const crypto = await import("node:crypto");
    const child = await import("node:child_process");
    const util = await import("node:util");
    const { PDFDocument } = await import("pdf-lib");

    const execFile = util.promisify(child.execFile);

    const raw = data.pdfBase64.replace(
      /^data:application\/pdf;base64,/i,
      ""
    );

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
      throw new Error("Arquivo PDF inválido.");
    }

    const buffer = Buffer.from(raw, "base64");

    if (
      buffer.length === 0 ||
      buffer.length > MAX_PDF_BYTES ||
      buffer.subarray(0, 5).toString() !== "%PDF-"
    ) {
      throw new Error("PDF inválido ou maior que 25 MB.");
    }

    let pdf;
    try {
      pdf = await PDFDocument.load(buffer, {
        updateMetadata: false,
      });
    } catch {
      throw new Error(
        "Não foi possível abrir o PDF. Verifique se ele está protegido."
      );
    }

    const totalPages = pdf.getPageCount();

    if (totalPages < 1 || totalPages > MAX_PAGES) {
      throw new Error(
        `O PDF deve ter entre 1 e ${MAX_PAGES} páginas.`
      );
    }

    const id = crypto.randomUUID();
    const relativeDir = path.join("pdf-campaigns", id);
    const projectRoot = process.cwd();

    const persistentDir = path.join(
      "/var/lib/disparo-pdf-campaigns",
      id
    );

    const runtimeDir = path.join(
      projectRoot,
      ".output",
      "public",
      relativeDir
    );

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "disparo-pdf-")
    );

    const blocks = [];

    try {
      const pdfPath = path.join(tempDir, "original.pdf");

      await fs.writeFile(pdfPath, buffer, { mode: 0o600 });

      await fs.mkdir(persistentDir, { recursive: true });
      await fs.mkdir(runtimeDir, { recursive: true });

      for (let page = 1; page <= totalPages; page++) {
        const fileName =
          `pagina-${String(page).padStart(3, "0")}.png`;

        const tempImage = path.join(tempDir, fileName);

        await execFile("/usr/bin/gs", [
          "-dSAFER",
          "-dBATCH",
          "-dNOPAUSE",
          "-dQUIET",
          "-sDEVICE=png16m",
          "-r900",
          "-dDownScaleFactor=3",
          `-dFirstPage=${page}`,
          `-dLastPage=${page}`,
          `-sOutputFile=${tempImage}`,
          pdfPath,
        ], {
          timeout: 20000,
          maxBuffer: 1024 * 1024,
        });

        const imageInfo = await fs.stat(tempImage);

        if (
          imageInfo.size === 0 ||
          imageInfo.size > MAX_IMAGE_BYTES
        ) {
          throw new Error(
            `A página ${page} excedeu o limite de imagem.`
          );
        }

        await fs.copyFile(
          tempImage,
          path.join(persistentDir, fileName)
        );

        await fs.copyFile(
          tempImage,
          path.join(runtimeDir, fileName)
        );

        const url =
          `${BASE_URL}/pdf-campaigns/${id}/${fileName}`;

        
        // MOBILE_EMAIL_ASSETS_V2
        const mobileFileName = fileName.replace(/\.png$/i, "-mobile.jpg");

        if (mobileFileName === fileName) {
          throw new Error("Extensao PNG nao reconhecida.");
        }

        const mobileTempImage = path.join(tempDir, mobileFileName);
        let mobileReady = false;

        for (const [dpi, quality] of [
          [220, 95],
          [200, 93],
          [180, 92]
        ]) {
          await execFile("/usr/bin/gs", [
            "-dSAFER",
            "-dBATCH",
            "-dNOPAUSE",
            "-sDEVICE=jpeg",
            `-r${dpi}`,
            `-dJPEGQ=${quality}`,
            "-dTextAlphaBits=4",
            "-dGraphicsAlphaBits=4",
            `-dFirstPage=${page}`,
            `-dLastPage=${page}`,
            `-sOutputFile=${mobileTempImage}`,
            pdfPath,
          ], { timeout: 60000, maxBuffer: 8 * 1024 * 1024 });

          const info = await fs.stat(mobileTempImage);

          if (info.size > 0 && info.size <= 2500000) {
            mobileReady = true;
            break;
          }
        }

        if (!mobileReady) {
          throw new Error(
            "Nao foi possivel gerar imagem leve para celular."
          );
        }

        await fs.copyFile(
          mobileTempImage,
          path.join(persistentDir, mobileFileName)
        );

        await fs.copyFile(
          mobileTempImage,
          path.join(runtimeDir, mobileFileName)
        );
blocks.push({
          id: `pdf-${id}-${page}`,
          type: "image" as const,
          content: {
            url,
            alt: `Página ${page} de ${totalPages} da campanha`,
          },
          styles: {
            width: "100%",
            textAlign: "center",
            borderRadius: "0",
            paddingTop: "0",
            paddingBottom: "0",
          },
        });
        // Usar imagem leve no email, mantendo PNG original.
        const mobileBlock = blocks[blocks.length - 1] as
          | { type?: string; content?: { url?: string } }
          | undefined;

        if (
          mobileBlock?.type !== "image" ||
          !mobileBlock.content ||
          typeof mobileBlock.content.url !== "string"
        ) {
          throw new Error(
            "Bloco PDF sem URL de imagem valida."
          );
        }

        mobileBlock.content.url =
          `${BASE_URL}/${relativeDir}/${mobileFileName}`;

      }

      return {
        success: true,
        blocks,
        message:
          `${totalPages} página(s) convertida(s) com sucesso.`,
      };
    } catch (error) {
      await Promise.allSettled([
        fs.rm(persistentDir, {
          recursive: true,
          force: true,
        }),
        fs.rm(runtimeDir, {
          recursive: true,
          force: true,
        }),
      ]);

      throw new Error(
        error instanceof Error
          ? `Falha ao converter PDF: ${error.message}`
          : "Falha ao converter PDF."
      );
    } finally {
      await fs.rm(tempDir, {
        recursive: true,
        force: true,
      });
    }
  });
