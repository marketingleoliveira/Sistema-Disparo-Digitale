import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { currentUser } from "./disparo-auth.server";

export type NewUserInput = {
  email: string;
  password: string;
  role: string;
};

const allowedRoles = ["Desenvolvedor", "Diretoria", "Gerência", "SDK"];

function requireMaster() {
  const user = currentUser();
  if (!user || user.role !== "Desenvolvedor") {
    throw new Error("Acesso exclusivo do Admin Master.");
  }
}

function sqlQuery(sql: string): string {
  const e = process.env;

  if (e["DB_NAME"] !== "TESTE_DISPARO" ||
      !e["DB_USER"] || e["DB_PASSWORD"] === undefined) {
    throw new Error("Conexao MariaDB nao configurada.");
  }

  const r = spawnSync("mysql", [
    "--host", e["DB_HOST"] || "127.0.0.1",
    "--port", e["DB_PORT"] || "3306",
    "--user", e["DB_USER"],
    "--database", e["DB_NAME"],
    "--batch",
    "--skip-column-names",
    "--execute", sql
  ], {
    env: { ...e, MYSQL_PWD: e["DB_PASSWORD"] },
    encoding: "utf8",
    timeout: 10000,
    maxBuffer: 1024 * 1024
  });

  if (r.error || r.status !== 0) {
    if (r.stderr?.includes("Duplicate entry")) {
      throw new Error("Este e-mail ja esta cadastrado.");
    }
    throw new Error("Nao foi possivel acessar o MariaDB.");
  }

  return r.stdout.trim();
}

function dbText(value: string): string {
  const hex = Buffer.from(value, "utf8").toString("hex");
  return `CONVERT(UNHEX('${hex}') USING utf8mb4)`;
}

function decode(value: string | undefined): string {
  return Buffer.from(value || "", "hex").toString("utf8");
}

export function createDisparoUserInDB(input: NewUserInput) {
  requireMaster();

  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const role = String(input.role || "");

  if (email.length > 254 ||
      !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
    throw new Error("Informe um e-mail valido.");
  }

  if (password.length < 12 || password.length > 256) {
    throw new Error("A senha deve ter entre 12 e 256 caracteres.");
  }

  if (!allowedRoles.includes(role)) {
    throw new Error("Cargo invalido.");
  }

  const existing = sqlQuery(`
    SELECT COUNT(*) FROM disparo_users
    WHERE email = ${dbText(email)};
  `);

  if (Number(existing) > 0) {
    throw new Error("Este e-mail ja esta cadastrado.");
  }

  const id = randomUUID();
  const name = (email.split("@")[0] ?? "Usuario")
    .replace(/[._+-]+/g, " ")
    .trim()
    .slice(0, 200) || "Usuario";

  const salt = randomBytes(16);
  const passwordHash =
    `scrypt$${salt.toString("hex")}$` +
    scryptSync(password, salt, 64).toString("hex");

  sqlQuery(`
    INSERT INTO disparo_users
      (id, email, full_name, password_hash, role, is_active)
    VALUES (
      ${dbText(id)},
      ${dbText(email)},
      ${dbText(name)},
      ${dbText(passwordHash)},
      ${dbText(role)},
      1
    );
  `);

  return { id, email, name, role, active: true };
}

export function listDisparoUsersInDB() {
  requireMaster();

  const rows = sqlQuery(`
    SELECT HEX(id), HEX(email),
           HEX(COALESCE(full_name, '')),
           HEX(role), is_active
    FROM disparo_users
    ORDER BY created_at DESC
    LIMIT 200;
  `);

  if (!rows) return [];

  return rows.split("\n").map((line) => {
    const [id, email, name, role, active] = line.split("\t");

    return {
      id: decode(id),
      email: decode(email),
      name: decode(name),
      role: decode(role),
      active: active === "1"
    };
  });
}


// Acoes de usuarios reais, exclusivas do Admin Master.
export type EditUserInput = {
  id: string; name: string; email: string; role: string; active: boolean;
};

function validUserId(value: unknown): string {
  const id = String(value ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("ID de usuario invalido.");
  }
  return id;
}

function checkLastMaster(id: string, originalRole: string, originalActive: boolean, role: string, active: boolean) {
  if (originalRole === "Desenvolvedor" && originalActive && (role !== "Desenvolvedor" || !active)) {
    const other = Number(sqlQuery(`SELECT COUNT(*) FROM disparo_users WHERE role=${dbText("Desenvolvedor")} AND is_active=1 AND id<>${dbText(id)};`));
    if (other < 1) throw new Error("O ultimo Admin Master ativo nao pode ser removido ou desativado.");
  }
}

export function updateDisparoUserInDB(input: EditUserInput) {
  requireMaster();
  const actor = currentUser()!;
  const id = validUserId(input.id);
  if (actor.id === id) throw new Error("Por seguranca, edite sua propria conta por um fluxo separado.");
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const role = String(input.role ?? "");
  const active = input.active === true;
  if (name.length < 2 || name.length > 200) throw new Error("Nome deve ter de 2 a 200 caracteres.");
  if (email.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) throw new Error("E-mail invalido.");
  if (![...allowedRoles, "Marketing"].includes(role)) throw new Error("Cargo invalido.");
  const row = sqlQuery(`SELECT HEX(role),is_active FROM disparo_users WHERE id=${dbText(id)} LIMIT 1;`);
  if (!row) throw new Error("Usuario nao encontrado.");
  const [originalRole, originalActive] = row.split("\t");
  checkLastMaster(id, decode(originalRole), originalActive === "1", role, active);
  const duplicates = Number(sqlQuery(`SELECT COUNT(*) FROM disparo_users WHERE email=${dbText(email)} AND id<>${dbText(id)};`));
  if (duplicates > 0) throw new Error("Este e-mail ja esta cadastrado.");
  sqlQuery(`UPDATE disparo_users SET full_name=${dbText(name)},email=${dbText(email)},role=${dbText(role)},is_active=${active ? 1 : 0} WHERE id=${dbText(id)};`);
  if (!active) sqlQuery(`DELETE FROM disparo_sessions WHERE user_id=${dbText(id)};`);
  return { ok: true } as const;
}

export function deleteDisparoUserInDB(idInput: unknown) {
  requireMaster();
  const actor = currentUser()!;
  const id = validUserId(idInput);
  if (actor.id === id) throw new Error("Nao e permitido excluir sua propria conta.");
  const row = sqlQuery(`SELECT HEX(role),is_active FROM disparo_users WHERE id=${dbText(id)} LIMIT 1;`);
  if (!row) throw new Error("Usuario nao encontrado.");
  const [role, active] = row.split("\t");
  checkLastMaster(id, decode(role), active === "1", "excluido", false);
  const affected = sqlQuery(`START TRANSACTION; DELETE FROM disparo_sessions WHERE user_id=${dbText(id)}; DELETE FROM disparo_users WHERE id=${dbText(id)}; SELECT ROW_COUNT(); COMMIT;`);
  if (Number(affected) !== 1) throw new Error("Exclusao nao confirmada.");
  return { ok: true } as const;
}
