const genericPrefixes = new Set([
  "comercial",
  "vendas",
  "contato",
  "atendimento",
  "financeiro",
  "administrativo",
  "sac",
  "suporte",
  "marketing",
  "compras",
  "recepcao",
  "gerencia",
  "info",
  "office",
  "admin",
  "secretaria"
]);

export function emailPriority(email: string): number {
  const local = email.toLowerCase().trim().split("@")[0];

  if (!local) return 100;

  const parts = local.split(/[._+\-0-9]+/);

  if (
    genericPrefixes.has(local) ||
    parts.some(part => genericPrefixes.has(part))
  ) {
    return 100;
  }

  return 0;
}

export function selectVerifiedCnpjClicks<
  T extends {
    email: string;
    cnpj: string;
    clicked: boolean;
  }
>(records: T[], limit = 94): T[] {

  const seenEmails = new Set<string>();
  const seenCnpjs = new Set<string>();

  return records
    .filter(row =>
      row.clicked === true &&
      row.email?.includes("@") &&
      row.cnpj?.replace(/\D/g, "").length === 14
    )
    .sort((a, b) =>
      emailPriority(a.email) - emailPriority(b.email)
    )
    .filter(row => {
      const email = row.email.toLowerCase().trim();
      const cnpj = row.cnpj.replace(/\D/g, "");

      if (
        seenEmails.has(email) ||
        seenCnpjs.has(cnpj)
      ) {
        return false;
      }

      seenEmails.add(email);
      seenCnpjs.add(cnpj);

      return true;
    })
    .slice(0, limit);
}
