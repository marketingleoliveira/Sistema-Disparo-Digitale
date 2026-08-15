import * as React from "react";
import type { ImportedTemplate } from "@/lib/templates/canva-import";

const STORAGE_KEY = "digitale:imported-templates";

function readStorage(): ImportedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImportedTemplate[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: ImportedTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota excedida (imagens em base64). Falha silenciosa: o template segue em memória.
  }
}

/** Templates importados (ex.: designs do Canva), persistidos localmente. */
export function useImportedTemplates() {
  const [templates, setTemplates] = React.useState<ImportedTemplate[]>([]);

  // Leitura só após hidratação, para evitar mismatch de SSR.
  React.useEffect(() => {
    setTemplates(readStorage());
  }, []);

  const addTemplate = React.useCallback((template: ImportedTemplate) => {
    setTemplates((prev) => {
      const next = [template, ...prev];
      writeStorage(next);
      return next;
    });
  }, []);

  const removeTemplate = React.useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeStorage(next);
      return next;
    });
  }, []);

  return { templates, addTemplate, removeTemplate };
}