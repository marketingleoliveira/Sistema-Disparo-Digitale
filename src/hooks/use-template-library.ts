import * as React from "react";
import { createTemplateId, type StoredTemplate } from "@/lib/templates/stored-template";
import { useSharedTemplateStore } from "./use-shared-template-store";

/** Biblioteca compartilhada por todos os usuarios autenticados. */
export function useTemplateLibrary() {
  const shared = useSharedTemplateStore<StoredTemplate>("marketing");

  const addTemplate = React.useCallback((template: StoredTemplate) => {
    shared.upsert(template);
  }, [shared.upsert]);

  const updateTemplate = React.useCallback((
    id: string,
    patch: Partial<Omit<StoredTemplate, "id" | "createdAt">>
  ) => {
    const current = shared.getItems().find(item => item.id === id);
    if (current) {
      shared.upsert({ ...current, ...patch, updatedAt: new Date().toISOString() });
    }
  }, [shared.getItems, shared.upsert]);

  const removeTemplate = React.useCallback((id: string) => {
    shared.remove(id);
  }, [shared.remove]);

  const duplicateTemplate = React.useCallback((id: string) => {
    const current = shared.getItems().find(item => item.id === id);
    if (!current) return;
    const now = new Date().toISOString();
    shared.upsert({
      ...current,
      id: createTemplateId("copy"),
      name: `${current.name} (cópia)`,
      createdAt: now,
      updatedAt: now,
    });
  }, [shared.getItems, shared.upsert]);

  return {
    templates: shared.items,
    isLoaded: shared.isLoaded,
    addTemplate, updateTemplate, removeTemplate, duplicateTemplate,
  };
}
