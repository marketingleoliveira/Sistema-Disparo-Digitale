import * as React from "react";
import { toast } from "sonner";
import {
  listSharedTemplates,
  saveSharedTemplate,
  deleteSharedTemplate,
  clearSharedHiddenOfficials,
} from "@/lib/disparo-shared-templates.functions";
import type { SharedTemplateKind } from "@/lib/disparo-shared-templates.server";

/** A fonte de verdade e o MariaDB: dados antigos do localStorage nunca sao importados. */
export function useSharedTemplateStore<T extends { id: string }>(kind: SharedTemplateKind) {
  const [items, setItems] = React.useState<T[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const dataRef = React.useRef<T[]>([]);
  const revision = React.useRef(0);
  const pending = React.useRef(0);
  const errorNotified = React.useRef(false);

  const refresh = React.useCallback(async () => {
    const seenRevision = revision.current;
    try {
      const fetched = await listSharedTemplates({ data: { kind } });
      if (revision.current === seenRevision && pending.current === 0) {
        const next = fetched as unknown as T[];
        dataRef.current = next;
        setItems(next);
      }
      errorNotified.current = false;
      setIsLoaded(true);
    } catch {
      if (!errorNotified.current) {
        toast.error("Nao foi possivel carregar os templates compartilhados.");
        errorNotified.current = true;
      }
    }
  }, [kind]);

  React.useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    const onFocus = () => void refresh();
    const onVisible = () => { if (!document.hidden) void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const local = React.useCallback((next: T[]) => {
    revision.current += 1;
    dataRef.current = next;
    setItems(next);
  }, []);

  const persist = React.useCallback(async (operation: () => Promise<unknown>) => {
    pending.current += 1;
    try {
      await operation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao sincronizar template.");
    } finally {
      pending.current -= 1;
      revision.current += 1;
      if (pending.current === 0) void refresh();
    }
  }, [refresh]);

  const getItems = React.useCallback(() => dataRef.current, []);

  const upsert = React.useCallback((item: T) => {
    local([item, ...dataRef.current.filter(t => t.id !== item.id)]);
    void persist(() => saveSharedTemplate({ data: { kind, template: item } }));
  }, [kind, local, persist]);

  const remove = React.useCallback((id: string) => {
    local(dataRef.current.filter(t => t.id !== id));
    void persist(() => deleteSharedTemplate({ data: { kind, id } }));
  }, [kind, local, persist]);

  const clearHidden = React.useCallback(() => {
    if (kind !== "hidden-official") return;
    local([]);
    void persist(() => clearSharedHiddenOfficials());
  }, [kind, local, persist]);

  return { items, isLoaded, getItems, upsert, remove, clearHidden };
}
