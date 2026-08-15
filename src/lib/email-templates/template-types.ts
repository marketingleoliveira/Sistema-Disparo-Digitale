import type { ComponentType } from "react";

/**
 * Contrato de um template de e-mail da Digitale Têxtil.
 *
 * Este tipo espelha o `TemplateEntry` do registry gerenciado de e-mails.
 * Ele existe separadamente para que os templates possam ser criados,
 * revisados e versionados ANTES do domínio remetente estar verificado.
 * Quando o registry oficial for gerado, ele apenas reexporta este tipo.
 */
export interface TemplateEntry {
  /** Componente React Email renderizado no envio. */
  component: ComponentType<any>;
  /** Assunto padrão do e-mail. */
  subject: string;
  /** Nome amigável exibido no painel de pré-visualização. */
  displayName?: string;
  /** Dados de exemplo usados apenas na pré-visualização. */
  previewData?: Record<string, unknown>;
  /** Destinatário fixo (usado em notificações internas). */
  to?: string;
}

/** Identidade visual aplicada a todos os e-mails. */
export const BRAND = {
  name: "Digitale Têxtil",
  tagline: "Tecidos de Alta Tecnologia",
  navy: "#1e2d4d",
  navyDeep: "#16233c",
  orange: "#ee6c1f",
  ice: "#f6f7fb",
  border: "#e4e7ef",
  text: "#1e2d4d",
  textMuted: "#5b6579",
  white: "#ffffff",
  site: "https://disparodigitaletextil.lovable.app",
  logoUrl:
    "https://disparodigitaletextil.lovable.app/__l5e/assets-v1/af2de210-b6b2-4bfa-a5bb-5e09504424d4/digitale-logo-white.png",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
} as const;