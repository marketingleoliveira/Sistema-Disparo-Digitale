/**
 * Presets de provedores de e-mail suportados no painel de Domínio.
 * Cada preset traz o valor SPF recomendado e o seletor DKIM padrão,
 * evitando que a equipe precise memorizar registros DNS.
 */
export interface DomainProviderPreset {
  readonly id: string;
  readonly label: string;
  readonly spf: string;
  readonly dkimSelector: string;
  readonly mx?: readonly string[];
  readonly docs?: string;
}

export const DOMAIN_PROVIDERS: readonly DomainProviderPreset[] = [
  {
    id: "lovable",
    label: "Lovable Cloud (recomendado)",
    spf: "v=spf1 include:_spf.lovable.app ~all",
    dkimSelector: "lovable",
  },
  {
    id: "google",
    label: "Google Workspace",
    spf: "v=spf1 include:_spf.google.com ~all",
    dkimSelector: "google",
    mx: ["1 aspmx.l.google.com", "5 alt1.aspmx.l.google.com"],
  },
  {
    id: "microsoft",
    label: "Microsoft 365",
    spf: "v=spf1 include:spf.protection.outlook.com -all",
    dkimSelector: "selector1",
  },
  {
    id: "zoho",
    label: "Zoho Mail",
    spf: "v=spf1 include:zoho.com ~all",
    dkimSelector: "zoho",
  },
  {
    id: "locaweb",
    label: "Locaweb",
    spf: "v=spf1 include:spf.locaweb.com.br ~all",
    dkimSelector: "locaweb",
  },
  {
    id: "sendgrid",
    label: "SendGrid",
    spf: "v=spf1 include:sendgrid.net ~all",
    dkimSelector: "s1",
  },
  {
    id: "resend",
    label: "Resend",
    spf: "v=spf1 include:amazonses.com ~all",
    dkimSelector: "resend",
  },
  {
    id: "outro",
    label: "Outro provedor",
    spf: "v=spf1 include:_spf.seuprovedor.com ~all",
    dkimSelector: "default",
  },
] as const;

export function getProviderPreset(id: string): DomainProviderPreset {
  return DOMAIN_PROVIDERS.find((p) => p.id === id) ?? DOMAIN_PROVIDERS[DOMAIN_PROVIDERS.length - 1]!;
}

export const OWNERSHIP_TXT_HOST = "_digitale";

export function ownershipTxtValue(token: string): string {
  return `digitale-verify=${token}`;
}