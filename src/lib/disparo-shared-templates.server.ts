import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type SharedTemplateKind = "marketing" | "transactional" | "hidden-official";

function authorizedKind(kind: unknown): SharedTemplateKind {
  const user = requireDisparoUser({ allowSdk: true });

  if (user.role === "SDK" && kind === "hidden-official") {
    throw new Error(
      "SDK nao pode alterar modelos oficiais ocultos."
    );
  }
  if (kind !== "marketing" && kind !== "transactional" && kind !== "hidden-official") {
    throw new Error("Tipo de template invalido.");
  }
  return kind;
}

function q(value: string): string {
  return `CONVERT(UNHEX('${Buffer.from(value, "utf8").toString("hex")}') USING utf8mb4)`;
}

function sql(query: string): string {
  const e = process.env;
  if (e["DB_NAME"] !== "TESTE_DISPARO" || !e["DB_USER"] || e["DB_PASSWORD"] === undefined) {
    throw new Error("Banco de templates indisponivel.");
  }
  const r = spawnSync("mysql", [
    "--host", e["DB_HOST"] || "127.0.0.1",
    "--port", e["DB_PORT"] || "3306",
    "--user", e["DB_USER"],
    "--database", e["DB_NAME"],
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names",
  ], {
    input: query + ";\n",
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 128 * 1024 * 1024,
    env: { ...e, MYSQL_PWD: e["DB_PASSWORD"] },
  });
  if (r.error || r.status !== 0) {
    throw new Error("Falha ao acessar a biblioteca compartilhada.");
  }
  return r.stdout.trim();
}

export function listTemplatesDB(kindInput: unknown): object[] {
  const kind = authorizedKind(kindInput);
  const output = sql(
    `SELECT HEX(payload_json) FROM disparo_shared_templates ` +
    `WHERE kind=${q(kind)} ORDER BY updated_at DESC, template_id ASC`
  );
  if (!output) return [];
  return output.split("\n").map((line) => {
    const result: unknown = JSON.parse(Buffer.from(line.trim(), "hex").toString("utf8"));
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Template compartilhado invalido.");
    }
    return result;
  });
}

export function upsertTemplateDB(kindInput: unknown, template: unknown): { ok: true } {
  const kind = authorizedKind(kindInput);
  if (!template || typeof template !== "object" || Array.isArray(template)) {
    throw new Error("Dados do template invalidos.");
  }
  const value = template as { id?: unknown; [key: string]: unknown };
  const id = value.id;
  if (typeof id !== "string" || !id.trim() || id.length > 190) {
    throw new Error("Identificador do template invalido.");
  }
  const json = JSON.stringify(value);
  if (Buffer.byteLength(json, "utf8") > 12 * 1024 * 1024) {
    throw new Error("Template muito grande. Limite: 12 MB por modelo.");
  }
  sql(
    `INSERT INTO disparo_shared_templates (kind,template_id,payload_json) ` +
    `VALUES (${q(kind)},${q(id)},${q(json)}) ` +
    `ON DUPLICATE KEY UPDATE payload_json=VALUES(payload_json),updated_at=CURRENT_TIMESTAMP(6)`
  );
  return { ok: true };
}

export function deleteTemplateDB(kindInput: unknown, idInput: unknown): { ok: true } {
  const kind = authorizedKind(kindInput);

  if (requireDisparoUser({ allowSdk: true }).role === "SDK") {
    throw new Error("SDK nao pode excluir templates.");
  }
  if (typeof idInput !== "string" || !idInput.trim() || idInput.length > 190) {
    throw new Error("Identificador invalido.");
  }
  sql(`DELETE FROM disparo_shared_templates WHERE kind=${q(kind)} AND template_id=${q(idInput)}`);
  return { ok: true };
}

export function clearHiddenOfficialDB(): { ok: true } {
  authorizedKind("hidden-official");
  sql(`DELETE FROM disparo_shared_templates WHERE kind=${q("hidden-official")}`);
  return { ok: true };
}
