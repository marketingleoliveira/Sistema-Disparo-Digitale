import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type PortalIaLead = {
  id: string;
  company: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export function listPortalIaLeadsDB(): PortalIaLead[] {
  requireDisparoUser();

  const sql = `
    SELECT
      HEX(d.deal_id),
      HEX(COALESCE(
        NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(d.proof, '$.company'))), ''),
        'Empresa sem nome'
      )),
      HEX(COALESCE(
        NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(d.proof, '$.email'))), ''),
        ''
      )),
      HEX(COALESCE(
        NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(d.proof, '$.phone'))), ''),
        ''
      )),
      DATE_FORMAT(d.delivered_at, '%Y-%m-%dT%H:%i:%s')
    FROM portal_digitale.prospecting_auto_deliveries d
    WHERE d.owner_id = 'fba75bd9-8f92-4e2b-83f9-3bc48d7fa4bd'
    ORDER BY d.delivered_at DESC
    LIMIT 2000
  `;

  const result = spawnSync("mysql", [
    "--defaults-extra-file=/var/www/TESTE_DISPARO/.portal-ia-read.cnf",
    "--batch",
    "--raw",
    "--skip-column-names",
    "--execute", sql
  ], {
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    throw new Error("Falha ao consultar leads da IA Digitale.");
  }

  const decode = (value: string | undefined) =>
    Buffer.from(value || "", "hex").toString("utf8");

  const output = result.stdout.trim();

  if (!output) return [];

  return output.split("\n").map(line => {
    const parts = line.split("\t");
    const email = decode(parts[2]);
    const phone = decode(parts[3]);

    return {
      id: decode(parts[0]),
      company: decode(parts[1]),
      email: email || null,
      phone: phone || null,
      createdAt: parts[4] || ""
    };
  });
}
