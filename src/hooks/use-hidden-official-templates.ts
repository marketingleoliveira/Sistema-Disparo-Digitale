import * as React from "react";
import { useSharedTemplateStore } from "./use-shared-template-store";

export function useHiddenOfficialTemplates() {
  const shared = useSharedTemplateStore<{ id: string }>("hidden-official");
  const hidden = React.useMemo(() => shared.items.map(item => item.id), [shared.items]);
  const hideOfficial = React.useCallback((id: string) => {
    shared.upsert({ id });
  }, [shared.upsert]);
  const restoreAll = React.useCallback(() => {
    shared.clearHidden();
  }, [shared.clearHidden]);
  return { hidden, hideOfficial, restoreAll };
}
