
import { createServerFn } from "@tanstack/react-start";
import { spawnSync } from "node:child_process";

type Input = { campaignId?: string };

const sqlValue = (v: string) =>
  `CONVERT(UNHEX('${Buffer.from(v).toString("hex")}') USING utf8mb4)`;

function decode(v?: string): string {
  if (!v || v === "NULL") return "";
  return Buffer.from(v, "hex").toString("utf8");
}

function rows(sql: string): string[][] {
  const e = process.env;
  if (e.DB_NAME !== "TESTE_DISPARO" ||
      !e.DB_USER || e.DB_PASSWORD === undefined) {
    throw new Error("Banco de dados indisponível.");
  }
  const r = spawnSync("mysql", [
    "--host", e.DB_HOST || "127.0.0.1",
    "--port", e.DB_PORT || "3306",
    "--user", e.DB_USER,
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names",
    "--execute",
    `SET STATEMENT max_statement_time=5 FOR ${sql.trim().replace(/;\\s*$/, "")}`
  ], {
    env: { ...e, MYSQL_PWD: e.DB_PASSWORD },
    encoding: "utf8", timeout: 7000,
    maxBuffer: 4 * 1024 * 1024
  });
  if (r.error || r.status !== 0) {
    console.error("[SMTP_DIAGNOSTICO]", {
      etapa: sql.includes("SELECT COUNT(*)")
        ? "RESUMO"
        : "DESTINATARIOS",
      codigo: r.error?.code || r.status,
      erro: String(r.stderr || "").slice(-1200)
    });
    throw new Error("Falha ao consultar acompanhamento.");
  }
  return r.stdout.trim()
    ? r.stdout.trim().split("\n").map(x => x.split("\t"))
    : [];
}

export const getSmtpDeliverySummary =
createServerFn({ method: "GET" })
.inputValidator((raw: Input) => {
  const campaignId = String(raw?.campaignId || "").trim();
  if (campaignId &&
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
       .test(campaignId)) {
    throw new Error("Campanha inválida.");
  }
  return { campaignId };
})
.handler(async ({ data }) => {
  const { requireDisparoUser } =
    await import("./disparo-auth.server");
  await requireDisparoUser();

  const filter = data.campaignId
    ? `AND a.campaign_id = BINARY ${sqlValue(data.campaignId)}`
    : "";

  const latest = `
    LEFT JOIN (
      SELECT
        e.*,
        ROW_NUMBER() OVER (
          PARTITION BY e.attempt_id
          ORDER BY e.occurred_at DESC, e.id DESC
        ) AS rn
      FROM disparo_smtp_delivery_events e
    ) s
      ON s.attempt_id = a.id
     AND s.rn = 1
  `;

  const opens = `
    LEFT JOIN (
      SELECT attempt_id,
        COUNT(DISTINCT id) AS quantity,
        MIN(occurred_at) AS first_open
      FROM disparo_email_events
      WHERE event_type = 'open'
      GROUP BY attempt_id
    ) op ON op.attempt_id = a.id
  `;

  const recipient = `
    LEFT JOIN disparo_campaign_recipients r
      ON r.attempt_id = a.id COLLATE utf8mb4_unicode_ci
      AND r.campaign_id = a.campaign_id COLLATE utf8mb4_unicode_ci
  `;

  const where = `
    WHERE a.send_kind = 'campaign'
      ${filter}
      AND NOT EXISTS (
        SELECT 1 FROM disparo_campaigns c
        WHERE c.id = a.campaign_id
          AND c.archived_at IS NOT NULL
      )
  `;

  const validOpen = `
    a.status = 'accepted'
    AND r.delivery_status = 'accepted'
    AND r.sent_at IS NOT NULL
    AND COALESCE(op.quantity,0) > 0
  `;

  const summary = rows(`
    SELECT COUNT(*),
      COALESCE(SUM(a.status = 'accepted'),0),
      COALESCE(SUM(s.smtp_status IN ('sent','delivered')),0),
      COALESCE(SUM(s.smtp_status = 'bounced'),0),
      COALESCE(SUM(${validOpen}),0),
      COALESCE(SUM(s.smtp_status = 'deferred'),0),
      COALESCE(SUM(a.status = 'accepted' AND s.id IS NULL),0),
      COALESCE(SUM(a.status = 'failed'),0)
    FROM disparo_email_attempts a
    ${latest} ${opens} ${recipient}
    ${where}
  `)[0] || [];

  const records = rows(`
    SELECT
      HEX(COALESCE(r.recipient_email,'')),
      a.status,
      COALESCE(s.smtp_status,''),
      CASE WHEN ${validOpen}
        THEN COALESCE(op.quantity,0) ELSE 0 END,
      CASE WHEN ${validOpen} THEN COALESCE(
        DATE_FORMAT(op.first_open,'%Y-%m-%d %H:%i:%s'),''
      ) ELSE '' END,
      COALESCE(s.dsn_code,''),
      HEX(COALESCE(s.detail,'')),
      COALESCE(HEX(c.name),'')
    FROM disparo_email_attempts a
    ${latest} ${opens} ${recipient}
    LEFT JOIN disparo_campaigns c
      ON c.id = a.campaign_id
    ${where}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 200
  `).map(x => ({
    email: decode(x[0]),
    sendStatus: x[1] || "",
    deliveryStatus: x[2] || "",
    openCount: Number(x[3] || 0),
    firstOpen: x[4] || "",
    dsn: x[5] || "",
    detail: decode(x[6]),
    campaign: decode(x[7])
  }));

  return {
    totals: {
      attempts: Number(summary[0] || 0),
      sent: Number(summary[1] || 0),
      delivered: Number(summary[2] || 0),
      bounced: Number(summary[3] || 0),
      opened: Number(summary[4] || 0),
      deferred: Number(summary[5] || 0),
      unconfirmed: Number(summary[6] || 0),
      failed: Number(summary[7] || 0)
    },
    records,
    limited: Number(summary[0] || 0) > 200
  };
});



// DIGITALE_LIVE_PULSE_API_V2
// Consulta independente do motor SMTP, sem JOIN pesado.
export const getLiveCampaignPulse =
createServerFn({ method: "GET" })
.inputValidator((raw: Input) => {
  const campaignId = String(raw?.campaignId || "").trim();

  if (
    campaignId &&
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(campaignId)
  ) {
    throw new Error("Campanha invalida.");
  }

  return { campaignId };
})
.handler(async ({ data }) => {
  const { requireDisparoUser } =
    await import("./disparo-auth.server");

  await requireDisparoUser();

  const filter = data.campaignId
    ? `AND campaign_id = ${sqlValue(data.campaignId)} COLLATE utf8mb4_unicode_ci`
    : "";

  const smtpFilter = data.campaignId
    ? `AND a.campaign_id = ${sqlValue(data.campaignId)} COLLATE utf8mb4_unicode_ci`
    : "";

  const campaignWhere = data.campaignId
    ? `WHERE id = ${sqlValue(data.campaignId)} COLLATE utf8mb4_unicode_ci`
    : "WHERE archived_at IS NULL";

  const c = rows(`
    SELECT COALESCE(SUM(recipients),0)
    FROM disparo_campaigns
    ${campaignWhere}
  `)[0] || [];

  const a = rows(`
    SELECT
      COUNT(*),
      COALESCE(SUM(status = 'accepted'),0),
      COALESCE(SUM(status = 'failed'),0)
    FROM disparo_email_attempts
    WHERE send_kind = 'campaign'
    ${filter}
  `)[0] || [];

  const r = rows(`
    SELECT COUNT(*)
    FROM disparo_campaign_recipients
    WHERE delivery_status = 'prepared'
    ${filter}
  `)[0] || [];

  const smtp = rows(`
    SELECT
      COALESCE(SUM(e.status = 'queued'),0),
      COALESCE(SUM(e.status = 'accepted'),0),
      COALESCE(SUM(e.status = 'deferred'),0),
      COALESCE(SUM(e.status = 'bounced'),0),
      COALESCE(SUM(e.status = 'delivered'),0),
      COALESCE(SUM(e.status = 'failed'),0),
      COALESCE(SUM(e.status <> 'queued'),0)
    FROM mail_api_engine.emails e
    WHERE e.id COLLATE utf8mb4_general_ci IN (
      SELECT
        a.provider_message_id COLLATE utf8mb4_general_ci
      FROM disparo_email_attempts a
      WHERE a.send_kind = 'campaign'
        AND a.provider_message_id IS NOT NULL
        ${smtpFilter}
    )
  `)[0] || [];

  return {
    target: Number(c[0] || 0),
    attempts: Number(a[0] || 0),
    accepted: Number(a[1] || 0),
    failed: Number(a[2] || 0),
    prepared: Number(r[0] || 0),
    queued: Number(smtp[0] || 0),
    smtpAccepted: Number(smtp[1] || 0),
    deferred: Number(smtp[2] || 0),
    bounced: Number(smtp[3] || 0),
    delivered: Number(smtp[4] || 0),
    smtpFailed: Number(smtp[5] || 0),
    processed: Number(smtp[6] || 0),
    processing: 0,
    sampledAt: Date.now()
  };
});
