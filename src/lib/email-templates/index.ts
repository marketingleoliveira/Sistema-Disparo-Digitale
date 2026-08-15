import { template as boasVindas } from "./boas-vindas";
import { template as confirmacaoContato } from "./confirmacao-contato";
import { template as novoContatoInterno } from "./novo-contato-interno";
import { template as relatorioCampanha } from "./relatorio-campanha";
import type { TemplateEntry } from "./template-types";

/**
 * Catálogo de templates prontos para uso.
 * As chaves são os nomes usados no envio (kebab-case) e serão espelhadas
 * no registry oficial quando o domínio remetente estiver verificado.
 */
export const EMAIL_TEMPLATES: Record<string, TemplateEntry> = {
  "boas-vindas": boasVindas,
  "confirmacao-contato": confirmacaoContato,
  "novo-contato-interno": novoContatoInterno,
  "relatorio-campanha": relatorioCampanha,
};

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;

export { BRAND } from "./template-types";
export type { TemplateEntry } from "./template-types";