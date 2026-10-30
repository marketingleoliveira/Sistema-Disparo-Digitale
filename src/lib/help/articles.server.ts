import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { requireHelpAdministrator, requireHelpReader } from "./access.server";
import { canReadHelpModule, isHelpModule, type HelpModule } from "./permissions";
import { requireDisparoUser } from "../disparo-auth.server";

export type HelpStatus = "draft" | "published" | "archived";
export type HelpArticle = {
  id: string;
  slug: string;
  module: HelpModule;
  title: string;
  summary: string;
  content: string;
  status: HelpStatus;
  version: number;
  isFaq: boolean;
  sortOrder: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
export type HelpArticleInput = {
  id?: string;
  module: string;
  title: string;
  summary: string;
  content: string;
  status: string;
  isFaq?: boolean;
  sortOrder?: number;
};

const q = (value: string) => `CONVERT(UNHEX('${Buffer.from(value, "utf8").toString("hex")}') USING utf8mb4) COLLATE utf8mb4_unicode_ci`;
const dec = (value: string | undefined) => Buffer.from(value ?? "", "hex").toString("utf8");
function sql(query: string): string {
  const env = process.env;
  if (env["DB_NAME"] !== "TESTE_DISPARO" || !env["DB_USER"] || env["DB_PASSWORD"] === undefined) {
    throw new Error("Banco da Central de Ajuda indisponivel.");
  }
  const result = spawnSync("mysql", [
    "--host", env["DB_HOST"] || "127.0.0.1",
    "--port", env["DB_PORT"] || "3306",
    "--user", env["DB_USER"],
    "--database", env["DB_NAME"],
    "--default-character-set=utf8mb4",
    "--batch", "--raw", "--skip-column-names",
  ], {
    input: query + ";\n",
    env: { ...env, MYSQL_PWD: env["DB_PASSWORD"] },
    encoding: "utf8", timeout: 20000, maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error("Falha de banco ao acessar tutoriais.");
  }
  return result.stdout.trim();
}

function decodeArticle(line: string): HelpArticle {
  const col = line.split("\t");
  return {
    id: dec(col[0]), slug: dec(col[1]), module: dec(col[2]) as HelpModule,
    title: dec(col[3]), summary: dec(col[4]), content: dec(col[5]),
    status: dec(col[6]) as HelpStatus, version: Number(col[7]),
    isFaq: col[12] === "1", sortOrder: Number(col[13] ?? "0"),
    createdBy: dec(col[8]), updatedBy: dec(col[9]),
    createdAt: col[10] ?? "", updatedAt: col[11] ?? "",
  };
}

const fields = `HEX(id), HEX(slug), HEX(module), HEX(title),
  HEX(summary), HEX(content_markdown), HEX(status), version,
  HEX(created_by), HEX(updated_by), created_at, updated_at, is_faq, sort_order`;

export function listHelpArticlesAdmin(): HelpArticle[] {
  requireHelpAdministrator();
  const rows = sql(`SELECT ${fields} FROM disparo_help_articles ORDER BY updated_at DESC LIMIT 300`);
  return rows ? rows.split("\n").map(decodeArticle) : [];
}

export function listHelpArticlesPublished(): HelpArticle[] {
  const { modules } = requireHelpReader();
  if (modules.length === 0) return [];
  const conditions = modules.map(q).join(",");
  const rows = sql(`SELECT ${fields} FROM disparo_help_articles WHERE status='published' AND module IN (${conditions}) ORDER BY is_faq DESC, sort_order ASC, updated_at DESC LIMIT 300`);
  return rows ? rows.split("\n").map(decodeArticle) : [];
}

export function readHelpArticle(id: string): HelpArticle {
  const user = requireDisparoUser({ allowSdk: true });
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("Tutorial nao encontrado.");
  const rows = sql(`SELECT ${fields} FROM disparo_help_articles WHERE id=${q(id)} LIMIT 1`);
  if (!rows) throw new Error("Tutorial nao encontrado.");
  const article = decodeArticle(rows.split("\n")[0]!);
  const admin = user.role === "Desenvolvedor";
  if (!admin && (article.status !== "published" || !canReadHelpModule(user.role, article.module))) {
    throw new Error("Tutorial nao encontrado.");
  }
  return article;
}

function validated(data: HelpArticleInput) {
  if (!data || typeof data !== "object") throw new Error("Dados invalidos.");
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const summary = typeof data.summary === "string" ? data.summary.trim() : "";
  const content = typeof data.content === "string" ? data.content.trim() : "";
  const module = data.module;
  const status = data.status;
  if (!title || title.length > 180) throw new Error("Titulo deve ter ate 180 caracteres.");
  if (summary.length > 500) throw new Error("Resumo deve ter ate 500 caracteres.");
  if (!content || content.length > 100000) throw new Error("Conteudo obrigatorio (maximo de 100 mil caracteres).");
  if (!isHelpModule(module)) throw new Error("Modulo nao permitido.");
  if (status !== "draft" && status !== "published" && status !== "archived") throw new Error("Status invalido.");
  const isFaq = data.isFaq !== false;
  const sortOrder = data.sortOrder === undefined ? 0 : Number(data.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999)
    throw new Error("Ordem de exibicao invalida.");
  return { title, summary, content, module, status, isFaq, sortOrder };
}

export function saveHelpArticle(input: HelpArticleInput): { id: string; ok: true } {
  const adminId = requireHelpAdministrator();
  const { title, summary, content, module, status, isFaq, sortOrder } = validated(input);
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (id && !/^[a-f0-9-]{36}$/i.test(id)) throw new Error("ID invalido.");
  if (id) {
    const exists = sql(`SELECT COUNT(*) FROM disparo_help_articles WHERE id=${q(id)}`);
    if (exists !== "1") throw new Error("Tutorial nao encontrado.");
    sql(`UPDATE disparo_help_articles SET module=${q(module)}, title=${q(title)}, summary=${q(summary)},
      content_markdown=${q(content)}, status=${q(status)}, updated_by=${q(adminId)},
      is_faq=${isFaq ? 1 : 0}, sort_order=${sortOrder},
      version=version+1,
      published_at=CASE WHEN ${q(status)}='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP(6)) ELSE NULL END
      WHERE id=${q(id)}`);
    return { id, ok: true };
  }
  const newId = randomUUID();
  const slugBase = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 145) || "tutorial";
  const slug = `${slugBase}-${newId.slice(0, 8)}`;
  sql(`INSERT INTO disparo_help_articles
    (id, slug, module, title, summary, content_markdown, status, created_by, updated_by, published_at, is_faq, sort_order)
    VALUES (${q(newId)}, ${q(slug)}, ${q(module)}, ${q(title)}, ${q(summary)}, ${q(content)},
    ${q(status)}, ${q(adminId)}, ${q(adminId)}, ${status === "published" ? "CURRENT_TIMESTAMP(6)" : "NULL"},
    ${isFaq ? 1 : 0}, ${sortOrder})`);
  return { id: newId, ok: true };
}

export function deleteHelpArticle(id: string): { ok: true } {
  requireHelpAdministrator();
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) throw new Error("ID invalido.");
  sql(`DELETE FROM disparo_help_articles WHERE id=${q(id)}`);
  return { ok: true };
}
