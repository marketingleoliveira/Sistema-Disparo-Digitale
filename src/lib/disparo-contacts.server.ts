import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type ContactDraft = {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "Ativo" | "Pendente" | "Descadastrado";
  lists: string[];
  tags: string[];
};

const ROLES = ["Desenvolvedor", "Diretoria", "Gerência"];

function authorize() {
  const user = requireDisparoUser();

  if (!ROLES.includes(user.role)) {
    throw new Error("Sem permissao para gerenciar contatos.");
  }
}

function sqlText(value: string): string {
  const hex = Buffer.from(value, "utf8").toString("hex");
  return `CONVERT(UNHEX('${hex}') USING utf8mb4)`;
}

function db(sql: string): string {
  const e = process.env;

  if (e["DB_NAME"] !== "TESTE_DISPARO" ||
      !e["DB_USER"] ||
      e["DB_PASSWORD"] === undefined) {
    throw new Error("Banco de dados indisponivel.");
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
    timeout: 20000,
    maxBuffer: 40 * 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    if (result.stderr?.includes("Duplicate entry")) {
      throw new Error("Ja existe um contato com este e-mail.");
    }

    throw new Error("Falha na operacao com o MariaDB.");
  }

  return result.stdout.trim();
}

function normalize(input: ContactDraft): ContactDraft {
  if (!input || typeof input !== "object") {
    throw new Error("Dados do contato invalidos.");
  }

  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const company = String(input.company ?? "").trim();
  const phone = String(input.phone ?? "").trim();

  const status = String(input.status ?? "Ativo");

  if (name.length < 2 || name.length > 255) {
    throw new Error("Informe um nome valido.");
  }

  if (email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    throw new Error("Informe um e-mail valido.");
  }

  if (company.length > 255 || phone.length > 40) {
    throw new Error("Empresa ou telefone excede o limite.");
  }

  if (!["Ativo", "Pendente", "Descadastrado"].includes(status)) {
    throw new Error("Status invalido.");
  }

  function cleanArray(value: unknown): string[] {
    if (!Array.isArray(value) || value.length > 100) {
      throw new Error("Lista de etiquetas invalida.");
    }

    return [...new Set(value.map((item) => {
      if (typeof item !== "string" || item.length > 100) {
        throw new Error("Etiqueta invalida.");
      }
      return item.trim();
    }).filter(Boolean))];
  }

  return {
    name,
    email,
    company,
    phone,
    status: status as ContactDraft["status"],
    lists: cleanArray(input.lists ?? []),
    tags: cleanArray(input.tags ?? [])
  };
}

function decode(value: string | undefined): string {
  return Buffer.from(value ?? "", "hex").toString("utf8");
}

function parseArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function listContactsDB() {
  authorize();

  const result = db(`
    SELECT
      HEX(id),
      HEX(name),
      HEX(email),
      HEX(company),
      HEX(phone),
      HEX(status),
      HEX(lists_json),
      HEX(tags_json),
      engagement,
      HEX(last_activity),
      HEX(DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s'))
    FROM disparo_contacts
    ORDER BY created_at DESC;
  `);

  if (!result) return [];

  return result.split("\n").map((row) => {
    const c = row.split("\t");
    const name = decode(c[1]);

    return {
      id: decode(c[0]),
      name,
      email: decode(c[2]),
      company: decode(c[3]),
      phone: decode(c[4]),
      status: decode(c[5]) as ContactDraft["status"],
      lists: parseArray(decode(c[6])),
      tags: parseArray(decode(c[7])),
      engagement: Number(c[8] ?? 0),
      lastActivity: decode(c[9]),
      createdAt: decode(c[10]),
      initials: name.slice(0, 2).toUpperCase()
    };
  });
}

function insertValues(contact: ContactDraft) {
  const c = normalize(contact);

  return `(
    ${sqlText(randomUUID())},
    ${sqlText(c.name)},
    ${sqlText(c.email)},
    ${sqlText(c.company)},
    ${sqlText(c.phone)},
    ${sqlText(c.status)},
    ${sqlText(JSON.stringify(c.lists))},
    ${sqlText(JSON.stringify(c.tags))},
    ${sqlText("Cadastrado")}
  )`;
}

export function createContactDB(input: ContactDraft) {
  authorize();

  db(`
    INSERT INTO disparo_contacts
      (id, name, email, company, phone,
       status, lists_json, tags_json, last_activity)
    VALUES ${insertValues(input)};
  `);

  return { success: true };
}

export function updateContactDB(
  id: string,
  input: ContactDraft
) {
  authorize();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("Identificador invalido.");
  }

  const c = normalize(input);

  db(`
    UPDATE disparo_contacts
    SET
      name = ${sqlText(c.name)},
      email = ${sqlText(c.email)},
      company = ${sqlText(c.company)},
      phone = ${sqlText(c.phone)},
      status = ${sqlText(c.status)},
      lists_json = ${sqlText(JSON.stringify(c.lists))},
      tags_json = ${sqlText(JSON.stringify(c.tags))}
    WHERE id = ${sqlText(id)};
  `);

  return { success: true };
}

export function deleteContactDB(id: string) {
  authorize();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("Identificador invalido.");
  }

  db(`
    DELETE FROM disparo_contacts
    WHERE id = ${sqlText(id)};
  `);

  return { success: true };
}

export function importContactsDB(inputs: ContactDraft[]) {
  authorize();

  if (!Array.isArray(inputs) ||
      inputs.length === 0 ||
      inputs.length > 100) {
    throw new Error("Importe lotes de ate 100 contatos.");
  }

  // DIGITALE_IMPORT_COMPLETA_V2
  // Cada e-mail possui um cadastro único.
  // O mesmo cadastro pode pertencer a várias listas.
  // Falhas individuais não interrompem o restante do lote.

  let inserted = 0;
  let linked = 0;
  let skipped = 0;
  let rejected = 0;

  const details: Array<{
    email: string;
    result: string;
    reason: string;
  }> = [];

  for (const input of inputs) {
    const email = String(input.email ?? "").trim().toLowerCase();

    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rejected++;
        details.push({
          email,
          result: "rejeitado",
          reason: "E-mail inválido"
        });
        continue;
      }

      // INSERT individual: qualquer falha fica restrita
      // ao registro atual.
      const row = insertValues(input);

      const result = db(`
        INSERT INTO disparo_contacts
          (id, name, email, company, phone,
           status, lists_json, tags_json, last_activity)
        VALUES ${row}
        ON DUPLICATE KEY UPDATE id = id;
        SELECT ROW_COUNT();
      `);

      const created = Number(
        result.trim().split("\n").at(-1) ?? 0
      ) > 0;

      if (created) {
        inserted++;
        details.push({
          email,
          result: "novo",
          reason: "Contato cadastrado e associado às listas"
        });
        continue;
      }

      // Contato existente: não modifica suas informações.
      // Adiciona somente listas ainda ausentes.
      const requested = Array.from(
        new Set(
          (input.lists ?? [])
            .map(value => String(value ?? "").trim())
            .filter(Boolean)
        )
      );

      let newLinks = 0;

      for (const listName of requested) {
        const result = db(`
          UPDATE disparo_contacts
          SET lists_json = JSON_ARRAY_APPEND(
            CASE
              WHEN JSON_VALID(lists_json)
                   AND JSON_TYPE(lists_json) = 'ARRAY'
              THEN lists_json
              ELSE '[]'
            END,
            '$',
            ${sqlText(listName)}
          )
          WHERE LOWER(TRIM(email)) = ${sqlText(email)}
            AND NOT JSON_CONTAINS(
              CASE
                WHEN JSON_VALID(lists_json)
                     AND JSON_TYPE(lists_json) = 'ARRAY'
                THEN lists_json
                ELSE '[]'
              END,
              JSON_QUOTE(${sqlText(listName)})
            );
          SELECT ROW_COUNT();
        `);

        newLinks += Number(
          result.trim().split("\n").at(-1) ?? 0
        );
      }

      if (newLinks > 0) {
        linked++;
        details.push({
          email,
          result: "vinculado",
          reason: "Adicionado à lista sem duplicar o contato"
        });
      } else {
        skipped++;
        details.push({
          email,
          result: "ignorado",
          reason: "Contato já associado à lista"
        });
      }

    } catch (error) {
      rejected++;
      details.push({
        email,
        result: "erro",
        reason: error instanceof Error
          ? error.message
          : "Erro de gravação"
      });
    }
  }

  return {
    inserted,
    linked,
    skipped,
    rejected,
    details
  };
}
