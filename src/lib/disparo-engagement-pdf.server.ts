import { spawnSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireDisparoUser } from "./disparo-auth.server";

// DIGITALE_ENGAGEMENT_PDF_V1

function decode(value: string | undefined): string {
  if (!value || !/^(?:[0-9a-f]{2})*$/i.test(value)) {
    return "";
  }
  return Buffer.from(value, "hex").toString("utf8");
}

function clean(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?");
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
    timeout: 30000,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...env, MYSQL_PWD: env["DB_PASSWORD"] }
  });

  if (result.error || result.status !== 0) {
    console.error(
      "[ENGAGEMENT_PDF_SQL]",
      result.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      result.error?.code ||
      "mysql_error"
    );
    throw new Error("Consulta do relatorio indisponivel.");
  }

  return result.stdout.trim()
    ? result.stdout.trim().split("\n")
        .map(line => line.split("\t"))
    : [];
}

export async function createEngagementPdfDB() {
  const user = await requireDisparoUser();

  if (![
    "Desenvolvedor",
    "Diretoria",
    "Gerência"
  ].includes(user.role)) {
    throw new Error("Acesso nao autorizado.");
  }

  // Mesmo filtro do Dashboard: campanhas nao arquivadas.
  // Limite de seguranca: nunca entregar PDF incompleto.
  const data = query(`
    SELECT
      HEX(COALESCE(
        MAX(NULLIF(TRIM(c.name), '')),
        MAX(r.recipient_email)
      )),
      HEX(MAX(r.recipient_email)),
      COUNT(*),
      COUNT(DISTINCT l.campaign_id),
      DATE_FORMAT(
        MAX(e.occurred_at),
        '%Y-%m-%dT%H:%i:%s'
      )
    FROM disparo_click_events e
    INNER JOIN disparo_tracking_links l
      ON BINARY l.id = BINARY e.link_id
    INNER JOIN disparo_campaign_recipients r
      ON BINARY r.attempt_id = BINARY l.attempt_id
     AND BINARY r.campaign_id = BINARY l.campaign_id
    LEFT JOIN disparo_contacts c
      ON BINARY c.id = BINARY r.contact_id
    INNER JOIN disparo_campaigns cp
      ON BINARY cp.id = BINARY l.campaign_id
    WHERE cp.archived_at IS NULL
    GROUP BY LOWER(TRIM(r.recipient_email))
    ORDER BY COUNT(*) DESC, MAX(r.recipient_email)
    LIMIT 1001;
  `);

  if (data.length > 1000) {
    throw new Error(
      "Relatorio excede 1000 destinatarios. " +
      "O PDF nao foi gerado para evitar dados incompletos."
    );
  }

  const rows = data.map(r => ({
    name: decode(r[0]),
    email: decode(r[1]),
    clicks: Number(r[2] || 0),
    campaigns: Number(r[3] || 0),
    last: r[4] || ""
  }));

  const pdf = await PDFDocument.create();
  pdf.setTitle("Relatorio de Engajamento - Digitale Textil");
  pdf.setCreator("Disparo Digitale");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // A4 paisagem: mesmo padrao do PDF de Aberturas.
  const W = 841.89;
  const H = 595.28;
  const margin = 30;
  const widths = [155, 260, 65, 85, 115];
  const headers = [
    "Nome", "E-mail", "Cliques",
    "Campanhas", "Ultimo clique"
  ];

  const dark = rgb(0.08, 0.15, 0.27);
  const muted = rgb(0.38, 0.44, 0.53);
  const pale = rgb(0.92, 0.94, 0.97);
  const orange = rgb(0.92, 0.42, 0.13);

  let page: any;
  let y = 0;
  let pageNumber = 0;

  const generated = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });

  const totalClicks = rows.reduce(
    (sum, row) => sum + row.clicks, 0
  );

  function draw(
    value: unknown,
    x: number,
    atY: number,
    size = 8,
    heavy = false,
    color = dark
  ) {
    page.drawText(clean(value), {
      x, y: atY, size,
      font: heavy ? bold : regular,
      color
    });
  }

  function wrap(value: string, width: number): string[] {
    const result: string[] = [];
    let line = "";

    for (const ch of clean(value || "Nao informado")) {
      if (
        regular.widthOfTextAtSize(line + ch, 8) >
        width - 12 && line
      ) {
        result.push(line);
        line = "";
      }
      line += ch;
    }

    result.push(line);

    // Evitar que um valor excessivamente longo
    // ocupe varias paginas ou sobreponha outras linhas.
    return result.slice(0, 3);
  }

  function startPage() {
    page = pdf.addPage([W, H]);
    pageNumber++;

    draw("DIGITALE TEXTIL", margin, H - 35, 12, true);
    draw(
      "RELATORIO DE ENGAJAMENTO",
      margin, H - 57, 17, true
    );

    draw(
      "Campanhas nao arquivadas | Todos os periodos",
      margin, H - 76, 9, false, muted
    );

    draw(
      "Destinatarios: " + rows.length +
      " | Cliques: " + totalClicks,
      margin, H - 93, 9
    );

    draw(
      "Gerado em: " + generated,
      margin, H - 108, 8, false, muted
    );

    y = H - 143;

    page.drawRectangle({
      x: margin - 5,
      y: y - 10,
      width: W - 2 * margin + 10,
      height: 27,
      color: pale
    });

    let x = margin;

    headers.forEach((header, i) => {
      draw(header, x, y, 8, true);
      x += widths[i];
    });

    y -= 28;

    page.drawLine({
      start: {x: margin, y: 30},
      end: {x: W - margin, y: 30},
      color: pale
    });

    draw(
      "Disparo Digitale",
      margin, 17, 7, false, muted
    );

    draw(
      "Pagina " + pageNumber,
      W - 85, 17, 7, false, muted
    );
  }

  startPage();

  for (const row of rows) {
    let lastClick = "Nao informado";

    if (row.last) {
      const date = new Date(row.last + "Z");

      if (!Number.isNaN(date.getTime())) {
        lastClick = date.toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    }

    const values = [
      row.name || "Nao informado",
      row.email,
      String(row.clicks),
      String(row.campaigns),
      lastClick
    ];

    const cells = values.map(
      (value, i) => wrap(value, widths[i])
    );

    const maxLines = Math.max(
      ...cells.map(lines => lines.length)
    );

    const height = Math.max(
      31,
      maxLines * 11 + 12
    );

    if (y - height < 46) {
      startPage();
    }

    const top = y;

    if (rows.indexOf(row) % 2 === 1) {
      page.drawRectangle({
        x: margin - 5,
        y: top - height + 12,
        width: W - 2 * margin + 10,
        height,
        color: rgb(0.975, 0.98, 0.99)
      });
    }

    let x = margin;

    cells.forEach((lines, i) => {
      lines.forEach((line, j) => {
        draw(
          line,
          x,
          top - j * 11,
          8,
          false,
          i === 2 ? orange : dark
        );
      });

      x += widths[i];
    });

    y -= height;
  }

  const bytes = await pdf.save();

  return {
    filename: "relatorio-engajamento-digitale.pdf",
    content: Buffer.from(bytes).toString("base64")
  };
}
