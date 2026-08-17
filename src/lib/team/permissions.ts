import type { Database } from "@/integrations/supabase/types";

export type TeamRole = Database["public"]["Enums"]["app_role"];

export const TEAM_ROLES: TeamRole[] = ["Desenvolvedor", "Diretoria", "Gerência", "Marketing"];

export const TEAM_STATUSES = ["Ativo", "Convidado", "Inativo"] as const;
export type TeamStatus = (typeof TEAM_STATUSES)[number];

export interface PermissionDefinition {
  /** Identificador estável da permissão. */
  key: string;
  label: string;
  description: string;
  /** Cargos que possuem essa permissão. */
  roles: TeamRole[];
}

/**
 * Matriz de direitos do sistema interno da Digitale Têxtil.
 * Desenvolvedor = admin master; Diretoria e Gerência têm os mesmos direitos
 * operacionais; Marketing é restrito a leitura/analytics e rascunhos.
 */
export const PERMISSIONS: PermissionDefinition[] = [
  {
    key: "dashboard.view",
    label: "Acessar o dashboard",
    description: "Visualizar indicadores gerais da operação.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência", "Marketing"],
  },
  {
    key: "analytics.view",
    label: "Ver relatórios e analytics",
    description: "Consultar métricas de engajamento e desempenho.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência", "Marketing"],
  },
  {
    key: "contacts.manage",
    label: "Gerenciar contatos",
    description: "Criar, importar, editar e exportar contatos e listas.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência"],
  },
  {
    key: "campaigns.draft",
    label: "Criar rascunhos de campanha",
    description: "Montar campanhas sem permissão de disparo.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência", "Marketing"],
  },
  {
    key: "campaigns.send",
    label: "Disparar campanhas",
    description: "Enviar e agendar disparos para a base de contatos.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência"],
  },
  {
    key: "templates.manage",
    label: "Gerenciar templates",
    description: "Criar, editar, importar do Canva e excluir modelos.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência"],
  },
  {
    key: "automations.manage",
    label: "Gerenciar automações",
    description: "Criar e publicar fluxos automáticos de e-mail.",
    roles: ["Desenvolvedor", "Diretoria", "Gerência"],
  },
  {
    key: "settings.domain",
    label: "Configurar domínio de e-mail",
    description: "Editar provedor, remetente e registros SPF/DKIM/DMARC.",
    roles: ["Desenvolvedor"],
  },
  {
    key: "settings.team",
    label: "Gerenciar equipe e cargos",
    description: "Adicionar membros e alterar cargos e direitos.",
    roles: ["Desenvolvedor"],
  },
];

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  Desenvolvedor: "Admin master: acesso irrestrito, incluindo ajustes técnicos e equipe.",
  Diretoria: "Acesso operacional completo, exceto ajustes do sistema.",
  Gerência: "Mesmos direitos da Diretoria para operação de marketing.",
  Marketing: "Leitura de analytics e criação de rascunhos, sem disparo.",
};

export function roleHasPermission(role: TeamRole, key: string): boolean {
  const permission = PERMISSIONS.find((item) => item.key === key);
  return permission ? permission.roles.includes(role) : false;
}

export function permissionsForRole(role: TeamRole): PermissionDefinition[] {
  return PERMISSIONS.filter((permission) => permission.roles.includes(role));
}
