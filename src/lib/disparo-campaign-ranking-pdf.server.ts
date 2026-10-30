import { spawnSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireDisparoUser } from "./disparo-auth.server";

// DIGITALE_CAMPAIGN_RANKING_PDF_V1

type Period = "geral" | "d7" | "d30" | "d90" | "m12";

const periods: Record<Period, string> = {
  geral: "",
  d7: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY",
  d30: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY",
  d90: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 90 DAY",
  m12: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 12 MONTH"
};

const periodLabels: Record<Period, string> = {
  geral: "Geral",
  d7: "Ultimos 7 dias",
  d30: "Ultimos 30 dias",
  d90: "Ultimos 90 dias",
  m12: "Ultimos 12 meses"
};

function decode(hex: string | undefined): string {
  if (!hex || !/^(?:[0-9a-f]{2})*$/i.test(hex)) {
    return "";
  }
  return Buffer.from(hex, "hex").toString("utf8");
}

function clean(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?");
}

export async function createCampaignRankingPdfDB(
  period: Period
) {
  const user = await requireDisparoUser();

  if (![
    "Desenvolvedor", "Diretoria", "Gerência"
  ].includes(user.role)) {
    throw new Error("Acesso nao autorizado.");
  }

  if (!Object.prototype.hasOwnProperty.call(periods, period)) {
    throw new Error("Periodo invalido.");
  }

  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("MariaDB nao configurado.");
  }

  // Mesma fonte do ranking, com exclusao de arquivadas.
  const sql = `
    SELECT
      HEX(cp.name),
      COUNT(*)
    FROM disparo_click_events e
    INNER JOIN disparo_tracking_links l
      ON BINARY l.id = BINARY e.link_id
    INNER JOIN disparo_campaigns cp
      ON BINARY cp.id = BINARY l.campaign_id
    WHERE cp.archived_at IS NULL
      ${periods[period]}
    GROUP BY BINARY cp.id, cp.name
    ORDER BY COUNT(*) DESC, cp.name
    LIMIT 2001;
  `;

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
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"]
    }
  });

  if (result.error || result.status !== 0) {
    console.error(
      "[CAMPAIGN_RANKING_PDF_SQL]",
      result.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      result.error?.code ||
      "mysql_error"
    );
    throw new Error("Falha ao consultar campanhas.");
  }

  const rows = result.stdout.trim()
    ? result.stdout.trim().split("\n").map(line => {
        const [name, clicks] = line.split("\t");
        return {
          name: decode(name) || "Campanha",
          clicks: Number(clicks || 0)
        };
      })
    : [];

  if (rows.length > 2000) {
    throw new Error(
      "Mais de 2000 campanhas com cliques. " +
      "O PDF nao foi gerado para evitar relatorio incompleto."
    );
  }

  const pdf = await PDFDocument.create();
  pdf.setTitle("Ranking de Campanhas - Digitale Textil");
  pdf.setCreator("Disparo Digitale");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 841.89;
  const H = 595.28;

  const navy = rgb(0.08, 0.15, 0.27);
  const muted = rgb(0.40, 0.45, 0.52);
  const pale = rgb(0.92, 0.94, 0.97);
  const orange = rgb(0.92, 0.42, 0.13);

  const totalClicks = rows.reduce(
    (sum, row) => sum + row.clicks, 0
  );

  const generated = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });

  let page: any;
  let y = 0;
  let pageNumber = 0;

  function draw(
    value: unknown,
    x: number,
    atY: number,
    size = 9,
    heavy = false,
    color = navy
  ) {
    page.drawText(clean(value), {
      x, y: atY, size,
      font: heavy ? bold : regular,
      color
    });
  }

  function fit(value: string, maxWidth: number): string {
    const raw = clean(value);
    if (regular.widthOfTextAtSize(raw, 9) <= maxWidth) {
      return raw;
    }

    let output = "";

    for (const character of raw) {
      if (
        regular.widthOfTextAtSize(
          output + character + "...", 9
        ) > maxWidth
      ) break;
      output += character;
    }

    return output + "...";
  }

  function startPage() {
    page = pdf.addPage([W, H]);
    pageNumber++;

    draw("DIGITALE TEXTIL", 30, H - 36, 12, true);
    draw("RANKING DE CAMPANHAS", 30, H - 59, 17, true);

    draw(
      "Periodo: " + periodLabels[period],
      30, H - 80, 9, false, muted
    );

    draw(
      "Campanhas: " + rows.length +
      " | Cliques registrados: " + totalClicks,
      30, H - 97, 9
    );

    draw(
      "Gerado em: " + generated,
      30, H - 114, 8, false, muted
    );

    y = H - 151;

    page.drawRectangle({
      x: 25,
      y: y - 10,
      width: W - 50,
      height: 28,
      color: pale
    });

    draw("POSICAO", 35, y, 9, true);
    draw("CAMPANHA", 125, y, 9, true);
    draw("CLIQUES", 700, y, 9, true);

    y -= 31;

    page.drawLine({
      start: { x: 30, y: 30 },
      end: { x: W - 30, y: 30 },
      color: pale
    });

    draw("Disparo Digitale", 30, 17, 7, false, muted);
    draw("Pagina " + pageNumber, W - 85, 17, 7, false, muted);
  }

  startPage();

  rows.forEach((row, index) => {
    if (y - 33 < 46) {
      startPage();
    }

    if (index % 2 === 1) {
      page.drawRectangle({
        x: 25,
        y: y - 13,
        width: W - 50,
        height: 33,
        color: rgb(0.975, 0.98, 0.99)
      });
    }

    draw(String(index + 1), 35, y, 9, true);

    draw(
      fit(row.name, 540),
      125, y, 9
    );

    draw(
      row.clicks.toLocaleString("pt-BR"),
      700, y, 9, true, orange
    );

    y -= 33;
  });

  if (!rows.length) {
    draw(
      "Nenhuma campanha com cliques neste periodo.",
      35, y, 10
    );
  }

  const bytes = await pdf.save();

  return {
    filename: "ranking-campanhas-" + period + ".pdf",
    content: Buffer.from(bytes).toString("base64")
  };
}
