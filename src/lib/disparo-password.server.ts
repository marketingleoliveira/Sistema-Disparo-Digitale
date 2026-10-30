import {
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import { spawnSync } from "node:child_process";
import { currentUser, logoutUser } from "./disparo-auth.server";

function dbText(value: string): string {
  const hex = Buffer.from(value, "utf8").toString("hex");
  return `CONVERT(UNHEX('${hex}') USING utf8mb4)`;
}

function query(sql: string): string {
  const e = process.env;
  const database = e["DB_NAME"];
  const username = e["DB_USER"];
  const password = e["DB_PASSWORD"];

  if (database !== "TESTE_DISPARO" ||
      !username || password === undefined) {
    throw new Error("Banco de dados indisponivel.");
  }

  const result = spawnSync("mysql", [
    "--host", e["DB_HOST"] || "127.0.0.1",
    "--port", e["DB_PORT"] || "3306",
    "--user", username,
    "--database", database,
    "--batch",
    "--skip-column-names",
    "--execute", sql
  ], {
    env: { ...e, MYSQL_PWD: password },
    encoding: "utf8",
    timeout: 15000,
    maxBuffer: 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    throw new Error("Nao foi possivel atualizar a senha.");
  }

  return result.stdout.trim();
}

const attempts = new Map<string, {
  count: number;
  expires: number;
}>();

export function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
  confirmation: string
) {
  const user = currentUser();

  if (!user?.id) {
    throw new Error("Sessao expirada. Entre novamente.");
  }

  if (!currentPassword || currentPassword.length > 4096) {
    throw new Error("Informe sua senha atual.");
  }

  if (newPassword.length < 12 || newPassword.length > 256) {
    throw new Error("A nova senha deve ter entre 12 e 256 caracteres.");
  }

  if (newPassword !== confirmation) {
    throw new Error("A confirmacao da senha nao coincide.");
  }

  if (newPassword === currentPassword) {
    throw new Error("A nova senha deve ser diferente da atual.");
  }

  const now = Date.now();
  const attempt = attempts.get(user.id);

  if (attempt && attempt.count >= 5 && now < attempt.expires) {
    throw new Error("Muitas tentativas. Aguarde 15 minutos.");
  }

  const stored = query(`
    SELECT password_hash
    FROM disparo_users
    WHERE id = ${dbText(user.id)} AND is_active = 1
    LIMIT 1;
  `);

  const parts = stored.split("$");

  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt" ||
    !/^[0-9a-f]{32}$/i.test(parts[1] ?? "") ||
    !/^[0-9a-f]{128}$/i.test(parts[2] ?? "")
  ) {
    throw new Error("Formato de senha nao reconhecido.");
  }

  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const actual = scryptSync(currentPassword, salt, 64);

  if (!timingSafeEqual(actual, expected)) {
    const count = attempt && now < attempt.expires
      ? attempt.count + 1
      : 1;

    attempts.set(user.id, {
      count,
      expires: now + 15 * 60 * 1000
    });

    throw new Error("Senha atual incorreta.");
  }

  attempts.delete(user.id);

  const newSalt = randomBytes(16);
  const newHash = [
    "scrypt",
    newSalt.toString("hex"),
    scryptSync(newPassword, newSalt, 64).toString("hex")
  ].join("$");

  const changed = query(`
    START TRANSACTION;

    UPDATE disparo_users
    SET password_hash = ${dbText(newHash)},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${dbText(user.id)}
      AND password_hash = ${dbText(stored)}
      AND is_active = 1;

    SET @changed = ROW_COUNT();

    DELETE FROM disparo_sessions
    WHERE user_id = ${dbText(user.id)}
      AND @changed = 1;

    COMMIT;

    SELECT @changed;
  `);

  if (changed !== "1") {
    throw new Error("A senha mudou durante a operacao. Tente novamente.");
  }

  logoutUser();

  return { success: true };
}
