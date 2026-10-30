import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type EmailAttemptStatus =
  | "accepted"
  | "failed"
  | "simulated";

export type EmailSendKind = "campaign" | "test";

const sqlText = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return "NULL";
  const hex = Buffer.from(value, "utf8").toString("hex");
  return `CONVERT(UNHEX('${hex}') USING utf8mb4)`;
};

function query(sql: string): string[][] {
  const env = process.env;
  const user = env["DB_USER"];
  const password = env["DB_PASSWORD"];

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !user ||
    password === undefined
  ) {
    throw new Error("Configuracao MariaDB invalida.");
  }

  const result = spawnSync(
    "mysql",
    [
      "--host", env["DB_HOST"] || "127.0.0.1",
      "--port", env["DB_PORT"] || "3306",
      "--user", user,
      "--database", env["DB_NAME"],
      "--default-character-set=utf8mb4",
      "--batch",
      "--raw",
      "--skip-column-names",
      "--execute", sql
    ],
    {
      env: { ...env, MYSQL_PWD: password },
      encoding: "utf8",
      timeout: 20000,
      maxBuffer: 5 * 1024 * 1024
    }
  );

  if (result.error || result.status !== 0) {
    console.error(
      "Falha no historico de e-mail:",
      result.error?.message || result.stderr
    );
    throw new Error("Falha ao acessar historico de e-mail.");
  }

  const output = result.stdout.trim();
  return output
    ? output.split("\n").map(line => line.split("\t"))
    : [];
}

function safeErrorCode(value?: string): string {
  const code = String(value || "unknown_error").trim();
  return /^[a-zA-Z][a-zA-Z0-9_:-]{0,80}$/.test(code)
    ? code
    : "provider_error";
}

export function createEmailAttempt(input: {
  campaignId?: string | null;
  kind: EmailSendKind;
  provider: string;
  idempotencyKey?: string;
}): string {
  const id = randomUUID();
  const campaignId = input.campaignId?.trim() || null;

  if (
    campaignId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(campaignId)
  ) {
    throw new Error("Identificador de campanha invalido.");
  }

  const hash = input.idempotencyKey
    ? createHash("sha256")
        .update(input.idempotencyKey)
        .digest("hex")
    : null;

  query(`
    INSERT INTO disparo_email_attempts
      (id, campaign_id, send_kind, status,
       provider, idempotency_hash)
    VALUES (
      ${sqlText(id)},
      ${sqlText(campaignId)},
      ${sqlText(input.kind)},
      'queued',
      ${sqlText(input.provider.slice(0, 50))},
      ${sqlText(hash)}
    );
  `);

  return id;
}

export function finishEmailAttempt(input: {
  id: string;
  status: EmailAttemptStatus;
  messageId?: string;
  errorCode?: string;
}): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(input.id)
  ) {
    throw new Error("Identificador de tentativa invalido.");
  }

  const errorCode = input.status === "failed"
    ? safeErrorCode(input.errorCode)
    : null;

  query(`
    UPDATE disparo_email_attempts
    SET
      status = ${sqlText(input.status)},
      provider_message_id =
        ${sqlText(input.messageId?.slice(0, 255))},
      error_code = ${sqlText(errorCode)}
    WHERE id = ${sqlText(input.id)};
  `);
}

const count = (value?: string) => Number(value || 0) || 0;

export async function getEmailAnalyticsDB(
  requestedDays: number,
  customRange?: { startDate: string; endDate: string }
) {
  await requireDisparoUser();

  const days = [7, 30, 90].includes(Number(requestedDays))
    ? Number(requestedDays)
    : 30;

  const isValidDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value;
  };

  if (customRange) {
    if (
      typeof customRange.startDate !== "string" ||
      typeof customRange.endDate !== "string" ||
      !isValidDate(customRange.startDate) ||
      !isValidDate(customRange.endDate) ||
      customRange.startDate > customRange.endDate
    ) {
      throw new Error("Periodo personalizado invalido.");
    }
  }

  const period = customRange
    ? `a.created_at >=
       ${sqlText(customRange.startDate + " 00:00:00")}
       AND a.created_at <
       DATE_ADD(
         ${sqlText(customRange.endDate + " 00:00:00")},
         INTERVAL 1 DAY
       )`
    : `a.created_at >=
       DATE_SUB(CURDATE(), INTERVAL ${days - 1} DAY)`;

  const total = query(`
    SELECT
      COUNT(*),
      COALESCE(SUM(a.status = 'accepted'), 0),
      COALESCE(SUM(a.status = 'failed'), 0),
      COALESCE(SUM(a.status = 'simulated'), 0),
      COALESCE(SUM(a.status = 'queued'), 0),
      COUNT(DISTINCT a.campaign_id)
    FROM disparo_email_attempts a
    WHERE a.send_kind = 'campaign'
      AND NOT EXISTS (SELECT 1 FROM disparo_campaigns ac WHERE BINARY ac.id = BINARY a.campaign_id AND ac.archived_at IS NOT NULL)
      AND ${period};
  `)[0] || [];

  const daily = query(`
    SELECT
      DATE_FORMAT(a.created_at, '%Y-%m-%d'),
      COALESCE(SUM(a.status = 'accepted'), 0),
      COALESCE(SUM(a.status = 'failed'), 0),
      COALESCE(SUM(a.status = 'simulated'), 0)
    FROM disparo_email_attempts a
    WHERE a.send_kind = 'campaign'
      AND NOT EXISTS (SELECT 1 FROM disparo_campaigns ac WHERE BINARY ac.id = BINARY a.campaign_id AND ac.archived_at IS NOT NULL)
      AND ${period}
    GROUP BY DATE(a.created_at)
    ORDER BY DATE(a.created_at);
  `).map(row => ({
    date: row[0] || "",
    accepted: count(row[1]),
    failed: count(row[2]),
    simulated: count(row[3])
  }));

  const campaigns = query(`
    SELECT
      a.campaign_id,
      COALESCE(HEX(MAX(c.name)), ''),
      COUNT(*),
      COALESCE(SUM(a.status = 'accepted'), 0),
      COALESCE(SUM(a.status = 'failed'), 0),
      COALESCE(SUM(a.status = 'simulated'), 0),
      DATE_FORMAT(MAX(a.created_at), '%Y-%m-%d %H:%i')
    FROM disparo_email_attempts a
    LEFT JOIN disparo_campaigns c
      ON c.id = a.campaign_id
    WHERE a.send_kind = 'campaign'
      AND NOT EXISTS (SELECT 1 FROM disparo_campaigns ac WHERE BINARY ac.id = BINARY a.campaign_id AND ac.archived_at IS NOT NULL)
      AND ${period}
    GROUP BY a.campaign_id
    ORDER BY MAX(a.created_at) DESC
    LIMIT 200;
  `).map(row => ({
    id: row[0] || "",
    name: row[1]
      ? Buffer.from(row[1], "hex").toString("utf8")
      : `Campanha ${(row[0] || "").slice(0, 8)}`,
    attempts: count(row[2]),
    accepted: count(row[3]),
    failed: count(row[4]),
    simulated: count(row[5]),
    lastAttempt: row[6] || ""
  }));

  const accepted = count(total[1]);
  const failed = count(total[2]);
  const completed = accepted + failed;

  return {
    days,
    totals: {
      attempts: count(total[0]),
      accepted,
      failed,
      simulated: count(total[3]),
      queued: count(total[4]),
      campaigns: count(total[5]),
      acceptanceRate: completed > 0
        ? Math.round(accepted / completed * 10000) / 100
        : null
    },
    daily,
    campaigns,
    trackingAvailable: false
  };
}
