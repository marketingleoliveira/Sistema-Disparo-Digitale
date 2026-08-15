/**
 * Parser inteligente de planilhas de contatos.
 * Aceita CSV/TSV/TXT (com detecção de delimitador) e XLSX/XLS,
 * reconhecendo automaticamente cabeçalhos em PT/EN e o formato de exportação da Brevo.
 */
import * as XLSX from "xlsx";

export interface ParsedContact {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "Ativo" | "Pendente" | "Descadastrado";
  tags: string[];
  lists: string[];
}

export interface ImportPreview {
  contacts: ParsedContact[];
  /** Cabeçalhos originais detectados no arquivo */
  headers: string[];
  /** Cabeçalho original -> campo interno reconhecido */
  mapping: Record<string, keyof ParsedContact | null>;
  totalRows: number;
  invalidEmails: number;
  duplicates: number;
}

type Field = keyof ParsedContact;

/** Aliases de cabeçalho (normalizados) por campo. Inclui os nomes usados pela Brevo. */
const FIELD_ALIASES: Record<Field | "firstname" | "lastname", string[]> = {
  email: ["email", "emailaddress", "e mail", "mail", "correio", "correioeletronico", "emailcontato", "endereçodeemail", "enderecodeemail"],
  name: ["name", "nome", "fullname", "nomecompleto", "contato", "contact", "nomedocontato", "razaosocial"],
  firstname: ["firstname", "primeironome", "nome1", "prenome", "givenname"],
  lastname: ["lastname", "sobrenome", "ultimonome", "surname", "familyname"],
  company: ["company", "empresa", "organizacao", "organization", "cliente", "companyname", "empresanome"],
  phone: ["phone", "telefone", "celular", "whatsapp", "smsphone", "sms", "telefonecelular", "mobile", "fone", "contatotelefone"],
  status: ["status", "situacao", "estado", "blacklisted", "blocklisted", "unsubscribed", "descadastrado", "optin"],
  tags: ["tags", "tag", "etiquetas", "marcadores"],
  lists: ["lists", "listas", "lista", "list", "listid", "listids", "segmento", "grupo"],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function detectField(header: string): Field | "firstname" | "lastname" | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => normalizeHeader(a) === norm)) {
      return field as Field;
    }
  }
  // heurística por conteúdo do cabeçalho
  if (norm.includes("email") || norm.includes("mail")) return "email";
  if (norm.includes("sobrenome") || norm.includes("lastname")) return "lastname";
  if (norm.includes("primeironome") || norm.includes("firstname")) return "firstname";
  if (norm.includes("nome") || norm.includes("name")) return "name";
  if (norm.includes("empresa") || norm.includes("company")) return "company";
  if (norm.includes("tel") || norm.includes("celular") || norm.includes("phone") || norm.includes("sms")) return "phone";
  if (norm.includes("tag")) return "tags";
  if (norm.includes("lista") || norm.includes("list")) return "lists";
  return null;
}

function detectDelimiter(sample: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  const firstLine = sample.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

/** Parser CSV tolerante a aspas e delimitadores variados. */
function parseDelimited(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field.trim());
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((c) => c !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
}

function splitMulti(value: string): string[] {
  return value
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeStatus(value: string): ParsedContact["status"] {
  const norm = normalizeHeader(value);
  if (!norm) return "Ativo";
  if (["1", "true", "yes", "sim", "blacklisted", "blocklisted", "unsubscribed", "descadastrado", "desinscrito", "cancelado"].includes(norm)) {
    return "Descadastrado";
  }
  if (["pendente", "pending", "doubleoptin", "aguardando"].includes(norm)) return "Pendente";
  return "Ativo";
}

/** Localiza a linha de cabeçalho (a primeira que contenha um campo reconhecível). */
function findHeaderIndex(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const detected = rows[i]!.map(detectField).filter(Boolean);
    if (detected.includes("email") || detected.length >= 2) return i;
  }
  return 0;
}

export function buildPreview(rows: string[][]): ImportPreview {
  const cleanRows = rows.filter((r) => r.some((c) => (c ?? "").toString().trim() !== ""));
  if (cleanRows.length === 0) {
    return { contacts: [], headers: [], mapping: {}, totalRows: 0, invalidEmails: 0, duplicates: 0 };
  }

  const headerIndex = findHeaderIndex(cleanRows);
  const headers = (cleanRows[headerIndex] ?? []).map((h) => (h ?? "").toString().trim());
  const detected = headers.map(detectField);

  const mapping: Record<string, Field | null> = {};
  headers.forEach((h, i) => {
    const f = detected[i];
    mapping[h || `Coluna ${i + 1}`] = f === "firstname" || f === "lastname" ? "name" : (f as Field | null) ?? null;
  });

  const dataRows = cleanRows.slice(headerIndex + 1);
  const seen = new Set<string>();
  const contacts: ParsedContact[] = [];
  let invalidEmails = 0;
  let duplicates = 0;

  for (const raw of dataRows) {
    const values = raw.map((v) => (v ?? "").toString().trim());
    let email = "";
    let name = "";
    let firstName = "";
    let lastName = "";
    let company = "";
    let phone = "";
    let status = "";
    const tags: string[] = [];
    const lists: string[] = [];

    headers.forEach((_h, i) => {
      const field = detected[i];
      const value = values[i] ?? "";
      if (!value) return;
      switch (field) {
        case "email":
          if (!email) email = value.toLowerCase();
          break;
        case "name":
          if (!name) name = value;
          break;
        case "firstname":
          firstName = value;
          break;
        case "lastname":
          lastName = value;
          break;
        case "company":
          if (!company) company = value;
          break;
        case "phone":
          if (!phone) phone = value;
          break;
        case "status":
          if (!status) status = value;
          break;
        case "tags":
          tags.push(...splitMulti(value));
          break;
        case "lists":
          lists.push(...splitMulti(value));
          break;
        default:
          break;
      }
    });

    // fallback: qualquer célula que pareça um e-mail
    if (!email) {
      const found = values.find((v) => EMAIL_RE.test(v));
      if (found) email = found.toLowerCase();
    }

    if (!email || !EMAIL_RE.test(email)) {
      invalidEmails++;
      continue;
    }
    if (seen.has(email)) {
      duplicates++;
      continue;
    }
    seen.add(email);

    const composed = [firstName, lastName].filter(Boolean).join(" ").trim();
    const finalName = (name || composed || email.split("@")[0] || email).trim();

    contacts.push({
      name: finalName,
      email,
      company,
      phone,
      status: normalizeStatus(status),
      tags: Array.from(new Set(tags)),
      lists: Array.from(new Set(lists)),
    });
  }

  return {
    contacts,
    headers,
    mapping,
    totalRows: dataRows.length,
    invalidEmails,
    duplicates,
  };
}

export async function parseContactsFile(file: File): Promise<ImportPreview> {
  const name = file.name.toLowerCase();
  const isSpreadsheet = /\.(xlsx|xls|xlsm|ods)$/.test(name);

  if (isSpreadsheet) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("A planilha não contém abas legíveis.");
    const sheet = workbook.Sheets[sheetName]!;
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
    return buildPreview(rows.map((r) => (Array.isArray(r) ? r.map((c) => (c ?? "").toString()) : [])));
  }

  const text = await file.text();
  return buildPreview(parseDelimited(text));
}