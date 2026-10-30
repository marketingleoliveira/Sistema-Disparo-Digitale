import { spawnSync } from "node:child_process";

export interface ClickEngagementContact {
  name: string;
  email: string;
  clicks: number;
  campaigns: number;
}

function decode(hex: string): string {
  return Buffer.from(hex, "hex").toString("utf8");
}

export function listClickEngagementRankingDB():
  ClickEngagementContact[] {

  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Banco de dados nao configurado.");
  }

  const sql = `
    SET STATEMENT max_statement_time=5 FOR
    SELECT
      HEX(COALESCE(
        MAX(NULLIF(TRIM(c.name), '')),
        MAX(r.recipient_email)
      )),
      HEX(MAX(r.recipient_email)),
      COUNT(*),
      COUNT(DISTINCT l.campaign_id)
    FROM disparo_click_events e
    INNER JOIN disparo_tracking_links l
      ON l.id = e.link_id
    INNER JOIN disparo_campaign_recipients r
      ON r.attempt_id = l.attempt_id
     AND r.campaign_id = l.campaign_id
    LEFT JOIN disparo_contacts c
      ON c.id = r.contact_id
    INNER JOIN disparo_campaigns cp
      ON cp.id = l.campaign_id
    WHERE cp.archived_at IS NULL
    GROUP BY LOWER(TRIM(r.recipient_email))
    ORDER BY COUNT(*) DESC, MAX(r.recipient_email)
    LIMIT 30;
  `;

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names"
  ], {
    input: sql,
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"]
    }
  });

  if (result.error || result.status !== 0) {
    throw new Error("Falha ao consultar o ranking.");
  }

  if (!result.stdout.trim()) return [];

  return result.stdout.trim().split("\n").map(line => {
    const [name, email, clicks, campaigns] =
      line.split("\t");

    return {
      name: decode(name || ""),
      email: decode(email || ""),
      clicks: Number(clicks || 0),
      campaigns: Number(campaigns || 0)
    };
  });
}
