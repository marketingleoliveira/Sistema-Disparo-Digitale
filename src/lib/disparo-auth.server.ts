import { AsyncLocalStorage } from "node:async_hooks";
import { spawnSync } from "node:child_process";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { loadEnvFile } from "node:process";
import {
  getCookie,
  getRequest,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";

type Role = "Desenvolvedor" | "Diretoria" | "Gerência" | "Marketing" | "SDK";

export type DisparoUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  initials: string;
};

const COOKIE = "disparo_session";
const SESSION_SECONDS = 8 * 60 * 60;
const attempts = new Map<string, { count: number; until: number }>();

function query(sql: string): string[][] {
  if (!process.env["DB_USER"]) {
    loadEnvFile("../.env");
  }

  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
  } = process.env;

  if (
    DB_NAME !== "TESTE_DISPARO" ||
    !DB_USER ||
    DB_PASSWORD === undefined
  ) {
    throw new Error("MariaDB nao configurado");
  }

  const args = [
    `--host=${DB_HOST || "127.0.0.1"}`,
    `--port=${DB_PORT || "3306"}`,
    `--user=${DB_USER}`,
    `--database=${DB_NAME}`,
    "--batch",
    "--raw",
    "--skip-column-names",
    `--execute=${sql}`,
  ];

  const result = spawnSync("mysql", args, {
    env: {
      ...process.env,
      MYSQL_PWD: DB_PASSWORD,
    },
    encoding: "utf8",
    timeout: 8000,
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    console.error("Falha na consulta MariaDB:", result.error?.message || result.stderr);
    throw new Error("Nao foi possivel consultar o banco");
  }

  const output = result.stdout.trimEnd();
  return output ? output.split("\n").map((row) => row.split("\t")) : [];
}

function hex(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

function unhex(value: string | undefined): string {
  return Buffer.from(value || "", "hex").toString("utf8");
}

function sessionHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function userFromRow(row: string[]): DisparoUser {
  const name = unhex(row[2]) || "Usuario";
  const rawRole = unhex(row[3]);
  const allowed: Role[] = [
    "Desenvolvedor", "Diretoria", "Gerência", "Marketing", "SDK",
  ];

  return {
    id: row[0] || "",
    email: unhex(row[1]),
    name,
    role: allowed.includes(rawRole as Role)
      ? (rawRole as Role)
      : "Marketing",
    initials: name.slice(0, 2).toUpperCase(),
  };
}

// API agent identity is scoped to a verified request only.
const agentIdentity = new AsyncLocalStorage<DisparoUser>();

export type DisparoAgentScope = "admin" | "pixelTemplates";
export function withDisparoAgent<T>(request: Request, callback: (scope: DisparoAgentScope) => T): T | null {
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!token) return null;
  const actual = createHash("sha256").update(token).digest();
  const matches = (hash: string | undefined) =>
    !!hash && /^[a-f0-9]{64}$/i.test(hash) && timingSafeEqual(actual, Buffer.from(hash,"hex"));
  if (matches(process.env["DISPARO_PIXEL_KEY_SHA256"])) {
    const actor: DisparoUser = { id:"pixel-marketing-digitale", email:"pixel@integration.invalid", name:"Pixel Marketing Digitale", role:"SDK", initials:"PX" };
    return agentIdentity.run(actor, () => callback("pixelTemplates"));
  }
  if (!matches(process.env["DISPARO_AGENT_KEY_SHA256"])) return null;
  const email = (process.env["DISPARO_AGENT_EMAIL"] || "").trim().toLowerCase();
  if (!email) return null;
  const rows = query(`
    SELECT id, HEX(email), HEX(COALESCE(full_name, 'Agente IA')), HEX(role)
    FROM disparo_users
    WHERE email = CONVERT(UNHEX('${hex(email)}') USING utf8mb4)
      AND is_active = 1 LIMIT 1
  `);
  if (!rows[0]) return null;
  const actor = userFromRow(rows[0]);
  if (actor.role !== "Desenvolvedor") return null;
  return agentIdentity.run(actor, () => callback("admin"));
}

export function currentUser(): DisparoUser | null {
  const agent = agentIdentity.getStore();
  if (agent) return agent;
  const token = getCookie(COOKIE);

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return null;
  }

  const rows = query(`
    SELECT u.id,
           HEX(u.email),
           HEX(COALESCE(u.full_name, 'Usuario')),
           HEX(u.role)
    FROM disparo_sessions s
    JOIN disparo_users u ON u.id = s.user_id
    WHERE s.token_hash = '${sessionHash(token)}'
      AND s.expires_at > UTC_TIMESTAMP()
      AND u.is_active = 1
    LIMIT 1
  `);

  return rows[0] ? userFromRow(rows[0]) : null;
}

export function requireDisparoUser(options?: { allowSdk?: boolean }): DisparoUser {
  const user = currentUser();
  if (!user) throw new Error("Acesso nao autorizado");
  if (user.role === "SDK" && !options?.allowSdk) {
    throw new Error("SDK tem acesso somente aos templates.");
  }
  return user;
}

export function loginUser(email: string, password: string): DisparoUser {
  const normalized = email.trim().toLowerCase();

  if (
    normalized.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
    !password ||
    password.length > 1024
  ) {
    throw new Error("E-mail ou senha incorretos");
  }

  const url = new URL(getRequest().url);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    throw new Error("Use HTTPS ou o encaminhamento local do VS Code");
  }

  const now = Date.now();
  const attempt = attempts.get(normalized);

  if (attempt && attempt.until > now && attempt.count >= 5) {
    throw new Error("Muitas tentativas. Aguarde 15 minutos.");
  }

  const rows = query(`
    SELECT id, HEX(email),
           HEX(COALESCE(full_name, 'Usuario')),
           HEX(role), password_hash
    FROM disparo_users
    WHERE email = CONVERT(0x${hex(normalized)} USING utf8mb4)
      AND is_active = 1
    LIMIT 1
  `);

  const row = rows[0];
  const parts = (row?.[4] || "").split("$");
  let valid = false;

  if (
    parts.length === 3 &&
    parts[0] === "scrypt" &&
    /^[0-9a-f]{32}$/.test(parts[1] || "") &&
    /^[0-9a-f]{128}$/.test(parts[2] || "")
  ) {
    const actual = scryptSync(password, Buffer.from(parts[1]!, "hex"), 64);
    const expected = Buffer.from(parts[2]!, "hex");
    valid = timingSafeEqual(actual, expected);
  }

  if (!row || !valid) {
    const previous = attempt && attempt.until > now ? attempt.count : 0;
    attempts.set(normalized, {
      count: previous + 1,
      until: now + 15 * 60 * 1000,
    });
    throw new Error("E-mail ou senha incorretos");
  }

  attempts.delete(normalized);

  const user = userFromRow(row);

  if (!/^[0-9a-f-]{36}$/i.test(user.id)) {
    throw new Error("Identificador de usuario invalido");
  }

  const token = randomBytes(32).toString("hex");

  query(`
    INSERT INTO disparo_sessions (token_hash, user_id, expires_at)
    VALUES (
      '${sessionHash(token)}',
      '${user.id}',
      DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR)
    )
  `);

  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  return user;
}

export function logoutUser(): void {
  const token = getCookie(COOKIE);

  if (token && /^[0-9a-f]{64}$/.test(token)) {
    query(`
      DELETE FROM disparo_sessions
      WHERE token_hash = '${sessionHash(token)}'
    `);
  }

  deleteCookie(COOKIE, { path: "/" });
}
