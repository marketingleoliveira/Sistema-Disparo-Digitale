import { spawnSync } from "node:child_process";

const PAGE_SIZE = 50;

function sqlText(value: string): string {
  return "CONVERT(UNHEX('" +
    Buffer.from(value, "utf8").toString("hex") +
    "') USING utf8mb4)";
}

function decode(value: string | undefined): string {
  if (!value || !/^(?:[0-9a-f]{2})*$/i.test(value)) return "";
  return Buffer.from(value, "hex").toString("utf8");
}

function query(sql: string): string[][] {
  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Banco de dados nao configurado.");
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
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024,
    env: {...env, MYSQL_PWD: env["DB_PASSWORD"]}
  });

  if (result.error || result.status !== 0) {
    const errorCode =
      result.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      (result.error ? result.error.code : null) ||
      "mysql_exit_error";

    console.error("[DIGITALE_CLICK_DETAILS_SQL]", errorCode);
    throw new Error("Falha na consulta de detalhes.");
  }

  if (!result.stdout.trim()) return [];

  return result.stdout.trim()
    .split("\n")
    .map(line => line.split("\t"));
}

export function getClickDetailsDB(
  email: string,
  offset: number
) {
  const normalized = email.trim().toLowerCase();

  if (
    normalized.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error("E-mail invalido.");
  }

  if (
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    throw new Error("Paginacao invalida.");
  }

  const condition = `
    BINARY LOWER(TRIM(r.recipient_email)) =
    BINARY ${sqlText(normalized)}
  `;

  const summary = query(`
    SELECT
      COUNT(*),
      COUNT(DISTINCT l.campaign_id),
      COUNT(DISTINCT l.destination_url),
      COALESCE(
        DATE_FORMAT(
          MAX(e.occurred_at),
          '%Y-%m-%dT%H:%i:%s'
        ), ''
      )
    FROM disparo_click_events e
    JOIN disparo_tracking_links l
      ON BINARY l.id = BINARY e.link_id
    JOIN disparo_campaign_recipients r
      ON BINARY r.attempt_id = BINARY l.attempt_id
     AND BINARY r.campaign_id = BINARY l.campaign_id
    WHERE ${condition};
  `);

  const result = summary[0] ?? ["0", "0", "0", ""];

  const rows = query(`
    SELECT
      HEX(COALESCE(cp.name, '')),
      HEX(l.destination_url),
      DATE_FORMAT(
        e.occurred_at,
        '%Y-%m-%dT%H:%i:%s'
      ),
      HEX(e.id)
    FROM disparo_click_events e
    JOIN disparo_tracking_links l
      ON BINARY l.id = BINARY e.link_id
    JOIN disparo_campaign_recipients r
      ON BINARY r.attempt_id = BINARY l.attempt_id
     AND BINARY r.campaign_id = BINARY l.campaign_id
    LEFT JOIN disparo_campaigns cp
      ON BINARY cp.id = BINARY l.campaign_id
    WHERE ${condition}
    ORDER BY e.occurred_at DESC, e.id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset};
  `);

  const total = Number(result[0] || 0);

  return {
    summary: {
      clicks: total,
      campaigns: Number(result[1] || 0),
      links: Number(result[2] || 0),
      lastClickUtc: result[3] || ""
    },
    events: rows.map(row => ({
      campaign: decode(row[0]) || "Campanha",
      url: decode(row[1]),
      occurredAtUtc: row[2] || "",
      id: decode(row[3])
    })),
    nextOffset:
      offset + rows.length < total
        ? offset + rows.length
        : null
  };
}
