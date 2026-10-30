import * as XLSX from "xlsx";
import { createMultiOpenXlsxDB } from "./disparo-multi-open-xlsx.server";
import { listPdfCampaignsDB } from "./disparo-open-pdf.server";

// DIGITALE_MULTI_OPEN_CSV_V1
// Reutiliza a consulta, permissao e enriquecimento ja existentes.

type Request = {
  campaignIds: string[];
  startDate: string;
  endDate: string;
};

function safeCell(value: unknown): string {
  let text = String(value ?? "");

  // Evita que valores de clientes sejam interpretados
  // como formulas por programas de planilha.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

export async function createMultiOpenCsvDB(input: Request) {
  const result = await createMultiOpenXlsxDB(input);

  const workbook = XLSX.read(
    result.content,
    { type: "base64" }
  );

  const names = new Map(
    listPdfCampaignsDB().map(c => [
      c.id.toUpperCase(),
      c.name
    ])
  );

  const output: string[][] = [[
    "Campanha",
    "Nome fantasia",
    "Razao social",
    "E-mail",
    "CNPJ",
    "Telefone",
    "Website",
    "Primeira abertura"
  ]];

  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<string[]>(
      sheet,
      { header: 1, defval: "", raw: false }
    );

    const campaignId = input.campaignIds[index]
      ?.toUpperCase();

    const campaign = names.get(campaignId) ||
      "Campanha " + (index + 1);

    // Primeira linha de cada aba contem os cabecalhos.
    for (const row of rows.slice(1)) {
      if (!row.some(value => String(value).trim())) {
        continue;
      }

      output.push([
        campaign,
        ...Array.from(
          { length: 7 },
          (_, i) => String(row[i] ?? "")
        )
      ]);
    }
  });

  const csv = "\uFEFF" + output
    .map(row => row.map(safeCell).join(";"))
    .join("\r\n") + "\r\n";

  return {
    filename:
      "aberturas-" + input.startDate +
      "-" + input.endDate + ".csv",
    content: Buffer.from(csv, "utf8").toString("base64"),
    total: result.total,
    campaigns: result.campaigns
  };
}
