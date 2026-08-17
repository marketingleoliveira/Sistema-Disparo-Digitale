import * as React from "react";
import { createTemplateId, type StoredTemplate } from "@/lib/templates/stored-template";

const STORAGE_KEY = "digitale:templates";
/** Chave anterior, usada apenas para migração dos designs importados do Canva. */
const LEGACY_KEY = "digitale:imported-templates";

function read(): StoredTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredTemplate[]).map((t) => ({
      ...t,
      kind: t.kind ?? "html",
      createdAt: t.createdAt ?? new Date().toISOString(),
      updatedAt: t.updatedAt ?? t.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function write(items: StoredTemplate[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    // Quota excedida (imagens em base64): mantém em memória.
    return false;
  }
}

/** Biblioteca de templates do usuário com CRUD completo, persistida localmente. */
export function useTemplateLibrary() {
  const [templates, setTemplates] = React.useState<StoredTemplate[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Leitura apenas após hidratação, para evitar mismatch de SSR.
  React.useEffect(() => {
    setTemplates(read());
    setIsLoaded(true);
  }, []);

  const commit = React.useCallback(
    (updater: (prev: StoredTemplate[]) => StoredTemplate[]) => {
      setTemplates((prev) => {
        const next = updater(prev);
        write(next);
        return next;
      });
    },
    [],
  );

  const addTemplate = React.useCallback(
    (template: StoredTemplate) => {
      commit((prev) => [template, ...prev.filter((t) => t.id !== template.id)]);
    },
    [commit],
  );

  const updateTemplate = React.useCallback(
    (id: string, patch: Partial<Omit<StoredTemplate, "id" | "createdAt">>) => {
      commit((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
        ),
      );
    },
    [commit],
  );

  const removeTemplate = React.useCallback(
    (id: string) => {
      commit((prev) => prev.filter((t) => t.id !== id));
    },
    [commit],
  );

  const duplicateTemplate = React.useCallback(
    (id: string) => {
      commit((prev) => {
        const source = prev.find((t) => t.id === id);
        if (!source) return prev;
        const now = new Date().toISOString();
        const copy: StoredTemplate = {
          ...source,
          id: createTemplateId("copy"),
          name: `${source.name} (cópia)`,
          createdAt: now,
          updatedAt: now,
        };
        return [copy, ...prev];
      });
    },
    [commit],
  );

  return { templates, isLoaded, addTemplate, updateTemplate, removeTemplate, duplicateTemplate };
}
