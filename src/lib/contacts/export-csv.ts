/** Exportação de contatos para CSV (UTF-8 com BOM, compatível com Excel). */
import type { Contact } from "@/hooks/use-data";

const COLUMNS: Array<{ header: string; value: (c: Contact) => string }> = [
  { header: "Nome", value: (c) => c.name ?? "" },
  { header: "E-mail", value: (c) => c.email ?? "" },
  { header: "Empresa", value: (c) => c.company ?? "" },
  { header: "Telefone", value: (c) => c.phone ?? "" },
  { header: "Status", value: (c) => c.status ?? "" },
  { header: "Listas", value: (c) => (c.lists ?? []).join("; ") },
  { header: "Tags", value: (c) => (c.tags ?? []).join("; ") },
  { header: "Engajamento", value: (c) => String(c.engagement ?? 0) },
  { header: "Ultima atividade", value: (c) => c.lastActivity ?? "" },
  { header: "Criado em", value: (c) => c.createdAt ?? "" },
];

function escapeCell(value: string): string {
  const needsQuotes = /[";\n\r]/.test(value);
  const safe = value.replace(/"/g, '""');
  return needsQuotes ? `"${safe}"` : safe;
}

export function contactsToCsv(contacts: Contact[]): string {
  const lines = [COLUMNS.map((c) => escapeCell(c.header)).join(";")];
  for (const contact of contacts) {
    lines.push(COLUMNS.map((col) => escapeCell(col.value(contact))).join(";"));
  }
  return lines.join("\r\n");
}

export function downloadContactsCsv(contacts: Contact[], fileName?: string): void {
  if (typeof window === "undefined") return;
  const csv = `\uFEFF${contactsToCsv(contacts)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = fileName ?? `contatos-digitale-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
