import * as React from "react";

const STORAGE_KEY = "digitale:transactional-templates";

/** Template transacional criado/editado pelo usuário, persistido localmente. */
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

function read(): TransactionalTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TransactionalTemplate[];
  } catch {
    return [];
  }
}

function write(items: TransactionalTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota excedida: mantém apenas em memória.
  }
}

/** CRUD completo dos templates de e-mail transacional do usuário. */
export function useTransactionalTemplates() {
  const [templates, setTemplates] = React.useState<TransactionalTemplate[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setTemplates(read());
    setIsLoaded(true);
  }, []);

  const commit = React.useCallback(
    (updater: (prev: TransactionalTemplate[]) => TransactionalTemplate[]) => {
      setTemplates((prev) => {
        const next = updater(prev);
        write(next);
        return next;
      });
    },
    [],
  );

  const createTemplate = React.useCallback(
    (input: Pick<TransactionalTemplate, "label" | "description" | "subject" | "html">) => {
      const now = new Date().toISOString();
      const template: TransactionalTemplate = {
        ...input,
        id: createTransactionalId(),
        createdAt: now,
        updatedAt: now,
      };
      commit((prev) => [template, ...prev]);
      return template;
    },
    [commit],
  );

  const updateTemplate = React.useCallback(
    (id: string, patch: Partial<Omit<TransactionalTemplate, "id" | "createdAt">>) => {
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
    (source: Pick<TransactionalTemplate, "label" | "description" | "subject" | "html">) => {
      const now = new Date().toISOString();
      const copy: TransactionalTemplate = {
        ...source,
        label: `${source.label} (cópia)`,
        id: createTransactionalId(),
        createdAt: now,
        updatedAt: now,
      };
      commit((prev) => [copy, ...prev]);
      return copy;
    },
    [commit],
  );

  return {
    templates,
    isLoaded,
    createTemplate,
    updateTemplate,
    removeTemplate,
    duplicateTemplate,
  };
}