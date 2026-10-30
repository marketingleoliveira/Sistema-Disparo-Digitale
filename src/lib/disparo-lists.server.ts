import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

const value = (s: string) =>
  `CONVERT(UNHEX('${Buffer.from(s, "utf8").toString("hex")}') USING utf8mb4)`;

const decode = (s?: string) =>
  Buffer.from(s || "", "hex").toString("utf8");

function db(sql: string) {
  const e = process.env;

  if (e["DB_NAME"] !== "TESTE_DISPARO" ||
      !e["DB_USER"] ||
      e["DB_PASSWORD"] === undefined) {
    throw new Error("Configuracao MariaDB invalida.");
  }

  const r = spawnSync("mysql", [
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
    timeout: 30000
  });

  if (r.error || r.status !== 0) {
    const detail = r.error?.message || r.stderr || "";

    if (detail.includes("Duplicate entry")) {
      throw new Error("Ja existe uma lista com esse nome.");
    }

    console.error("Erro MariaDB Listas:", detail);
    throw new Error("Nao foi possivel consultar o MariaDB.");
  }

  return r.stdout.trim();
}

export async function listDisparoFoldersDB() {
  await requireDisparoUser();

  const rows = db(`
    SELECT
      HEX(l.id),
      HEX(l.name),
      HEX(COALESCE(l.description, '')),
      DATE_FORMAT(l.created_at, '%Y-%m-%dT%H:%i:%s'),
      (
        SELECT COUNT(*)
        FROM disparo_contacts c
        WHERE JSON_VALID(c.lists_json) = 1
          AND JSON_CONTAINS(
            c.lists_json, JSON_QUOTE(l.name)
          ) = 1
      )
    FROM disparo_contact_lists l
    ORDER BY l.created_at DESC;
  `);

  if (!rows) return [];

  return rows.split("\n").map(line => {
    const [id, name, description, createdAt, count] =
      line.split("\t");

    return {
      id: decode(id),
      name: decode(name),
      description: decode(description),
      createdAt: createdAt ?? "",
      contactCount: Number(count) || 0
    };
  });
}

export async function createDisparoFolderDB(
  rawName: string,
  rawDescription: string
) {
  await requireDisparoUser();

  const name = String(rawName ?? "").trim();
  const description = String(rawDescription ?? "").trim();

  if (!name || name.length > 191) {
    throw new Error("Nome da lista invalido.");
  }

  if (description.length > 1000) {
    throw new Error("Descricao muito longa.");
  }

  db(`
    INSERT INTO disparo_contact_lists
      (id, name, description)
    VALUES (
      ${value(randomUUID())},
      ${value(name)},
      ${value(description)}
    );
  `);

  return { ok: true };
}

export async function deleteDisparoFolderDB(id: string) {
  await requireDisparoUser();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("Lista invalida.");
  }

  const nameHex = db(`
    SELECT HEX(name)
    FROM disparo_contact_lists
    WHERE id = ${value(id)}
    LIMIT 1;
  `);

  if (!nameHex) {
    throw new Error("Lista nao encontrada.");
  }

  const count = Number(db(`
    SELECT COUNT(*)
    FROM disparo_contacts
    WHERE JSON_VALID(lists_json) = 1
      AND JSON_CONTAINS(
        lists_json,
        JSON_QUOTE(${value(decode(nameHex))})
      ) = 1;
  `));

  if (count > 0) {
    throw new Error(
      "Esta lista possui contatos e nao pode ser excluida."
    );
  }

  db(`
    DELETE FROM disparo_contact_lists
    WHERE id = ${value(id)};
  `);

  return { ok: true };
}
