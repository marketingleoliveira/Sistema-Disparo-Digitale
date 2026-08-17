import * as React from "react";

const STORAGE_KEY = "digitale:hidden-official-templates";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]).filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Controla quais modelos oficiais foram excluídos (ocultados) pelo usuário. */
export function useHiddenOfficialTemplates() {
  const [hidden, setHidden] = React.useState<string[]>([]);

  React.useEffect(() => {
    setHidden(read());
  }, []);

  const commit = React.useCallback((next: string[]) => {
    setHidden(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignora falha de quota: mantém apenas em memória.
    }
  }, []);

  const hideOfficial = React.useCallback(
    (id: string) => commit(Array.from(new Set([...read(), id]))),
    [commit],
  );

  const restoreAll = React.useCallback(() => commit([]), [commit]);

  return { hidden, hideOfficial, restoreAll };
}
