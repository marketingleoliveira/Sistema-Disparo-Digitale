import * as React from "react";
import { useSharedTemplateStore } from "./use-shared-template-store";

export interface TransactionalTemplate {
  id: string;
  label: string;
  description: string;
  subject: string;
  html: string;
  createdAt: string;
  updatedAt: string;
}

export function createTransactionalId(): string {
  return `txt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useTransactionalTemplates() {
  const shared = useSharedTemplateStore<TransactionalTemplate>("transactional");

  const createTemplate = React.useCallback((
    input: Pick<TransactionalTemplate, "label" | "description" | "subject" | "html">
  ): TransactionalTemplate => {
    const now = new Date().toISOString();
    const template: TransactionalTemplate = {
      ...input, id: createTransactionalId(), createdAt: now, updatedAt: now,
    };
    shared.upsert(template);
    return template;
  }, [shared.upsert]);

  const updateTemplate = React.useCallback((
    id: string,
    patch: Partial<Omit<TransactionalTemplate, "id" | "createdAt">>
  ) => {
    const current = shared.getItems().find(item => item.id === id);
    if (current) shared.upsert({ ...current, ...patch, updatedAt: new Date().toISOString() });
  }, [shared.getItems, shared.upsert]);

  const removeTemplate = React.useCallback((id: string) => {
    shared.remove(id);
  }, [shared.remove]);

  const duplicateTemplate = React.useCallback((
    source: Pick<TransactionalTemplate, "label" | "description" | "subject" | "html">
  ) => {
    const now = new Date().toISOString();
    shared.upsert({ ...source, label: `${source.label} (cópia)`,
      id: createTransactionalId(), createdAt: now, updatedAt: now });
  }, [shared.upsert]);

  return {
    templates: shared.items, isLoaded: shared.isLoaded,
    createTemplate, updateTemplate, removeTemplate, duplicateTemplate,
  };
}
