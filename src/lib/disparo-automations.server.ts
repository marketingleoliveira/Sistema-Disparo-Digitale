import { validateAutomationNodes, validateRequiredAutomationNodes } from "./disparo-automation-validator.mjs";
import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";
import {
  automationConfigurations,
  type AutomationId,
} from "../components/automations/automation-config";

const allowedIds = [
  "digitale-newsletter",
  "digitale-clientes",
  "digitale-interesse",
] as const;

function isAutomationId(value: string): value is AutomationId {
  return allowedIds.some(id => id === value);
}

function sqlText(value: string): string {
  return `CONVERT(UNHEX('${Buffer.from(
    value,
    "utf8"
  ).toString("hex")}') USING utf8mb4)`;
}

function decode(value?: string): string {
  return Buffer.from(value || "", "hex").toString("utf8");
}

function rows(sql: string): string[][] {
  const env = process.env;

  if (
    env["DB_NAME"] !== "TESTE_DISPARO" ||
    !env["DB_USER"] ||
    env["DB_PASSWORD"] === undefined
  ) {
    throw new Error("Configuracao do banco invalida.");
  }

  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", env["DB_NAME"],
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names",
  ], {
    input: sql,
    env: {
      ...env,
      MYSQL_PWD: env["DB_PASSWORD"],
    },
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error("Falha ao acessar automacoes.");
  }

  const output = result.stdout.trim();

  return output
    ? output.split("\n").map(line => line.split("\t"))
    : [];
}

export async function listDisparoAutomationsDB() {
  requireDisparoUser();

  return rows(`
    SELECT
      HEX(id),
      HEX(name),
      HEX(category),
      HEX(COALESCE(configuration, '{}'))
    FROM disparo_automations
    WHERE
      status = 'draft'
      AND enabled = 0
      AND published = 0
      AND sending_enabled = 0
      AND id IN (
      'digitale-newsletter',
      'digitale-clientes',
      'digitale-interesse'
    )
    ORDER BY FIELD(
      id,
      'digitale-newsletter',
      'digitale-clientes',
      'digitale-interesse'
    );
  `).map(row => ({
    id: decode(row[0]),
    name: decode(row[1]),
    category: decode(row[2]),
    configuration: decode(row[3]),
    status: "draft" as const,
    enabled: false as const,
    published: false as const,
    sendingEnabled: false as const,
  }));
}

export async function saveDisparoAutomationDraftDB(
  input: {
    id: string;
    configuration: unknown;
  }
) {
  requireDisparoUser();

  if (!isAutomationId(input.id)) {
    throw new Error("Automacao nao permitida.");
  }

  const base = automationConfigurations[input.id];

  const supplied =
    input.configuration &&
    typeof input.configuration === "object" &&
    !Array.isArray(input.configuration)
      ? input.configuration as Record<string, unknown>
      : {};

  const suppliedNodes = supplied["nodes"];

  // DIGITALE_REQUIRE_DRAFT_NODES_V1
  // Todo rascunho salvo deve conter etapas validadas.
  if (suppliedNodes === undefined) {
    throw new Error("Etapas obrigatorias nao informadas.");
  }

  validateAutomationNodes(suppliedNodes);
  validateRequiredAutomationNodes(input.id, suppliedNodes);

  const name =
    typeof supplied["name"] === "string"
      ? supplied["name"].trim()
      : "";

  const trigger =
    typeof supplied["trigger"] === "string"
      ? supplied["trigger"].trim()
      : "";

  if (
    !name ||
    name.length > 191 ||
    !trigger ||
    trigger.length > 191
  ) {
    throw new Error("Nome ou gatilho invalido.");
  }

  const configuration = {
    ...base,
    name,
    trigger,
    ...(supplied["nodes"] !== undefined
      ? { nodes: supplied["nodes"] }
      : {}),
    id: input.id,
    requiresMarketingConsent: true,
    preventDuplicates: true,
    enabled: false,
    published: false,
    sendingEnabled: false,
  };

  const content = JSON.stringify(configuration);

  if (Buffer.byteLength(content, "utf8") > 65535) {
    throw new Error("Configuracao muito extensa.");
  }

  const saved = rows(`
    UPDATE disparo_automations
    SET
      configuration = ${sqlText(content)},
      status = 'draft',
      enabled = 0,
      published = 0,
      sending_enabled = 0
    WHERE id = ${sqlText(input.id)}
      AND status = 'draft'
      AND enabled = 0
      AND published = 0
      AND sending_enabled = 0;

    SET @disparo_updated_rows = ROW_COUNT();

    SELECT
      @disparo_updated_rows,
      COUNT(*),
      COALESCE(
        MAX(
          configuration = ${sqlText(content)}
          AND status = 'draft'
          AND enabled = 0
          AND published = 0
          AND sending_enabled = 0
        ),
        0
      )
    FROM disparo_automations
    WHERE id = ${sqlText(input.id)};
  `);

  if (
    saved.length !== 1 ||
    Number(saved[0]?.[0]) < 0 ||
    Number(saved[0]?.[0]) > 1 ||
    Number(saved[0]?.[1]) !== 1 ||
    Number(saved[0]?.[2]) !== 1
  ) {
    throw new Error(
      "Nao foi possivel confirmar o salvamento do rascunho."
    );
  }

  return {
    ok: true,
    id: input.id,
    status: "draft" as const,
    enabled: false as const,
    published: false as const,
    sendingEnabled: false as const,
  };
}
