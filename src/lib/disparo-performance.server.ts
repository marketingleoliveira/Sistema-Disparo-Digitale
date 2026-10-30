import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

const sqlValue = (value: string) =>
  `CONVERT(UNHEX('${Buffer.from(value, "utf8").toString("hex")}') USING utf8mb4)`;

const decode = (value?: string) =>
  Buffer.from(value || "", "hex").toString("utf8");

function rows(sql: string): string[][] {
  const e = process.env;

  if (
    e["DB_NAME"] !== "TESTE_DISPARO" ||
    !e["DB_USER"] ||
    e["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Configuracao do MariaDB invalida.");
  }

  const result = spawnSync("mysql", [
    "--host", e["DB_HOST"] || "127.0.0.1",
    "--port", e["DB_PORT"] || "3306",
    "--user", e["DB_USER"],
    "--database", e["DB_NAME"],
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names",
    "--execute", sql
  ], {
    env: { ...e, MYSQL_PWD: e["DB_PASSWORD"] },
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 5 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    console.error(
      "Erro ao consultar desempenho:",
      result.error?.message || result.stderr
    );
    throw new Error("Nao foi possivel consultar os dados do desempenho.");
  }

  const output = result.stdout.trim();
  return output ? output.split("\n").map(line => line.split("\t")) : [];
}

const numeric = (value?: string) => Number(value || 0) || 0;

export async function getDisparoPerformanceDB(input: {
  days: number;
  list: string;
}) {
  await requireDisparoUser();

  const days = [7, 30, 90].includes(Number(input.days))
    ? Number(input.days)
    : 30;

  const list = String(input.list || "").trim();

  if (list.length > 191) {
    throw new Error("Nome de lista invalido.");
  }

  const listsRaw = rows(`
    SELECT
      HEX(l.name),
      (
        SELECT COUNT(*)
        FROM disparo_contacts c
        WHERE CASE
          WHEN JSON_VALID(c.lists_json) = 1
          THEN JSON_CONTAINS(
            c.lists_json,
            JSON_QUOTE(l.name)
          )
          ELSE 0
        END = 1
      )
    FROM disparo_contact_lists l
    ORDER BY l.name;
  `);

  const lists = listsRaw.map(row => ({
    name: decode(row[0]),
    contacts: numeric(row[1])
  }));

  if (list && !lists.some(item => item.name === list)) {
    throw new Error("Lista nao encontrada.");
  }

  const where = list
    ? `CASE
        WHEN JSON_VALID(c.lists_json) = 1
        THEN JSON_CONTAINS(
          c.lists_json,
          JSON_QUOTE(${sqlValue(list)})
        )
        ELSE 0
      END = 1`
    : "1 = 1";

  const totals = rows(`
    SELECT
      COUNT(*),
      COALESCE(SUM(c.status = 'Ativo'), 0),
      COALESCE(SUM(c.status = 'Pendente'), 0),
      COALESCE(SUM(c.status = 'Descadastrado'), 0)
    FROM disparo_contacts c
    WHERE ${where};
  `)[0] || [];

  const dailyRaw = rows(`
    SELECT
      DATE_FORMAT(c.created_at, '%Y-%m-%d'),
      COUNT(*)
    FROM disparo_contacts c
    WHERE ${where}
      AND c.created_at >= DATE_SUB(
        CURDATE(), INTERVAL ${days - 1} DAY
      )
    GROUP BY DATE(c.created_at)
    ORDER BY DATE(c.created_at);
  `);

  const campaignsRaw = rows(`
    SELECT
      HEX(name),
      HEX(status),
      COALESCE(recipients, 0),
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i')
    FROM disparo_campaigns
    WHERE archived_at IS NULL
      AND created_at >= DATE_SUB(
      CURDATE(), INTERVAL ${days - 1} DAY
    )
    ORDER BY created_at DESC
    LIMIT 100;
  `);

  const campaignTotals = rows(`
    SELECT
      COUNT(*),
      COALESCE(SUM(
        CASE WHEN status = 'Enviada'
        THEN COALESCE(recipients, 0)
        ELSE 0 END
      ), 0)
    FROM disparo_campaigns
    WHERE archived_at IS NULL
      AND created_at >= DATE_SUB(
      CURDATE(), INTERVAL ${days - 1} DAY
    );
  `)[0] || [];

  const daily = dailyRaw.map(row => ({
    date: row[0] || "",
    contacts: numeric(row[1])
  }));

  return {
    days,
    selectedList: list,
    totalContacts: numeric(totals[0]),
    activeContacts: numeric(totals[1]),
    pendingContacts: numeric(totals[2]),
    unsubscribedContacts: numeric(totals[3]),
    newContacts: daily.reduce((sum, row) => sum + row.contacts, 0),
    totalCampaigns: numeric(campaignTotals[0]),
    recordedRecipients: numeric(campaignTotals[1]),
    daily,
    lists,
    campaigns: campaignsRaw.map(row => ({
      name: decode(row[0]),
      status: decode(row[1]),
      recipients: numeric(row[2]),
      createdAt: row[3] || ""
    })),
    trackingAvailable: false
  };
}
