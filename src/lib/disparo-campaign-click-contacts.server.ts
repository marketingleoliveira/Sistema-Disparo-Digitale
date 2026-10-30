import { spawnSync } from "node:child_process";

export type Period = "geral" | "d7" | "d30" | "d90" | "m12";

export function listCampaignClickContactsDB(
  campaignId: string,
  period: Period,
  includeCnpj = false
) {
  if (!campaignId || campaignId.length > 128) {
    throw new Error("Campanha invalida.");
  }

  const intervals: Record<Period, string> = {
    geral: "",
    d7: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY",
    d30: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY",
    d90: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 90 DAY",
    m12: "AND e.occurred_at >= UTC_TIMESTAMP() - INTERVAL 12 MONTH"
  };

  if (!Object.prototype.hasOwnProperty.call(intervals, period)) {
    throw new Error("Periodo invalido.");
  }

  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Banco nao configurado.");
  }

  const idHex = Buffer.from(campaignId, "utf8").toString("hex");

  const sql = `
    SELECT
      HEX(COALESCE(
        MAX(NULLIF(TRIM(c.name), '')),
        MAX(r.recipient_email)
      )),
      HEX(MAX(r.recipient_email)),
      COUNT(*)
    FROM disparo_click_events e
    INNER JOIN disparo_tracking_links l
      ON l.id = e.link_id
    INNER JOIN disparo_campaign_recipients r
      ON r.attempt_id = l.attempt_id
     AND r.campaign_id = l.campaign_id
    LEFT JOIN disparo_contacts c
      ON c.id = r.contact_id
    WHERE BINARY l.campaign_id =
      BINARY CONVERT(UNHEX('${idHex}') USING utf8mb4)
      ${intervals[period]}
    GROUP BY LOWER(TRIM(r.recipient_email))
    ORDER BY COUNT(*) DESC, MAX(e.occurred_at) DESC
    LIMIT 200;
  `;

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names"
  ], {
    input: `SET STATEMENT max_statement_time=5 FOR ${sql.trim().replace(/;\s*$/, "")}`,
    encoding: "utf8",
    timeout: 7000,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"]
    }
  });

  if (result.error || result.status !== 0) {
    console.error(
      "[CAMPAIGN_CONTACTS_SQL]",
      result.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      result.error?.code ||
      "mysql_error"
    );
    throw new Error("Falha ao consultar contatos.");
  }

  const decode = (v: string | undefined) =>
    Buffer.from(v || "", "hex").toString("utf8");

  if (!result.stdout.trim()) return [];

  // DIGITALE_CAMPAIGN_CNPJ_V1
  // Apenas emails confirmados na lista de cliques da campanha.
  const contacts = result.stdout.trim().split("\n").map(line => {
    const v = line.split("\t");
    return {
      name: decode(v[0]) || "Contato",
      email: decode(v[1]),
      clicks: Number(v[2] || 0),
      cnpj: null as string | null
    };
  });

  if (!includeCnpj || !contacts.length) return contacts;

  const emails = [...new Set(
    contacts.map(c => c.email.trim().toLowerCase())
  )];

  const identities = emails.map(email =>
    "'" + Buffer.from(email, "utf8")
      .toString("hex").toUpperCase() + "'"
  ).join(",");

  // Mesmas fontes usadas pela ferramenta de Aberturas:
  // IA Digitale, pessoas e organizacoes do Portal/Agendor.
  const companySql = `
    SELECT
      HEX(LOWER(TRIM(c.email))),
      HEX(COALESCE(c.cnpj, ''))
    FROM portal_digitale.prospecting_email_contacts c
    WHERE HEX(LOWER(TRIM(c.email))) IN (${identities})

    UNION ALL

    SELECT
      HEX(LOWER(TRIM(p.email))),
      HEX(COALESCE(o.cnpj, ''))
    FROM portal_digitale.crm_people p
    INNER JOIN portal_digitale.crm_organizations o
      ON o.id = p.organization_id
    WHERE HEX(LOWER(TRIM(p.email))) IN (${identities})

    UNION ALL

    SELECT
      HEX(LOWER(TRIM(o.email))),
      HEX(COALESCE(o.cnpj, ''))
    FROM portal_digitale.crm_organizations o
    WHERE HEX(LOWER(TRIM(o.email))) IN (${identities});
  `;

  const companies = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names"
  ], {
    input: companySql,
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"]
    }
  });

  // Falha na consulta empresarial nao bloqueia o ranking.
  if (companies.error || companies.status !== 0) {
    console.error(
      "[CAMPAIGN_CONTACT_CNPJ]",
      companies.stderr.match(/ERROR\s+\d+/i)?.[0] ||
      companies.error?.code ||
      "consulta_indisponivel"
    );
    return contacts;
  }

  const byEmail = new Map<string, Set<string>>();

  for (const line of companies.stdout.trim().split("\n")) {
    if (!line) continue;

    const [emailHex, cnpjHex] = line.split("\t");

    const email = decode(emailHex).trim().toLowerCase();
    const digits = decode(cnpjHex).replace(/\D/g, "");

    if (
      !/^\d{14}$/.test(digits) ||
      /^(\d)\1{13}$/.test(digits)
    ) continue;

    if (!byEmail.has(email)) {
      byEmail.set(email, new Set<string>());
    }

    byEmail.get(email)!.add(digits);
  }

  const format = (digits: string) =>
    digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );

  return contacts.map(contact => {
    const ids = byEmail.get(
      contact.email.trim().toLowerCase()
    );

    return {
      ...contact,
      cnpj: ids?.size === 1
        ? format([...ids][0])
        : null
    };
  });
}
