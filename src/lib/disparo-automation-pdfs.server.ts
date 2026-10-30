import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireDisparoUser } from "./disparo-auth.server";

const ROOT = "/var/www/TESTE_DISPARO/storage/automation-pdfs";
const MAX_BYTES = 10 * 1024 * 1024;

export const PDF_SLOTS = {
  "digitale-newsletter": [
    "newsletter-segunda",
    "newsletter-quarta",
    "newsletter-sexta",
  ],
  "digitale-clientes": [
    "clientes-segunda",
    "clientes-quarta",
    "clientes-sexta",
  ],
  "digitale-interesse": [
    "interesse-estampas",
    "interesse-tecidos",
    "interesse-artigo-especifico",
  ],
} as const;

type AutomationId = keyof typeof PDF_SLOTS;

export type StoredAutomationPdf = {
  automationId: string;
  slotId: string;
  name: string;
  size: number;
  sha256: string;
  updatedAt: string;
};

function allowed(id: string, slot: string): id is AutomationId {
  if (!Object.prototype.hasOwnProperty.call(PDF_SLOTS, id)) {
    return false;
  }

  return (PDF_SLOTS[id as AutomationId] as readonly string[])
    .includes(slot);
}

function paths(id: string, slot: string) {
  if (!allowed(id, slot)) {
    throw new Error("Automacao ou disparo invalido.");
  }

  const directory = join(ROOT, id);

  return {
    directory,
    pdf: join(directory, `${slot}.pdf`),
    info: join(directory, `${slot}.json`),
  };
}

export async function saveAutomationPdf(input: {
  automationId: string;
  slotId: string;
  fileName: string;
  pdfBase64: string;
}): Promise<StoredAutomationPdf> {
  requireDisparoUser();

  const p = paths(input.automationId, input.slotId);

  if (
    typeof input.pdfBase64 !== "string" ||
    input.pdfBase64.length > 14_000_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(input.pdfBase64) ||
    input.pdfBase64.length % 4 !== 0
  ) {
    throw new Error("Dados do PDF invalidos.");
  }

  const bytes = Buffer.from(input.pdfBase64, "base64");

  if (
    bytes.length < 8 ||
    bytes.length > MAX_BYTES ||
    bytes.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error("Arquivo PDF invalido ou maior que 10 MB.");
  }

  const safeName = String(input.fileName || "documento.pdf")
    .replace(/[\\/\x00-\x1f\x7f]/g, "")
    .slice(0, 160);

  if (!safeName.toLowerCase().endsWith(".pdf")) {
    throw new Error("O arquivo deve ser PDF.");
  }

  const metadata: StoredAutomationPdf = {
    automationId: input.automationId,
    slotId: input.slotId,
    name: safeName,
    size: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    updatedAt: new Date().toISOString(),
  };

  await mkdir(p.directory, { recursive: true, mode: 0o700 });

  const unique = randomUUID();
  const tempPdf = `${p.pdf}.${unique}.tmp`;
  const tempInfo = `${p.info}.${unique}.tmp`;

  try {
    await writeFile(tempPdf, bytes, { mode: 0o600, flag: "wx" });
    await writeFile(
      tempInfo,
      JSON.stringify(metadata),
      { encoding: "utf8", mode: 0o600, flag: "wx" }
    );

    await rename(tempPdf, p.pdf);
    await rename(tempInfo, p.info);
  } finally {
    await rm(tempPdf, { force: true });
    await rm(tempInfo, { force: true });
  }

  return metadata;
}

export async function listAutomationPdfs(
  automationId: string
): Promise<StoredAutomationPdf[]> {
  requireDisparoUser();

  const slots = PDF_SLOTS[automationId as AutomationId];

  if (!slots) {
    throw new Error("Automacao invalida.");
  }

  const result: StoredAutomationPdf[] = [];

  for (const slot of slots) {
    const p = paths(automationId, slot);

    try {
      const metadata = JSON.parse(
        await readFile(p.info, "utf8")
      ) as StoredAutomationPdf;

      if (
        metadata.automationId === automationId &&
        metadata.slotId === slot
      ) {
        result.push(metadata);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  return result;
}

export async function getAutomationPdf(input: {
  automationId: string;
  slotId: string;
}): Promise<{ name: string; pdfBase64: string }> {
  requireDisparoUser();

  const p = paths(input.automationId, input.slotId);

  const metadata = JSON.parse(
    await readFile(p.info, "utf8")
  ) as StoredAutomationPdf;

  const bytes = await readFile(p.pdf);

  if (
    bytes.length !== metadata.size ||
    createHash("sha256").update(bytes).digest("hex") !==
      metadata.sha256
  ) {
    throw new Error("Arquivo inconsistente.");
  }

  return {
    name: metadata.name,
    pdfBase64: bytes.toString("base64"),
  };
}
