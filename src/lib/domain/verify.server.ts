import { resolveMx, resolveTxt } from "./dns.server";
import { OWNERSHIP_TXT_HOST, ownershipTxtValue } from "./providers";

export interface DomainCheckInput {
  readonly domain: string;
  readonly token: string;
  readonly dkimSelector: string;
  readonly spfInclude: string;
}

export interface DomainCheckItem {
  readonly key: "ownership" | "spf" | "dkim" | "dmarc" | "mx";
  readonly label: string;
  readonly ok: boolean;
  readonly found: string[];
  readonly detail: string;
}

export interface DomainCheckResult {
  readonly checkedAt: string;
  readonly items: DomainCheckItem[];
}

/** Extrai o `include:` de uma string SPF completa, se houver. */
function extractInclude(spf: string): string | null {
  const match = /include:([^\s]+)/i.exec(spf);
  return match?.[1] ?? null;
}

export async function runDomainChecks(input: DomainCheckInput): Promise<DomainCheckResult> {
  const domain = input.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const include = extractInclude(input.spfInclude);

  const [ownershipTxt, rootTxt, dkimTxt, dmarcTxt, mx] = await Promise.all([
    resolveTxt(`${OWNERSHIP_TXT_HOST}.${domain}`),
    resolveTxt(domain),
    resolveTxt(`${input.dkimSelector}._domainkey.${domain}`),
    resolveTxt(`_dmarc.${domain}`),
    resolveMx(domain),
  ]);

  const expectedOwnership = ownershipTxtValue(input.token);
  const spfRecords = rootTxt.filter((r) => r.toLowerCase().includes("v=spf1"));

  const items: DomainCheckItem[] = [
    {
      key: "ownership",
      label: "Propriedade do domínio (TXT)",
      ok: ownershipTxt.some((r) => r.includes(expectedOwnership)),
      found: ownershipTxt,
      detail: `Esperado em ${OWNERSHIP_TXT_HOST}.${domain}: ${expectedOwnership}`,
    },
    {
      key: "spf",
      label: "SPF (TXT na raiz)",
      ok:
        spfRecords.length > 0 &&
        (include === null || spfRecords.some((r) => r.toLowerCase().includes(include.toLowerCase()))),
      found: spfRecords,
      detail: include
        ? `Deve conter include:${include}`
        : "Deve existir um registro iniciando com v=spf1",
    },
    {
      key: "dkim",
      label: "DKIM (assinatura)",
      ok: dkimTxt.some((r) => r.toLowerCase().includes("v=dkim1") || r.toLowerCase().includes("p=")),
      found: dkimTxt,
      detail: `Consultado em ${input.dkimSelector}._domainkey.${domain}`,
    },
    {
      key: "dmarc",
      label: "DMARC (política)",
      ok: dmarcTxt.some((r) => r.toLowerCase().includes("v=dmarc1")),
      found: dmarcTxt,
      detail: `Consultado em _dmarc.${domain}`,
    },
    {
      key: "mx",
      label: "MX (recebimento)",
      ok: mx.length > 0,
      found: mx,
      detail: "Necessário para receber respostas e relatórios de bounce",
    },
  ];

  return { checkedAt: new Date().toISOString(), items };
}