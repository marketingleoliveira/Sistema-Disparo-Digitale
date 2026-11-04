import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type ApprovedLead = {
  cnpj: string;
  company: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  uf: string | null;
  approvedAt: string;
  status: string;
  sdr: string | null;
};

export function listApprovedLeadsDB(): ApprovedLead[] {
  requireDisparoUser();

  const sql = `
    SELECT
      HEX(cnpj),
      HEX(company),
      HEX(COALESCE(email,'')),
      HEX(COALESCE(phone,'')),
      HEX(COALESCE(website,'')),
      HEX(COALESCE(uf,'')),
      DATE_FORMAT(approved_at,'%Y-%m-%dT%H:%i:%s'),
      HEX(status),
      HEX(COALESCE(assigned_sdr_id,''))
    FROM portal_digitale.prospecting_approved_leads
    ORDER BY approved_at DESC
    LIMIT 5000
  `;

  const result = spawnSync("mysql", [
    "--defaults-extra-file=/var/www/TESTE_DISPARO/.portal-ia-read.cnf",
    "--batch",
    "--raw",
    "--skip-column-names",
    "--execute",
    sql
  ], {
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 8 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    throw new Error("Não foi possível consultar os leads aprovados.");
  }

  const output = result.stdout.trim();
  if (!output) return [];

  const decode = (value: string | undefined) =>
    Buffer.from(value || "", "hex").toString("utf8");

  return output.split("\n").map(line => {
    const p = line.split("\t");
    const value = (i: number) => decode(p[i]) || null;

    return {
      cnpj: decode(p[0]),
      company: decode(p[1]),
      email: value(2),
      phone: value(3),
      website: value(4),
      uf: value(5),
      approvedAt: p[6] || "",
      status: decode(p[7]),
      sdr: value(8)
    };
  });
}
