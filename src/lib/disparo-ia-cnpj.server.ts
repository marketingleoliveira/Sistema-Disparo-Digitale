// DIGITALE_CNPJ_IA_PROSPECCAO_V3
// Fonte preferencial: IA. Fallback: Portal/Agendor por email exato.
// Consulta apenas dados estruturados de e-mail e CNPJ da prospeccao IA.
import { spawn } from "node:child_process";

type OpenRow = { email: string; cnpj?: string | null };

type OpenReport = { rows: OpenRow[] };

function queryIa(sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = process.env;
    if (!env["DB_USER"] || env["DB_PASSWORD"] === undefined) {
      reject(new Error("ia_db_config_ausente"));
      return;
    }
    const child = spawn("mysql", [
      "--host", env["DB_HOST"] || "127.0.0.1",
      "--port", env["DB_PORT"] || "3306",
      "--user", env["DB_USER"],
      "--database", "portal_digitale",
      "--default-character-set=utf8mb4",
      "--batch", "--raw", "--skip-column-names"
    ], {
      env: { ...env, MYSQL_PWD: env["DB_PASSWORD"] },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let finished = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);
      if (error) reject(error);
      else resolve(stdout);
    };
    const watchdog = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error("ia_cnpj_timeout"));
    }, 6000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      stdout += chunk;
      if (stdout.length > 800000) {
        child.kill("SIGKILL");
        finish(new Error("ia_cnpj_limite_saida"));
      }
    });
    child.stderr.on("data", () => {});
    child.on("error", () => finish(new Error("ia_cnpj_cliente_indisponivel")));
    child.on("close", code => {
      if (code !== 0) finish(new Error("ia_cnpj_consulta_falhou"));
      else finish();
    });
    child.stdin.on("error", () => {});
    child.stdin.end(sql + "\n");
  });
}

function formatCnpj(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) {
    return null;
  }
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5");
}


// DIGITALE_CNPJ_AGENDOR_FALLBACK_V5
// Segundo nivel de busca: CRM do Portal, somente pelo e-mail exato.
// Nao utiliza crm_deals nem procura CNPJ em textos de negocios.
async function fallbackAgendorCnpj(
  emails: string[],
  found: Map<string, string>,
  ambiguousIa: Set<string>
): Promise<void> {
  // Caso a IA tenha CNPJs conflitantes, nao atribuir outro por suposicao.
  const missing = emails.filter(email => !found.has(email) && !ambiguousIa.has(email));
  const portalMap = new Map<string, string>();
  const conflicting = new Set<string>();

  for (let i = 0; i < missing.length; i += 150) {
    const values = missing.slice(i, i + 150).map(email =>
      "'" + Buffer.from(email, "utf8").toString("hex").toUpperCase() + "'"
    ).join(",");
    if (!values) continue;

    try {
      const rows = await queryIa(`
        SELECT HEX(LOWER(TRIM(p.email))), HEX(COALESCE(o.cnpj, ''))
        FROM portal_digitale.crm_people p
        JOIN portal_digitale.crm_organizations o
          ON BINARY p.organization_id = BINARY o.id
        WHERE HEX(LOWER(TRIM(p.email))) IN (${values})
          AND o.cnpj IS NOT NULL
        UNION ALL
        SELECT HEX(LOWER(TRIM(o.email))), HEX(COALESCE(o.cnpj, ''))
        FROM portal_digitale.crm_organizations o
        WHERE HEX(LOWER(TRIM(o.email))) IN (${values})
          AND o.cnpj IS NOT NULL
        LIMIT 10000;
      `);
      for (const line of rows.trim().split("\n")) {
        const parts = line.split("\t");
        if (parts.length !== 2) continue;
        const email = Buffer.from(parts[0], "hex").toString("utf8").trim().toLowerCase();
        const raw = Buffer.from(parts[1], "hex").toString("utf8");
        const cnpj = formatCnpj(raw);
        if (!cnpj || conflicting.has(email)) continue;
        const previous = portalMap.get(email);
        if (previous && previous !== cnpj) {
          portalMap.delete(email);
          conflicting.add(email);
        } else {
          portalMap.set(email, cnpj);
        }
      }
    } catch {
      console.error("AGENDOR_CNPJ_LOOKUP_FAILED");
      // Nao interromper a tela de aberturas se o Portal estiver indisponivel.
    }
  }

  for (const [email, cnpj] of portalMap) {
    if (!found.has(email) && !ambiguousIa.has(email)) found.set(email, cnpj);
  }
}

export async function enrichOpenReportWithIaCnpj<T extends OpenReport>(report: T): Promise<T> {
  const records = Array.isArray(report?.rows) ? report.rows : [];
  if (!records.length) return report;

  const emails = [...new Set(
    records.map(row => String(row.email || "").trim().toLowerCase())
  )].filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).slice(0, 5000);

  const found = new Map<string, string>();
  const ambiguous = new Set<string>();

  for (let i = 0; i < emails.length; i += 150) {
    const hexKeys = emails.slice(i, i + 150).map(email =>
      "'" + Buffer.from(email, "utf8").toString("hex").toUpperCase() + "'"
    ).join(",");
    if (!hexKeys) continue;

    try {
      const result = await queryIa(`
        SELECT HEX(LOWER(TRIM(email))), HEX(COALESCE(cnpj, ''))
        FROM portal_digitale.prospecting_email_contacts
        WHERE HEX(LOWER(TRIM(email))) IN (${hexKeys})
          AND cnpj IS NOT NULL
        LIMIT 10000;
      `);
      for (const line of result.trim().split("\n")) {
        const fields = line.split("\t");
        if (fields.length !== 2) continue;
        let email: string;
        let raw: string;
        try {
          email = Buffer.from(fields[0], "hex").toString("utf8").trim().toLowerCase();
          raw = Buffer.from(fields[1], "hex").toString("utf8");
        } catch { continue; }
        const cnpj = formatCnpj(raw);
        if (!cnpj || ambiguous.has(email)) continue;
        const previous = found.get(email);
        if (previous && previous !== cnpj) {
          found.delete(email);
          ambiguous.add(email);
        } else {
          found.set(email, cnpj);
        }
      }
    } catch {
      console.error("IA_CNPJ_LOOKUP_FAILED");
      // Falha na IA nao deve impedir o relatorio de aberturas.
    }
  }

  // Primeiro IA; somente e-mails nao resolvidos seguem ao Portal/Agendor.
  await fallbackAgendorCnpj(emails, found, ambiguous);
  return {
    ...report,
    rows: records.map(row => ({
      ...row,
      cnpj: found.get(String(row.email || "").trim().toLowerCase()) ?? null
    }))
  } as T;
}
