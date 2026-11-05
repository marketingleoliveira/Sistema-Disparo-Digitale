// DIGITALE_DEMO_219_IA_V2
// Apenas leitura. Nunca registra disparos ou aberturas.
import { createServerFn } from "@tanstack/react-start";
import { spawnSync } from "node:child_process";
import { lookupAuditedCampaignCnpjs } from "./disparo-audited-cnpj.server";

type Company = {
  email: string;
  cnpj: string;
  name: string;
  legalName: string;
  phone: string;
  website: string;
  clientStatus?: string;
};

const decode = (v: string) =>
  v && v !== "NULL"
    ? Buffer.from(v, "hex").toString("utf8").trim()
    : "";

function validCnpj(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return null;

  const calc = (size: number) => {
    const weights = size === 12
      ? [5,4,3,2,9,8,7,6,5,4,3,2]
      : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const sum = weights.reduce(
      (total, weight, i) => total + Number(d[i]) * weight, 0
    );
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  if (Number(d[12]) !== calc(12) ||
      Number(d[13]) !== calc(13)) return null;

  return d.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

export const getDemoCnpjCompanies =
  createServerFn({ method: "GET" })
    .handler(async () => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");

      const user = await requireDisparoUser();

      if (!["Desenvolvedor", "Diretoria", "Gerência"].includes(user.role)) {
        throw new Error("Acesso não autorizado.");
      }

      const sql = `
        SELECT
          HEX(LOWER(TRIM(e.email))),
          HEX(COALESCE(a.cnpj,'')),
          HEX(COALESCE(a.company,'')),
          HEX(''),
          HEX(COALESCE(a.phone,'')),
          HEX('')
        FROM portal_digitale.prospecting_auto_candidates a
        JOIN portal_digitale.prospecting_email_contacts e
          ON BINARY e.candidate_id = BINARY a.id
        WHERE a.cnpj IS NOT NULL
          AND e.email IS NOT NULL
          AND TRIM(e.email) <> ''

        UNION ALL

        SELECT
          HEX(LOWER(TRIM(l.contact_email))),
          HEX(COALESCE(l.cnpj,'')),
          HEX(COALESCE(l.company_name,'')),
          HEX(''),
          HEX(COALESCE(l.contact_phone,'')),
          HEX('')
        FROM portal_digitale.leads l
        WHERE l.cnpj IS NOT NULL
          AND l.contact_email IS NOT NULL
          AND TRIM(l.contact_email) <> ''

        UNION ALL

        SELECT
          HEX(LOWER(TRIM(o.email))),
          HEX(COALESCE(o.cnpj,'')),
          HEX(COALESCE(o.name,'')),
          HEX(COALESCE(o.legal_name,'')),
          HEX(COALESCE(o.phone,'')),
          HEX(COALESCE(o.website,''))
        FROM portal_digitale.crm_organizations o
        WHERE o.cnpj IS NOT NULL
          AND o.email IS NOT NULL
          AND TRIM(o.email) <> ''

        UNION ALL

        SELECT
          HEX(LOWER(TRIM(p.email))),
          HEX(COALESCE(o.cnpj,'')),
          HEX(COALESCE(o.name,'')),
          HEX(COALESCE(o.legal_name,'')),
          HEX(COALESCE(o.phone,'')),
          HEX(COALESCE(o.website,''))
        FROM portal_digitale.crm_people p
        JOIN portal_digitale.crm_organizations o
          ON BINARY p.organization_id = BINARY o.id
        WHERE o.cnpj IS NOT NULL
          AND p.email IS NOT NULL
          AND TRIM(p.email) <> ''

        LIMIT 20000;
      `;

      const result = spawnSync("mysql", [
        "--defaults-extra-file=/var/www/TESTE_DISPARO/.portal-ia-read.cnf",
        "--default-character-set=utf8mb4",
        "--batch", "--raw", "--skip-column-names",
        "--execute", sql
      ], {
        encoding: "utf8",
        timeout: 20000,
        maxBuffer: 12 * 1024 * 1024
      });

      if (result.error || result.status !== 0) {
        console.error("[DEMO_219_CNPJ]", {
          error: result.error?.code,
          status: result.status,
          detail: String(result.stderr || "").slice(0, 600)
        });
        throw new Error("Falha na consulta à IA Digitale.");
      }

      const byEmail = new Map<string, Company>();
      const conflicts = new Set<string>();

      for (const line of result.stdout.split("\n")) {
        if (!line.trim()) continue;
        const parts = line.split("\t");
        if (parts.length !== 6) continue;

        const [email, rawCnpj, name, legalName, phone, website] =
          parts.map(decode);

        const normalized = email.toLowerCase().trim();
        const cnpj = validCnpj(rawCnpj);

        if (
          !cnpj ||
          normalized.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
          conflicts.has(normalized)
        ) continue;

        const previous = byEmail.get(normalized);

        if (previous && previous.cnpj !== cnpj) {
          byEmail.delete(normalized);
          conflicts.add(normalized);
          continue;
        }

        if (!previous) {
          byEmail.set(normalized, {
            email: normalized, cnpj,
            name, legalName, phone, website
          });
        }
      }

      const byCnpj = new Map<string, Company>();

      for (const company of byEmail.values()) {
        if (!byCnpj.has(company.cnpj)) {
          byCnpj.set(company.cnpj, company);
        }
      }


      // DIGITALE_CLIENTES_IA_CNPJ_V1
      // Identificação por CNPJ exato, sem atribuição de e-mails.
      const clientsResult = spawnSync("mysql", [
        "--defaults-extra-file=/var/www/TESTE_DISPARO/.portal-ia-read.cnf",
        "--default-character-set=utf8mb4",
        "--batch", "--raw", "--skip-column-names",
        "--execute",
        "SELECT HEX(cnpj), HEX(name), status FROM portal_digitale.digitale_ai_clients"
      ], {
        encoding: "utf8",
        timeout: 15000,
        maxBuffer: 4 * 1024 * 1024
      });

      if (clientsResult.error || clientsResult.status !== 0) {
        console.error("[DEMO_CLIENTES_IA]", {
          code: clientsResult.error?.code || clientsResult.status
        });
        throw new Error("Falha ao identificar clientes da IA.");
      }

      const clientMap = new Map<
        string,
        { name: string; status: string }
      >();

      for (const line of clientsResult.stdout.split("\\n")) {
        const fields = line.trim().split("\\t");
        if (fields.length !== 3) continue;

        const cnpj = validCnpj(decode(fields[0]));
        if (!cnpj) continue;

        clientMap.set(cnpj, {
          name: decode(fields[1]),
          status: fields[2]
        });
      }

      for (const company of byCnpj.values()) {
        const client = clientMap.get(company.cnpj);
        if (!client) {
          company.clientStatus = "not_found";
          continue;
        }
        company.clientStatus = client.status;
        if (!company.name) company.name = client.name;
      }

      const all = [...byCnpj.values()].sort((a, b) => {
        const priority = (status?: string) =>
          status === "active" ? 0 :
          status === "inactive" ? 1 :
          status === "unknown" ? 2 : 3;
        return priority(a.clientStatus) - priority(b.clientStatus);
      });

      if (all.length < 219) {
        throw new Error(
          `Foram encontrados somente ${all.length} CNPJs elegíveis.`
        );
      }

      // Preserva a seleção existente; acrescenta apenas destinatários auditados
      // da própria campanha, agrupados por CNPJ. Os totais DEMO não mudam.
      const companies = all.slice(0, 219);
      const audited = lookupAuditedCampaignCnpjs("cdd61ff9-2273-4b87-9eac-af7d1ce731fc");
      for (const [email, link] of audited) {
        const existing = companies.find(company => company.cnpj === link.cnpj);
        if (existing) continue;
        const details = byCnpj.get(link.cnpj);
        companies.push({
          email, cnpj: link.cnpj, name: details?.name || link.company,
          legalName: details?.legalName || "", phone: details?.phone || "",
          website: details?.website || "",
          ...(details?.clientStatus ? { clientStatus: details.clientStatus } : {})
        });
      }

      return {
        // DIGITALE_DEMO_2823_LEITURAS_V1
        // 195 x 13 + 24 x 12 = 2823 eventos simulados.
        companies: companies.map((company, index) => ({
          ...company,
          auditedEmails: [...audited].filter(([, link]) => link.cnpj === company.cnpj).map(([email]) => email),
          demoOpenCount: index < 219 ? (index < 195 ? 13 : 12) : 0
        })),
        demoTotals: {
          opens: 9456,
          withCnpj: 2823,
          withoutCnpj: 6633
        },
        conflicts: conflicts.size,
        mode: "DEMO" as const
      };
    });
