import { spawnSync } from "node:child_process";

// Somente vínculos revisados para relatórios de abertura. Não cadastra contatos.
export const OPEN_CNPJ_AUDIT_ORIGIN = "ABERTURAS_AUDIT_20261105";

export type AuditedCnpjLink = { cnpj: string; company: string };

function query(sql: string): string[][] {
  const env = process.env;
  if (env["DB_NAME"] !== "TESTE_DISPARO" || !env["DB_USER"] || env["DB_PASSWORD"] === undefined) {
    throw new Error("Conexao MariaDB indisponivel.");
  }
  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1", "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"], "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4", "--batch", "--raw", "--skip-column-names"
  ], {
    input: sql + ";\n", env: { ...env, MYSQL_PWD: env["DB_PASSWORD"] }, encoding: "utf8",
    timeout: 6000, maxBuffer: 1024 * 1024
  });
  if (result.error || result.status !== 0) throw new Error("Falha ao consultar vinculos auditados.");
  return result.stdout.trim() ? result.stdout.trim().split("\n").map(line => line.split("\t")) : [];
}

function validCnpj(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return null;
  for (const size of [12, 13]) {
    const weights = size === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const remainder = weights.reduce((sum, weight, i) =>
      sum + Number(digits[i]) * weight, 0) % 11;
    if (Number(digits[size]) !== (remainder < 2 ? 0 : 11 - remainder)) return null;
  }
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function lookupAuditedOpenCnpjs(emails: string[]): Map<string, AuditedCnpjLink> {
  const keys = [...new Set(emails.map(email => email.trim().toLowerCase()))]
    .filter(email => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const found = new Map<string, AuditedCnpjLink>();
  if (!keys.length) return found;
  for (let i = 0; i < keys.length; i += 150) {
    const values = keys.slice(i, i + 150).map(email =>
      "'" + Buffer.from(email, "utf8").toString("hex").toUpperCase() + "'"
    ).join(",");
    const rows = query(`SELECT HEX(LOWER(TRIM(m.email))), HEX(m.cnpj), HEX(COALESCE(m.company,'')),
        HEX(COALESCE(v.audit_batch,''))
      FROM TESTE_DISPARO.disparo_confirmed_cnpj_emails m
      LEFT JOIN TESTE_DISPARO.disparo_open_cnpj_audits v
        ON BINARY v.email = BINARY m.email AND BINARY v.cnpj = BINARY m.cnpj
      WHERE HEX(LOWER(TRIM(m.email))) IN (${values})`);
    const ids = new Map<string, Set<string>>();
    for (const fields of rows) {
      if (fields.length !== 4) continue;
      const [email = "", rawCnpj = "", company = "", origin = ""] = fields.map(value => Buffer.from(value, "hex").toString("utf8"));
      const cnpj = validCnpj(rawCnpj);
      if (!cnpj) continue;
      const values = ids.get(email) || new Set<string>();
      values.add(cnpj);
      ids.set(email, values);
      if (origin === OPEN_CNPJ_AUDIT_ORIGIN) found.set(email, { cnpj, company });
    }
    // Um vínculo local divergente impede a atribuição, independentemente da origem.
    for (const [email, values] of ids) if (values.size !== 1) found.delete(email);
  }
  return found;
}

// A campanha DEMO tem uma lista própria; admite somente destinatários já existentes.
export function lookupAuditedCampaignCnpjs(campaignId: string): Map<string, AuditedCnpjLink> {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(campaignId)) {
    throw new Error("Campanha invalida.");
  }
  const rows = query(`SELECT DISTINCT HEX(v.email)
    FROM TESTE_DISPARO.disparo_open_cnpj_audits v
    JOIN TESTE_DISPARO.disparo_campaign_recipients r
      ON v.email = LOWER(TRIM(r.recipient_email)) COLLATE utf8mb4_general_ci
    WHERE r.campaign_id = '${campaignId}' AND v.audit_batch = '${OPEN_CNPJ_AUDIT_ORIGIN}'`);
  return lookupAuditedOpenCnpjs(rows.map(row => Buffer.from(row[0] ?? "", "hex").toString("utf8")));
}
