import { spawn } from "node:child_process";
import { getDisparoSession } from "./disparo-auth.functions";

type CampaignRow = {
  id: string;
  name: string;
  accepted: number;
  failed: number;
  unique: number;
  total: number;
};

function readSql(query: string): Promise<string[][]> {
  const env = process.env;
  if (!env["DB_USER"] || !env["DB_PASSWORD"]) {
    return Promise.reject(new Error("MariaDB nao configurado"));
  }
  return new Promise((resolve, reject) => {
    const child = spawn("mysql", [
      "--host", env["DB_HOST"] || "127.0.0.1",
      "--port", env["DB_PORT"] || "3306",
      "--user", env["DB_USER"], "--database", "TESTE_DISPARO",
      "--default-character-set=utf8mb4", "--batch", "--raw", "--skip-column-names"
    ], {env: {...env, MYSQL_PWD: env["DB_PASSWORD"]}});
    let out = "";
    let err = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(out.trim() ? out.trim().split("\n").map(row => row.split("\t")) : []);
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error("Consulta de metricas excedeu 8 segundos"));
    }, 8000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      out += chunk;
      if (out.length > 1024 * 1024) child.kill("SIGKILL");
    });
    child.stderr.on("data", (chunk: string) => {
      err += chunk;
      if (err.length > 1024 * 1024) child.kill("SIGKILL");
    });
    child.on("error", () => finish(new Error("Falha ao executar MariaDB")));
    child.on("close", (code: number | null) => {
      finish(code === 0 ? undefined : new Error("Falha ao consultar as metricas"));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(query + "\n");
  });
}

export async function getPixelTrackingSummaryDB() {
  const session = await getDisparoSession();
  if (!session) throw new Error("Acesso nao autorizado");

  const columns = await readSql(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'TESTE_DISPARO'
      AND TABLE_NAME = 'disparo_campaigns'
      AND COLUMN_NAME IN ('name','title','subject')
    ORDER BY FIELD(COLUMN_NAME,'name','title','subject') LIMIT 1;
  `);
  const col = columns[0]?.[0];
  const titleExpr = ['name','title','subject'].includes(col || '')
    ? `COALESCE(NULLIF(TRIM(cp.\`${col}\`), ''), x.campaign_id)`
    : 'x.campaign_id';

  const rows = await readSql(`
    SELECT x.campaign_id, ${titleExpr}, x.accepted, x.failed,
           COALESCE(op.unique_count,0), COALESCE(ht.hit_count,0)
    FROM (
      SELECT campaign_id,
        SUM(delivery_status='accepted' AND sent_at IS NOT NULL) AS accepted,
        SUM(delivery_status='failed') AS failed,
        MAX(created_at) AS latest
      FROM disparo_campaign_recipients GROUP BY campaign_id
    ) x
    LEFT JOIN disparo_campaigns cp ON BINARY cp.id=BINARY x.campaign_id
    LEFT JOIN (
      SELECT r.campaign_id, COUNT(DISTINCT e.attempt_id) AS unique_count
      FROM disparo_email_events e
      JOIN disparo_campaign_recipients r
        ON BINARY r.attempt_id=BINARY e.attempt_id
      WHERE e.event_type='open'
      GROUP BY r.campaign_id
    ) op ON BINARY op.campaign_id=BINARY x.campaign_id
    LEFT JOIN (
      SELECT r.campaign_id, COUNT(*) AS hit_count
      FROM disparo_open_hits h
      JOIN disparo_campaign_recipients r
        ON BINARY r.attempt_id=BINARY h.attempt_id
      GROUP BY r.campaign_id
    ) ht ON BINARY ht.campaign_id=BINARY x.campaign_id
    WHERE cp.archived_at IS NULL
    ORDER BY x.latest DESC LIMIT 50;
  `);

  const campaigns: CampaignRow[] = rows.map(r => ({
    id: r[0] || '', name: r[1] || r[0] || 'Campanha',
    accepted: Number(r[2] || 0), failed: Number(r[3] || 0),
    unique: Number(r[4] || 0), total: Number(r[5] || 0)
  }));
  const totals = campaigns.reduce((s, r) => ({
    accepted: s.accepted + r.accepted, failed: s.failed + r.failed,
    unique: s.unique + r.unique, total: s.total + r.total
  }), {accepted: 0, failed: 0, unique: 0, total: 0});
  return { campaigns, totals, sampledCampaigns: campaigns.length,
    note: 'Carregamentos de imagens (inclusive proxies); nao garantem leitura humana.' };
}
