import { spawnSync } from "node:child_process";
import * as XLSX from "xlsx";
import { requireDisparoUser } from "./disparo-auth.server";
import { listPdfCampaignsDB } from "./disparo-open-pdf.server";
import { getDisparoCompanyDetailsDB } from "./disparo-company-details.server";

// DIGITALE_MULTI_OPEN_XLSX_V1

type Request = {
  campaignIds: string[];
  startDate: string;
  endDate: string;
};

function decode(hex: string | undefined): string {
  if (!hex || !/^(?:[0-9a-f]{2})*$/i.test(hex)) {
    return "";
  }
  return Buffer.from(hex, "hex").toString("utf8");
}

function dateUTC(value: string, nextDay = false): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Data invalida.");
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error("Data inexistente.");
  }

  const ms = date.getTime() + 3 * 3600000 +
    (nextDay ? 86400000 : 0);

  return new Date(ms).toISOString().slice(0, 19)
    .replace("T", " ");
}

function query(sql: string): string[][] {
  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("MariaDB nao configurado.");
  }

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names"
  ], {
    input: sql,
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"]
    }
  });

  if (result.error || result.status !== 0) {
    console.error(
      "[MULTI_OPEN_XLSX_SQL]",
      result.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      result.error?.code ||
      "mysql_error"
    );
    throw new Error("Consulta das aberturas indisponivel.");
  }

  return result.stdout.trim()
    ? result.stdout.trim().split("\n")
        .map(line => line.split("\t"))
    : [];
}

function formatOpened(value: string): string {
  if (!value) return "";

  const date = new Date(value.replace(" ", "T") + "Z");

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });
}

export async function createMultiOpenXlsxDB(input: Request) {
  const user = await requireDisparoUser();

  if (![
    "Desenvolvedor", "Diretoria", "Gerência"
  ].includes(user.role)) {
    throw new Error("Acesso nao autorizado.");
  }

  if (!Array.isArray(input.campaignIds)) {
    throw new Error("Campanhas invalidas.");
  }

  const ids = [...new Set(input.campaignIds)];

  if (ids.length < 1 || ids.length > 5) {
    throw new Error("Selecione entre 1 e 5 campanhas.");
  }

  if (input.startDate > input.endDate) {
    throw new Error("Periodo invalido.");
  }

  const first = dateUTC(input.startDate);
  const last = dateUTC(input.endDate, true);

  // Mesmo catalogo de campanhas permitido no PDF.
  const available = listPdfCampaignsDB();
  const byId = new Map(available.map(c => [c.id, c.name]));

  if (ids.some(id =>
    !/^[0-9A-F]{2,256}$/i.test(id) ||
    id.length % 2 !== 0 ||
    !byId.has(id)
  )) {
    throw new Error("Campanha nao encontrada ou arquivada.");
  }

  const workbook = XLSX.utils.book_new();
  const columns = [
    "Nome fantasia",
    "Razao social",
    "E-mail",
    "CNPJ",
    "Telefone",
    "Website",
    "Primeira abertura"
  ];

  let total = 0;

  for (let index = 0; index < ids.length; index++) {
    const campaignId = ids[index].toUpperCase();

    // Mesmos filtros de abertura do gerador PDF atual.
    const rows = query(`
      SELECT
        HEX(LOWER(TRIM(r.recipient_email))),
        DATE_FORMAT(
          MIN(e.occurred_at), '%Y-%m-%d %H:%i:%s'
        )
      FROM disparo_email_events e
      JOIN disparo_email_attempts a
        ON BINARY a.id = BINARY e.attempt_id
      JOIN disparo_campaign_recipients r
        ON BINARY r.attempt_id = BINARY a.id
       AND BINARY r.campaign_id = BINARY a.campaign_id
      JOIN disparo_campaigns cp
        ON BINARY cp.id = BINARY r.campaign_id
       AND cp.archived_at IS NULL
      WHERE e.event_type = 'open'
        AND a.status = 'accepted'
        AND a.send_kind = 'campaign'
        AND r.delivery_status = 'accepted'
        AND r.sent_at IS NOT NULL
        AND HEX(r.campaign_id) = '${campaignId}'
        AND e.occurred_at >= '${first}'
        AND e.occurred_at < '${last}'
      GROUP BY LOWER(TRIM(r.recipient_email))
      ORDER BY MIN(e.occurred_at) DESC
      LIMIT 301;
    `);

    if (rows.length > 300) {
      throw new Error(
        "Campanha com mais de 300 destinatarios. " +
        "Reduza o periodo."
      );
    }

    total += rows.length;

    if (total > 600) {
      throw new Error(
        "Mais de 600 destinatarios. " +
        "Selecione menos campanhas ou reduza o periodo."
      );
    }

    const content: (string | number)[][] = [columns];

    for (const row of rows) {
      const email = decode(row[0]);

      // Reutiliza o enriquecimento da ferramenta de Aberturas.
      const details = await getDisparoCompanyDetailsDB(email);

      content.push([
        details.tradeName || "Nao informado",
        details.legalName || "Nao informado",
        email,
        details.cnpj || "Nao informado",
        details.phone || "Nao informado",
        details.website || "Nao informado",
        formatOpened(row[1] || "")
      ]);
    }

    const sheet = XLSX.utils.aoa_to_sheet(content);

    sheet["!cols"] = [
      { wch: 26 },
      { wch: 34 },
      { wch: 40 },
      { wch: 22 },
      { wch: 20 },
      { wch: 42 },
      { wch: 25 }
    ];

    sheet["!autofilter"] = {
      ref: "A1:G" + content.length
    };

    // Nomes de abas unicos e compativeis com Excel.
    const name = `Campanha ${index + 1}`;

    XLSX.utils.book_append_sheet(
      workbook, sheet, name
    );
  }

  const content = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64"
  });

  return {
    filename:
      "aberturas-" + input.startDate +
      "-" + input.endDate + ".xlsx",
    content,
    total,
    campaigns: ids.length
  };
}
