
// DIGITALE_CAMPAIGN_DETAILS_MODAL_V1
import { createServerFn } from "@tanstack/react-start";
import { spawnSync } from "node:child_process";

type Input = {
  campaignId: string;
  page: number;
  search: string;
  filter: string;
};

const validUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const sqlText = (value: string) =>
  `CONVERT(UNHEX('${Buffer.from(value, "utf8").toString("hex")}') USING utf8mb4)`;

function rows(sql: string): string[][] {
  const env = process.env;

  if (
    env.DB_NAME !== "TESTE_DISPARO" ||
    !env.DB_USER ||
    env.DB_PASSWORD === undefined
  ) {
    throw new Error("MariaDB indisponível.");
  }

  const r = spawnSync("mysql", [
    "--host", env.DB_HOST || "127.0.0.1",
    "--port", env.DB_PORT || "3306",
    "--user", env.DB_USER,
    "--database", env.DB_NAME,
    "--batch", "--raw", "--skip-column-names",
    "--execute", sql
  ], {
    env: { ...env, MYSQL_PWD: env.DB_PASSWORD },
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 1024 * 1024
  });

  if (r.error || r.status !== 0) {
    throw new Error("Falha ao consultar histórico da campanha.");
  }

  return r.stdout.trim()
    ? r.stdout.trim().split("\n").map((line: string) => line.split("\t"))
    : [];
}

const decode = (s?: string) =>
  Buffer.from(s || "", "hex").toString("utf8");

const statusExpr = `
  CASE
    WHEN a.status = 'failed' OR r.delivery_status = 'failed'
      THEN 'failed'
    WHEN a.status = 'accepted' OR r.delivery_status = 'accepted'
      THEN 'accepted'
    WHEN a.status = 'simulated' OR r.delivery_status = 'simulated'
      THEN 'simulated'
    ELSE 'queued'
  END
`;

// DIGITALE_CAMPAIGN_OPENS_MODAL_V2
const openJoin = `
        LEFT JOIN (
          SELECT
            e.attempt_id,
            COUNT(DISTINCT e.id) AS open_count,
            MIN(e.occurred_at) AS first_open,
            MAX(e.occurred_at) AS last_open
          FROM disparo_email_events e
          WHERE e.event_type = 'open'
          GROUP BY e.attempt_id
        ) op
          ON BINARY op.attempt_id = BINARY r.attempt_id
`;

export const getCampaignDetails =
  createServerFn({ method: "GET" })
    .inputValidator((raw: Input) => {
      const campaignId = String(raw?.campaignId || "").trim();
      const page = Number(raw?.page || 1);
      const search = String(raw?.search || "").trim().slice(0, 120);
      const filter = String(raw?.filter || "all");

      if (!validUUID(campaignId)) {
        throw new Error("Campanha inválida.");
      }

      if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
        throw new Error("Página inválida.");
      }

      if (!["all", "accepted", "queued", "failed", "opened"]
          .includes(filter)) {
        throw new Error("Filtro inválido.");
      }

      return { campaignId, page, search, filter };
    })
    .handler(async ({ data }) => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");
      await requireDisparoUser();

      const cid = sqlText(data.campaignId);

      const campaign = rows(`
        SELECT HEX(name), HEX(status)
        FROM disparo_campaigns
        WHERE BINARY id=BINARY ${cid}
          AND archived_at IS NULL
        LIMIT 1;
      `)[0];

      if (!campaign) {
        throw new Error("Campanha não encontrada.");
      }

      const totals = rows(`
        SELECT
          COUNT(*),
          COALESCE(SUM(status='accepted'),0),
          COALESCE(SUM(status='failed'),0),
          COALESCE(SUM(status='queued'),0),
          COALESCE(SUM(status='simulated'),0)
        FROM disparo_email_attempts
        WHERE BINARY campaign_id=BINARY ${cid}
          AND send_kind='campaign';
      `)[0] || [];


      const opened = Number(rows(`
        SELECT COUNT(DISTINCT LOWER(TRIM(r.recipient_email)))
        FROM disparo_email_events e
        JOIN disparo_email_attempts a
          ON BINARY a.id = BINARY e.attempt_id
        JOIN disparo_campaign_recipients r
          ON BINARY r.attempt_id = BINARY a.id
          AND BINARY r.campaign_id = BINARY a.campaign_id
        WHERE BINARY r.campaign_id = BINARY ${cid}
          AND e.event_type = 'open'
          AND a.status = 'accepted'
          AND a.send_kind = 'campaign'
          AND r.delivery_status = 'accepted'
          AND r.sent_at IS NOT NULL;
      `)[0]?.[0] || 0);

      const linked = rows(`
        SELECT COUNT(*)
        FROM disparo_campaign_recipients
        WHERE BINARY campaign_id=BINARY ${cid};
      `)[0];

      const conditions = [
        `BINARY r.campaign_id=BINARY ${cid}`
      ];

      if (data.search) {
        conditions.push(
          `r.recipient_email LIKE CONCAT('%', ${sqlText(data.search)}, '%')`
        );
      }

      if (data.filter === "opened") {
        conditions.push(
          `op.open_count > 0
           AND a.status = 'accepted'
           AND a.send_kind = 'campaign'
           AND r.delivery_status = 'accepted'
           AND r.sent_at IS NOT NULL`
        );
      } else if (data.filter !== "all") {
        conditions.push(
          `(${statusExpr}) = ${sqlText(data.filter)}`
        );
      }

      const where = conditions.join(" AND ");

      const count = Number(rows(`
        SELECT COUNT(*)
        FROM disparo_campaign_recipients r
        LEFT JOIN disparo_email_attempts a
          ON BINARY a.id=BINARY r.attempt_id
        ${openJoin}
        WHERE ${where};
      `)[0]?.[0] || 0);

      const limit = 50;
      const offset = (data.page - 1) * limit;

      const entries = rows(`
        SELECT
          HEX(r.recipient_email),
          ${statusExpr} AS effective_status,
          HEX(COALESCE(a.error_code,'')),
          DATE_FORMAT(
            COALESCE(a.updated_at,r.created_at),
            '%Y-%m-%d %H:%i:%s'
          ),
          HEX(COALESCE(a.provider,'')),
          COALESCE(op.open_count,0),
          COALESCE(
            DATE_FORMAT(op.first_open,'%Y-%m-%d %H:%i:%s'),
            ''
          ),
          COALESCE(
            DATE_FORMAT(op.last_open,'%Y-%m-%d %H:%i:%s'),
            ''
          )
        FROM disparo_campaign_recipients r
        LEFT JOIN disparo_email_attempts a
          ON BINARY a.id=BINARY r.attempt_id
        ${openJoin}
        WHERE ${where}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `).map(x => ({
        email: decode(x[0]),
        status: x[1] || "queued",
        error: decode(x[2]),
        date: x[3] || "",
        provider: decode(x[4]),
        openCount: Number(x[5] || 0),
        firstOpen: x[6] || "",
        lastOpen: x[7] || ""
      }));

      return {
        name: decode(campaign[0]),
        status: decode(campaign[1]),
        totals: {
          attempts: Number(totals[0] || 0),
          accepted: Number(totals[1] || 0),
          failed: Number(totals[2] || 0),
          queued: Number(totals[3] || 0),
          simulated: Number(totals[4] || 0),
          opened,
          linkedRecipients: Number(linked?.[0] || 0)
        },
        entries,
        count,
        page: data.page,
        pages: Math.max(1, Math.ceil(count / limit))
      };
    });
