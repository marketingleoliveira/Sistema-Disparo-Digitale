
import { randomBytes, createHash } from "node:crypto";
import { spawnSync, spawn } from "node:child_process";

export function createTrackingToken(): string {
  return randomBytes(32).toString("hex");
}

export function isValidTrackingToken(
  token: string
): boolean {
  return /^[0-9a-f]{64}$/i.test(token);
}

export function hashTrackingToken(
  token: string
): string {
  if (!isValidTrackingToken(token)) {
    throw new Error("Token de rastreamento invalido.");
  }

  return createHash("sha256")
    .update(token.toLowerCase())
    .digest("hex");
}


function runTrackingSql(sql: string): number {
  const env = process.env;
  const dbUser = env["DB_USER"];
  const dbPassword = env["DB_PASSWORD"];

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !dbUser ||
    dbPassword === undefined
  ) {
    throw new Error("Banco MariaDB nao configurado.");
  }

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", dbUser,
    "--database", "TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names"
  ], {
    input: sql + ";\nSELECT ROW_COUNT();\n",
    encoding: "utf8",
    timeout: 15000,
    env: {
      ...env,
      MYSQL_PWD: dbPassword
    }
  });

  if (result.error || result.status !== 0) {
    throw new Error("Falha no registro de abertura.");
  }

  const lines = result.stdout.trim().split("\n");
  const count = Number(lines[lines.length - 1]);

  if (!Number.isSafeInteger(count)) {
    throw new Error("Resposta inesperada do MariaDB.");
  }

  return count;
}

export function registerTrackedOpen(
  token: string
): boolean {
  if (!isValidTrackingToken(token)) {
    return false;
  }

  const hash = hashTrackingToken(token);

  const inserted = runTrackingSql(`
    INSERT INTO disparo_email_events (
      id,
      attempt_id,
      event_type,
      provider_event_id,
      occurred_at
    )
    SELECT
      UUID(),
      r.attempt_id,
      'open',
      CONCAT('pixel:', r.tracking_token_hash),
      UTC_TIMESTAMP()
    FROM disparo_campaign_recipients r
    INNER JOIN disparo_email_attempts a
      ON BINARY a.id = BINARY r.attempt_id
      AND BINARY a.campaign_id = BINARY r.campaign_id
    INNER JOIN disparo_contact_lists l
      ON BINARY l.id = BINARY r.list_id
    WHERE r.tracking_token_hash = '${hash}'
      AND r.delivery_status = 'accepted'
      AND r.sent_at IS NOT NULL
      AND a.status = 'accepted'
      AND a.send_kind = 'campaign'
    ON DUPLICATE KEY UPDATE provider_event_id = VALUES(provider_event_id)
  `);

  return inserted === 1;
}


const trackingUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function trackingUuid(id: string): string {
  if (!trackingUuidPattern.test(id)) {
    throw new Error("Identificador invalido.");
  }
  return id;
}

function trackingSqlText(text: string): string {
  const hex = Buffer.from(text, "utf8").toString("hex");
  return (
    "CONVERT(UNHEX('" + hex +
    "') USING utf8mb4) COLLATE utf8mb4_unicode_ci"
  );
}

export function prepareTrackedRecipient(input: {
  campaignId: string;
  attemptId: string;
  contactId: string;
  listId: string;
  email: string;
}): string {
  const campaignId = trackingUuid(input.campaignId);
  const attemptId = trackingUuid(input.attemptId);
  const contactId = trackingUuid(input.contactId);
  const listId = trackingUuid(input.listId);

  const email = input.email.trim().toLowerCase();

  if (
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("E-mail invalido.");
  }

  const token = createTrackingToken();
  const hash = hashTrackingToken(token);

  const inserted = runTrackingSql(`
    INSERT INTO disparo_campaign_recipients (
      id,
      campaign_id,
      attempt_id,
      contact_id,
      list_id,
      recipient_email,
      tracking_token_hash,
      delivery_status
    )
    SELECT
      UUID(),
      cp.id,
      a.id,
      c.id,
      l.id,
      ${trackingSqlText(email)},
      '${hash}',
      'prepared'
    FROM disparo_email_attempts a
    JOIN disparo_campaigns cp
      ON BINARY cp.id = BINARY a.campaign_id
    JOIN disparo_contacts c
      ON BINARY c.id = BINARY ${trackingSqlText(contactId)}
    JOIN disparo_contact_lists l
      ON BINARY l.id = BINARY ${trackingSqlText(listId)}
    WHERE BINARY a.id = BINARY ${trackingSqlText(attemptId)}
      AND BINARY a.campaign_id = BINARY ${trackingSqlText(campaignId)}
      AND a.status = 'queued'
      AND a.send_kind = 'campaign'
      AND LOWER(TRIM(c.email)) =
          ${trackingSqlText(email)}
      AND CASE
        WHEN JSON_VALID(c.lists_json) = 1
        THEN
          JSON_CONTAINS(
            c.lists_json,
            JSON_QUOTE(l.id)
          ) = 1
          OR
          JSON_CONTAINS(
            c.lists_json,
            JSON_QUOTE(l.name)
          ) = 1
        ELSE 0
      END
  `);

  if (inserted !== 1) {
    throw new Error(
      "Destinatario nao elegivel ao rastreamento."
    );
  }

  return token;
}

export function confirmTrackedRecipient(
  attemptId: string
): boolean {
  const id = trackingUuid(attemptId);

  const updated = runTrackingSql(`
    UPDATE disparo_campaign_recipients r
    JOIN disparo_email_attempts a
      ON BINARY a.id = BINARY r.attempt_id
    SET
      r.delivery_status = 'accepted',
      r.sent_at = UTC_TIMESTAMP(6)
    WHERE BINARY r.attempt_id = BINARY ${trackingSqlText(id)}
      AND r.delivery_status = 'prepared'
      AND a.status = 'accepted'
      AND a.send_kind = 'campaign'
      AND BINARY a.campaign_id = BINARY r.campaign_id
  `);

  return updated === 1;
}


// DIGITALE_PIXEL_ASYNC_TOTAL_2026
function runTrackingSqlAsync(sql: string): Promise<number> {
  const env = process.env;
  const user = env["DB_USER"];
  if (!user || !env["DB_PASSWORD"]) {
    return Promise.reject(new Error("tracking_db_config_ausente"));
  }
  return new Promise((resolve, reject) => {
    const child = spawn("mysql", [
      "--host", env["DB_HOST"] || "127.0.0.1",
      "--port", env["DB_PORT"] || "3306",
      "--user", user,
      "--database", "TESTE_DISPARO",
      "--default-character-set=utf8mb4",
      "--batch", "--raw", "--skip-column-names"
    ], {env: {...env, MYSQL_PWD: env["DB_PASSWORD"]}});
    let output = "";
    let errorOutput = "";
    let ended = false;
    const finish = (error?: Error) => {
      if (ended) return;
      ended = true;
      clearTimeout(watchdog);
      if (error) { reject(error); return; }
      const last = output.trim().split("\n").at(-1);
      const count = Number(last);
      if (!Number.isSafeInteger(count)) {
        reject(new Error("tracking_sql_resultado_invalido"));
      } else {
        resolve(count);
      }
    };
    const watchdog = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error("tracking_sql_timeout"));
    }, 8000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      output += chunk;
      if (output.length > 65536) child.kill("SIGKILL");
    });
    child.stderr.on("data", chunk => {
      errorOutput += chunk;
      if (errorOutput.length > 65536) child.kill("SIGKILL");
    });
    child.on("error", () => finish(new Error("tracking_mysql_spawn_erro")));
    child.on("close", code => {
      if (code !== 0) {
        const mysqlError = errorOutput.match(/ERROR\s+\d+/)?.[0] || "mysql_exit";
        finish(new Error("tracking_sql_" + mysqlError));
      } else {
        finish();
      }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(sql + "\n");
  });
}

/** Cada carregamento valido e salvo; a primeira abertura tambem fica na tabela de eventos. */
export async function registerTrackedOpenAsync(token: string): Promise<boolean> {
  if (!isValidTrackingToken(token)) return false;
  const hash = hashTrackingToken(token);
  const added = await runTrackingSqlAsync(`
    START TRANSACTION;
    INSERT INTO disparo_email_events (
      id, attempt_id, event_type, provider_event_id, occurred_at
    )
    SELECT UUID(), r.attempt_id, 'open',
           CONCAT('pixel:', r.tracking_token_hash), UTC_TIMESTAMP()
    FROM disparo_campaign_recipients r
    JOIN disparo_email_attempts a
      ON BINARY a.id = BINARY r.attempt_id
     AND BINARY a.campaign_id = BINARY r.campaign_id
    JOIN disparo_contact_lists l
      ON BINARY l.id = BINARY r.list_id
    WHERE r.tracking_token_hash = '${hash}'
      AND r.delivery_status = 'accepted'
      AND r.sent_at IS NOT NULL
      AND a.status = 'accepted'
      AND a.send_kind = 'campaign'
    ON DUPLICATE KEY UPDATE provider_event_id = VALUES(provider_event_id);
    INSERT INTO disparo_open_hits (attempt_id, occurred_at)
    SELECT r.attempt_id, UTC_TIMESTAMP(6)
    FROM disparo_campaign_recipients r
    JOIN disparo_email_attempts a
      ON BINARY a.id = BINARY r.attempt_id
     AND BINARY a.campaign_id = BINARY r.campaign_id
    JOIN disparo_contact_lists l
      ON BINARY l.id = BINARY r.list_id
    WHERE r.tracking_token_hash = '${hash}'
      AND r.delivery_status = 'accepted'
      AND r.sent_at IS NOT NULL
      AND a.status = 'accepted'
      AND a.send_kind = 'campaign';
    SELECT ROW_COUNT();
    COMMIT;
  `);
  return added === 1;
}
