export type AutomationId =
  | "digitale-newsletter"
  | "digitale-clientes"
  | "digitale-interesse";

export interface AutomationConfiguration {
  id: AutomationId;
  enabled: false;
  published: false;
  sendingEnabled: false;
  audience: string;
  trigger: string;
  categories: string[];
  requiresMarketingConsent: boolean;
  preventDuplicates: boolean;
  description: string;
}

export const automationConfigurations: Record<
  AutomationId,
  AutomationConfiguration
> = {
  "digitale-newsletter": {
    id: "digitale-newsletter",
    enabled: false,
    published: false,
    sendingEnabled: false,
    audience: "Novos inscritos na Newsletter",
    trigger: "newsletter_subscription",
    categories: ["Apresentação da Digitale Têxtil"],
    requiresMarketingConsent: true,
    preventDuplicates: true,
    description:
      "Preparar apresentação institucional para novos inscritos.",
  },

  "digitale-clientes": {
    id: "digitale-clientes",
    enabled: false,
    published: false,
    sendingEnabled: false,
    audience: "Base de clientes",
    trigger: "scheduled_communication",
    categories: [
      "Radar Digitale",
      "Sexta do Bem-estar",
      "Novidades ou Lançamentos",
    ],
    requiresMarketingConsent: true,
    preventDuplicates: true,
    description:
      "Organizar comunicações recorrentes da base de clientes.",
  },

  "digitale-interesse": {
    id: "digitale-interesse",
    enabled: false,
    published: false,
    sendingEnabled: false,
    audience: "Leads identificados no site",
    trigger: "tracking_pixel_interest",
    categories: [
      "Milano",
      "Outros tecidos e artigos relacionados",
    ],
    requiresMarketingConsent: true,
    preventDuplicates: true,
    description:
      "Preparar materiais relacionados ao interesse identificado, " +
      "somente quando houver associação confiável com contato " +
      "autorizado da base.",
  },
};
