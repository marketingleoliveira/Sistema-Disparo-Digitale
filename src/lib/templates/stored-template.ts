import type { EditorBlock } from "@/components/editor/editor-types";

export type StoredTemplateKind = "image" | "html" | "editor";

/** Template persistido na biblioteca do usuário (criado no editor ou importado). */
export interface StoredTemplate {
  id: string;
  name: string;
  category: string;
  /** Miniatura exibida no card (data URL, URL remota ou vazio). */
  image: string;
  /** HTML final pronto para disparo. */
  html: string;
  kind: StoredTemplateKind;
  /** Blocos do editor visual — presente apenas em templates do tipo "editor". */
  blocks?: EditorBlock[];
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function createTemplateId(prefix = "tpl"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
