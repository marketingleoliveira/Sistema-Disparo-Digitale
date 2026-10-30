import { createServerFn } from "@tanstack/react-start";
import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

// DIGITALE_CONTACT_ENGAGEMENT_V2
// DIGITALE_CAMPANHAS_HISTORICO_V1

export type ContactMetrics = {
  sent: number;
  opened: number;
  openEvents: number;
  rate: number | null;
};

export type ContactActivity = {
  kind: "open" | "sent";
  at: string;
  campaignName: string;
};

const ROLES = ["Desenvolvedor", "Diretoria", "Gerência"];

function authorize() {
  const user = requireDisparoUser();
  if (!ROLES.includes(user.role)) {
    throw new Error("Sem permissao para consultar metricas.");
  }
}

function sqlText(value: string): string {
  return `CONVERT(UNHEX('${Buffer.from(value, "utf8").toString("hex")}') USING utf8mb4)`;
}

function db(query: string): string {
  const e = process.env;

  if (
    e["DB_NAME"] !== "TESTE_DISPARO" ||
    !e["DB_USER"] ||
    e["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Banco de metricas indisponivel.");
  }

  const result = spawnSync("mysql", [
    "--host", e["DB_HOST"] || "127.0.0.1",
    "--port", e["DB_PORT"] || "3306",
    "--user", e["DB_USER"],
    "--database", e["DB_NAME"],
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names",
    "--execute", query
  ], {
    env: { ...e, MYSQL_PWD: e["DB_PASSWORD"] },
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 32 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    throw new Error("Falha ao consultar as metricas.");
  }

  return result.stdout.trim();
}

function decode(hex: string): string {
  return Buffer.from(hex || "", "hex").toString("utf8");
}

function summarize(
  sent: number,
  opened: number,
  openEvents: number
): ContactMetrics {
  return {
    sent,
    opened,
    openEvents,
    rate: sent > 0
      ? Math.round((opened / sent) * 10000) / 100
      : null
  };
}

const accepted = `
  FROM disparo_campaign_recipients r
  JOIN disparo_email_attempts a
    ON BINARY a.id = BINARY r.attempt_id
   AND BINARY a.campaign_id = BINARY r.campaign_id
  LEFT JOIN disparo_email_events e
    ON BINARY e.attempt_id = BINARY r.attempt_id
   AND e.event_type = 'open'
  WHERE a.status = 'accepted'
    AND a.send_kind = 'campaign'
    AND r.delivery_status = 'accepted'
    AND r.sent_at IS NOT NULL
`;

export const listContactEngagement = createServerFn({
  method: "GET"
}).handler(async (): Promise<Record<string, ContactMetrics>> => {
  authorize();

  const output = db(`
    SELECT
      HEX(LOWER(TRIM(r.recipient_email))),
      COUNT(DISTINCT r.attempt_id),
      COUNT(DISTINCT CASE
        WHEN e.id IS NOT NULL THEN r.attempt_id
      END),
      COUNT(e.id)
    ${accepted}
    GROUP BY LOWER(TRIM(r.recipient_email))
  `);

  const result: Record<string, ContactMetrics> = {};

  if (!output) return result;

  for (const line of output.split("\n")) {
    const values = line.split("\t");
    const email = decode(values[0] || "").toLowerCase();

    if (!email) continue;

    result[email] = summarize(
      Number(values[1] || 0),
      Number(values[2] || 0),
      Number(values[3] || 0)
    );
  }

  return result;
});

export const getContactEngagementDetails = createServerFn({
  method: "POST"
})
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }): Promise<{
    metrics: ContactMetrics;
    history: ContactActivity[];
  }> => {
    authorize();

    const email = String(data.email || "").trim().toLowerCase();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error("E-mail invalido.");
    }

    const match = `
      AND LOWER(TRIM(r.recipient_email))
          COLLATE utf8mb4_unicode_ci
        = ${sqlText(email)} COLLATE utf8mb4_unicode_ci
    `;

    const raw = db(`
      SELECT
        COUNT(DISTINCT r.attempt_id),
        COUNT(DISTINCT CASE
          WHEN e.id IS NOT NULL THEN r.attempt_id
        END),
        COUNT(e.id)
      ${accepted}
      ${match}
    `);

    const values = raw.split("\t");

    const metrics = summarize(
      Number(values[0] || 0),
      Number(values[1] || 0),
      Number(values[2] || 0)
    );

    const historyRaw = db(`
      SELECT
        HEX(kind),
        HEX(DATE_FORMAT(at, '%Y-%m-%dT%H:%i:%s')),
        HEX(campaign_name)
      FROM (
        SELECT 'open' AS kind, e.occurred_at AS at,
        COALESCE(
          NULLIF(TRIM(c.name), ''),
          NULLIF(TRIM(c.subject), ''),
          'Campanha sem nome'
        ) AS campaign_name
        FROM disparo_campaign_recipients r
        JOIN disparo_email_attempts a
          ON BINARY a.id = BINARY r.attempt_id
         AND BINARY a.campaign_id = BINARY r.campaign_id
        JOIN disparo_email_events e
          ON BINARY e.attempt_id = BINARY r.attempt_id
         AND e.event_type = 'open'
        LEFT JOIN disparo_campaigns c
          ON BINARY c.id = BINARY r.campaign_id
        WHERE a.status = 'accepted'
          AND a.send_kind = 'campaign'
          AND r.delivery_status = 'accepted'
          AND r.sent_at IS NOT NULL
          ${match}
        UNION ALL
        SELECT 'sent' AS kind, r.sent_at AS at,
        COALESCE(
          NULLIF(TRIM(c.name), ''),
          NULLIF(TRIM(c.subject), ''),
          'Campanha sem nome'
        ) AS campaign_name
        FROM disparo_campaign_recipients r
        JOIN disparo_email_attempts a
          ON BINARY a.id = BINARY r.attempt_id
         AND BINARY a.campaign_id = BINARY r.campaign_id
        LEFT JOIN disparo_campaigns c
          ON BINARY c.id = BINARY r.campaign_id
        WHERE a.status = 'accepted'
          AND a.send_kind = 'campaign'
          AND r.delivery_status = 'accepted'
          AND r.sent_at IS NOT NULL
          ${match}
      ) AS activity
      ORDER BY at DESC
      LIMIT 15
    `);

    const history: ContactActivity[] = historyRaw
      ? historyRaw.split("\n").map(line => {
          const row = line.split("\t");
          return {
            kind: decode(row[0] || "") === "open" ? "open" : "sent",
            at: decode(row[1] || ""),
            campaignName: decode(row[2] || "")
          };
        })
      : [];

    return { metrics, history };
  });
