
// DIGITALE_CAMPAIGN_NOTIFICATIONS_V1
import { createServerFn } from "@tanstack/react-start";

export type CampaignNotification = {
  id: number;
  campaignId: string;
  type: string;
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
};

export const listCampaignNotifications =
  createServerFn({ method: "GET" })
    .handler(async (): Promise<CampaignNotification[]> => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");
      await requireDisparoUser();

      const { spawnSync } = await import("node:child_process");
      const env = process.env;

      if (
        env.DB_NAME !== "TESTE_DISPARO" ||
        !env.DB_USER ||
        env.DB_PASSWORD === undefined
      ) {
        throw new Error("MariaDB indisponível.");
      }

      const sql = `
        SELECT id, HEX(campaign_id), HEX(event_type),
               HEX(title), HEX(description),
               UNIX_TIMESTAMP(created_at), 
               IF(read_at IS NULL, 0, 1)
        FROM disparo_notifications
        ORDER BY id DESC LIMIT 100;
      `;

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
        timeout: 10000,
        maxBuffer: 1024 * 1024
      });

      if (r.status !== 0 || r.error) {
        throw new Error("Falha ao consultar notificações.");
      }

      const decode = (s: string) =>
        Buffer.from(s || "", "hex").toString("utf8");

      return r.stdout.trim()
        ? r.stdout.trim().split("\n").map(line => {
            const x = line.split("\t");
            return {
              id: Number(x[0]),
              campaignId: decode(x[1] || ""),
              type: decode(x[2] || ""),
              title: decode(x[3] || ""),
              description: decode(x[4] || ""),
              createdAt: Number(x[5] || 0),
              read: x[6] === "1"
            };
          })
        : [];
    });

export const markCampaignNotificationRead =
  createServerFn({ method: "POST" })
    .inputValidator((input: { id: number }) => {
      if (!Number.isSafeInteger(input?.id) || input.id <= 0) {
        throw new Error("Notificação inválida.");
      }
      return input;
    })
    .handler(async ({ data }) => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");
      await requireDisparoUser();

      const { spawnSync } = await import("node:child_process");
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
        "--batch", "--skip-column-names",
        "--execute",
        `UPDATE disparo_notifications
         SET read_at=COALESCE(read_at,NOW())
         WHERE id=${data.id};`
      ], {
        env: { ...env, MYSQL_PWD: env.DB_PASSWORD },
        encoding: "utf8",
        timeout: 10000
      });

      if (r.status !== 0 || r.error) {
        throw new Error("Falha ao marcar notificação.");
      }

      return { ok: true };
    });
