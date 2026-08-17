/**
 * Consultas DNS via DNS-over-HTTPS (Google Public DNS).
 * Roda apenas no servidor: usa fetch nativo, compatível com o runtime edge.
 */

export interface DnsAnswer {
  readonly name: string;
  readonly type: number;
  readonly data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

const DOH_ENDPOINT = "https://dns.google/resolve";

/** Retorna todos os registros TXT (já sem aspas) do host informado. */
export async function resolveTxt(host: string): Promise<string[]> {
  const records = await resolveRecords(host, "TXT");
  return records.map((r) => r.replace(/^"|"$/g, "").replace(/"\s*"/g, ""));
}

export async function resolveMx(host: string): Promise<string[]> {
  return resolveRecords(host, "MX");
}

export async function resolveCname(host: string): Promise<string[]> {
  return resolveRecords(host, "CNAME");
}

async function resolveRecords(host: string, type: "TXT" | "MX" | "CNAME"): Promise<string[]> {
  try {
    const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(host)}&type=${type}`;
    const response = await fetch(url, { headers: { accept: "application/dns-json" } });
    if (!response.ok) return [];
    const payload = (await response.json()) as DohResponse;
    if (payload.Status !== 0 || !payload.Answer) return [];
    return payload.Answer.map((a) => a.data);
  } catch {
    // Falha de rede não deve derrubar a verificação — tratamos como "não encontrado".
    return [];
  }
}