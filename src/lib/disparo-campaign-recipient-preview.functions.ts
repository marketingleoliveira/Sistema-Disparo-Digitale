import { createServerFn } from "@tanstack/react-start";
import { spawnSync } from "node:child_process";

type Input = { campaignId: string };

const UUID =
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function decodeHex(value: string): string {
  return Buffer.from(String(value || ""), "hex").toString("utf8");
}

function formatCnpj(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits)) return null;
  if (/^(\d)\1{13}$/.test(digits)) return null;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function queryDb(database: string, sql: string): string[][] {
  const env = process.env;

  if (!env.DB_USER || env.DB_PASSWORD === undefined) {
    throw new Error("Configuracao do banco indisponivel.");
  }

  const result = spawnSync(
    "mysql",
    [
      "--host", env.DB_HOST || "127.0.0.1",
      "--port", env.DB_PORT || "3306",
      "--user", env.DB_USER,
      "--database", database,
      "--default-character-set=utf8mb4",
      "--batch",
      "--raw",
      "--skip-column-names",
      "--execute",
      "SET STATEMENT max_statement_time=8 FOR " +
        sql.trim().replace(/;\s*$/, "")
    ],
    {
      env: { ...env, MYSQL_PWD: env.DB_PASSWORD },
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 1024 * 1024
    }
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `Falha na consulta (${database}).`
    );
  }

  return result.stdout.trim()
    ? result.stdout.trim().split("\n").map(line => line.split("\t"))
    : [];
}

export const getCampaignRecipientPreview =
  createServerFn({ method: "GET" })
    .inputValidator((input: Input) => {
      const campaignId = String(input?.campaignId || "").trim();
      if (!UUID.test(campaignId)) {
        throw new Error("Campanha invalida.");
      }
      return { campaignId };
    })
    .handler(async ({ data }) => {
      const { requireDisparoUser } = await import("./disparo-auth.server");
      await requireDisparoUser();

      const campaignId = data.campaignId;

      const sampleRows = queryDb(
        "TESTE_DISPARO",
        `
        SELECT
          HEX(LOWER(TRIM(r.recipient_email))) AS email_hex,
          COALESCE(r.delivery_status, '') AS delivery_status
        FROM disparo_campaign_recipients r
        WHERE BINARY r.campaign_id = BINARY '${campaignId}'
          AND r.recipient_email IS NOT NULL
          AND TRIM(r.recipient_email) <> ''
        ORDER BY r.created_at DESC
        LIMIT 200
        `
      );

      const sample = sampleRows
        .map(row => ({
          email: decodeHex(row[0]).trim().toLowerCase(),
          status: String(row[1] || "")
        }))
        .filter(row => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email));

      const poolIa = queryDb(
        "TESTE_DISPARO",
        `
        SELECT
          HEX(LOWER(TRIM(email))) AS email_hex,
          HEX(COALESCE(cnpj, '')) AS cnpj_hex,
          HEX(COALESCE(company, '')) AS company_hex
        FROM disparo_confirmed_cnpj_emails
        WHERE email IS NOT NULL
          AND TRIM(email) <> ''
          AND cnpj IS NOT NULL
        LIMIT 500
        `
      );

      // Razao social e telefone: usa somente dados existentes.
      // Os dados de CRM servem para enriquecer vinculos CNPJ ja confirmados,
      // nunca para inventar novos contatos ou eventos de abertura.
      const orgRows = queryDb("portal_digitale", `
        SELECT HEX(COALESCE(cnpj, '')),
          HEX(COALESCE(NULLIF(TRIM(legal_name), ''), NULLIF(TRIM(name), ''), '')),
          HEX(COALESCE(phone, ''))
        FROM crm_organizations
        WHERE cnpj IS NOT NULL
        LIMIT 3000
      `);
      const orgMap = new Map<string, { company: string; phone: string }>();
      for (const row of orgRows) {
        const cnpj = formatCnpj(decodeHex(row[0]));
        if (!cnpj) continue;
        const company = decodeHex(row[1]).trim();
        const phone = decodeHex(row[2]).trim();
        const previous = orgMap.get(cnpj);
        if (!previous) orgMap.set(cnpj, { company, phone });
        else if (previous.company === company && !previous.phone && phone)
          orgMap.set(cnpj, { company, phone });
      }

      const cnpjMap = new Map<string, { email: string; cnpj: string; company: string; phone: string }>();
      for (const row of poolIa) {
        const email = decodeHex(row[0]).trim().toLowerCase();
        const cnpj = formatCnpj(decodeHex(row[1]));
        if (!email || !cnpj) continue;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
        if (cnpjMap.has(email)) continue;
        const org = orgMap.get(cnpj);
        cnpjMap.set(email, {
          email, cnpj,
          company: org?.company || decodeHex(row[2]).trim(),
          phone: org?.phone || ""
        });
      }
      const cnpjPool = Array.from(cnpjMap.values());

      return {
        sample,
        cnpjPool
      };
    });
