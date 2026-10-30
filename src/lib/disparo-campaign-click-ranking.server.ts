import { spawnSync } from "node:child_process";

export interface CampaignClickRankingRow {
  id: string;
  name: string;
  geral: number;
  d7: number;
  d30: number;
  d90: number;
  m12: number;
}

// DIGITALE_CAMPAIGN_RANKING_V3
export function listCampaignClickRankingDB():
  CampaignClickRankingRow[] {

  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Banco nao configurado.");
  }

  const sql = `
    SELECT
      HEX(l.campaign_id),
      HEX(COALESCE(MAX(cp.name), '')),
      COUNT(*),
      COALESCE(SUM(
        e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY
      ), 0),
      COALESCE(SUM(
        e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY
      ), 0),
      COALESCE(SUM(
        e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 90 DAY
      ), 0),
      COALESCE(SUM(
        e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 12 MONTH
      ), 0)
    FROM disparo_click_events e
    INNER JOIN disparo_tracking_links l
      ON BINARY l.id = BINARY e.link_id
    INNER JOIN disparo_campaigns cp
      ON BINARY cp.id = BINARY l.campaign_id
    WHERE cp.archived_at IS NULL
    GROUP BY BINARY l.campaign_id
    ORDER BY COUNT(*) DESC;
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
    timeout: 15000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"]
    }
  });

  if (result.error || result.status !== 0) {
    console.error(
      "[DIGITALE_CAMPAIGN_RANKING_SQL]",
      result.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      result.error?.code ||
      "mysql_error"
    );
    throw new Error("Falha ao consultar ranking.");
  }

  if (!result.stdout.trim()) return [];

  const decode = (value: string | undefined) =>
    Buffer.from(value || "", "hex").toString("utf8");

  return result.stdout.trim().split("\n").map(line => {
    const v = line.split("\t");

    return {
      id: decode(v[0]),
      name: decode(v[1]) || "Campanha",
      geral: Number(v[2] || 0),
      d7: Number(v[3] || 0),
      d30: Number(v[4] || 0),
      d90: Number(v[5] || 0),
      m12: Number(v[6] || 0)
    };
  });
}
