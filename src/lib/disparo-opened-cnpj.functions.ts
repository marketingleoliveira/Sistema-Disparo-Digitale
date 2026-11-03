// DIGITALE_ABERTURA_CNPJ_V1
// Consulta somente destinatarios pertencentes a campanha.
// Retorna apenas emails com CNPJ identificado.
import { createServerFn } from "@tanstack/react-start";
import { spawnSync } from "node:child_process";

type Input = {
  campaignId: string;
  emails: string[];
};

export const getDisparoOpenedCnpjEmails =
  createServerFn({ method: "POST" })
    .inputValidator((input: Input) => {
      const campaignId = String(input?.campaignId || "").trim();

      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(campaignId)) {
        throw new Error("Campanha invalida.");
      }

      const emails = [...new Set(
        (Array.isArray(input?.emails) ? input.emails : [])
          .map(e => String(e).trim().toLowerCase())
          .filter(e => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      )];

      if (emails.length > 200) {
        throw new Error("Limite de destinatarios excedido.");
      }

      return { campaignId, emails };
    })
    .handler(async ({ data }) => {
      const { requireDisparoUser } = await import("./disparo-auth.server");
      const user = await requireDisparoUser();

      if (!["Desenvolvedor", "Diretoria", "Gerência"].includes(user.role)) {
        throw new Error("Acesso nao autorizado.");
      }

      if (!data.emails.length) return { emails: [] as string[] };

      const env = process.env;

      if (
        env.DB_NAME !== "TESTE_DISPARO" ||
        !env.DB_USER ||
        env.DB_PASSWORD === undefined
      ) {
        throw new Error("Conexao MariaDB indisponivel.");
      }

      const keys = data.emails.map(email =>
        "'" + Buffer.from(email, "utf8").toString("hex").toUpperCase() + "'"
      );

      const sql = `
        SELECT DISTINCT HEX(LOWER(TRIM(r.recipient_email)))
        FROM TESTE_DISPARO.disparo_campaign_recipients r
        WHERE BINARY r.campaign_id = BINARY '${data.campaignId}'
          AND HEX(LOWER(TRIM(r.recipient_email))) IN (${keys.join(",")})
        LIMIT 200;
      `;

      const result = spawnSync("mysql", [
        "--host", env.DB_HOST || "127.0.0.1",
        "--port", env.DB_PORT || "3306",
        "--user", env.DB_USER,
        "--database", "TESTE_DISPARO",
        "--default-character-set=utf8mb4",
        "--batch", "--raw", "--skip-column-names",
        "--execute", sql
      ], {
        env: { ...env, MYSQL_PWD: env.DB_PASSWORD },
        encoding: "utf8",
        timeout: 10000,
        maxBuffer: 1024 * 1024
      });

      if (result.error || result.status !== 0) {
        throw new Error("Falha na verificacao de destinatarios.");
      }

      const allowed = result.stdout.trim()
        ? result.stdout.trim().split("\n").map(hex =>
            Buffer.from(hex.trim(), "hex").toString("utf8").toLowerCase()
          )
        : [];

      if (!allowed.length) return { emails: [] as string[] };

      const { enrichOpenReportWithIaCnpj } =
        await import("./disparo-ia-cnpj.server");

      const enriched = await enrichOpenReportWithIaCnpj({
        rows: allowed.map(email => ({ email, cnpj: null as string | null }))
      });

      return {
        emails: enriched.rows
          .filter(row => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(row.cnpj || ""))
          .map(row => row.email.trim().toLowerCase())
      };
    });
