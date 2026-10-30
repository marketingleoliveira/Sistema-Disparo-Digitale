import * as React from "react";
import { toast } from "sonner";
import {
  useDataStore,
  type Contact
} from "@/hooks/use-data";
import {
  updateDisparoContact
} from "@/lib/disparo-contacts.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,

  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type Mode = "add" | "move";

type Props = {
  open: boolean;
  selectedIds: string[];
  onOpenChange: (open: boolean) => void;
  onComplete: (remainingIds: string[]) => void;
};

export function ContactBulkListsDialog({
  open,
  selectedIds,
  onOpenChange,
  onComplete
}: Props) {
  const {
    contacts,
    lists,
    fetchContacts,
    fetchLists
  } = useDataStore();

  const [mode, setMode] = React.useState<Mode>("add");
  const [targetId, setTargetId] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;

    setMode("add");
    setTargetId("");
    setProgress(0);

    void fetchLists().catch(() => {
      toast.error("Nao foi possivel carregar as listas.");
    });
  }, [open, fetchLists]);

  const selected = React.useMemo(() => {
    const ids = new Set(selectedIds);
    return contacts.filter(contact => ids.has(contact.id));
  }, [contacts, selectedIds]);

  // DIGITALE_LISTAS_V3
  const target = lists.find(item => item.id === targetId);
  const validDestination = Boolean(target);
  const applicable = React.useMemo(() => {
    if (!target) return [];
    return selected.filter(contact => {
      const current = Array.from(new Set(contact.lists ?? []));
      if (mode === "add") return !current.includes(target.name);
      return current.length !== 1 || current[0] !== target.name;
    });
  }, [selected, target, mode]);
  const ignored = selected.length - applicable.length;
  function nextLists(contact: Contact): string[] {
    if (!target) return contact.lists ?? [];
    if (mode === "move") return [target.name];
    return Array.from(new Set([...(contact.lists ?? []), target.name]));
  }

  async function applyChanges() {
    if (
      running ||
      !validDestination ||
      !target ||
      applicable.length === 0
    ) return;

    if (mode === "move" && applicable.some(contact =>
      (contact.lists ?? []).some(name => name !== target.name)
    )) {
      if (!window.confirm(
        `Mover ${applicable.length} contato(s) para "${target.name}"?\n` +
        "As associacoes anteriores serao substituidas."
      )) return;
    }
    setRunning(true);
    setProgress(0);

    const failedIds: string[] = [];
    const errors: string[] = [];
    let completed = 0;

    // Limita a concorrencia para nao sobrecarregar a VPS.
    const concurrency = 3;

    for (
      let i = 0;
      i < applicable.length;
      i += concurrency
    ) {
      const batch = applicable.slice(
        i,
        i + concurrency
      );

      const results = await Promise.allSettled(
        batch.map(contact =>
          updateDisparoContact({
            data: {
              id: contact.id,
              contact: {
                name: contact.name,
                email: contact.email,
                company: contact.company ?? "",
                phone: contact.phone ?? "",
                status: contact.status,
                lists: nextLists(contact),
                tags: contact.tags ?? []
              }
            }
          })
        )
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          failedIds.push(batch[index]!.id);
          errors.push(
            result.reason instanceof Error
              ? result.reason.message
              : "Erro de atualizacao"
          );
        } else {
          completed++;
        }
      });

      setProgress(
        Math.min(i + batch.length, applicable.length)
      );
    }

    let refreshed = true;

    try {
      await fetchContacts();
      await fetchLists();
    } catch {
      refreshed = false;
    }

    setRunning(false);

    if (completed > 0) {
      toast.success(
        `${completed} contato(s) atualizado(s).`
      );
    }

    if (ignored > 0) {
      toast.info(
        `${ignored} contato(s) sem alteracao.`,
        {
          description:
            mode === "move"
              ? "Eles ja estao somente na lista de destino."
              : "Eles ja pertenciam a lista de destino."
        }
      );
    }

    if (failedIds.length > 0) {
      toast.error(
        `${failedIds.length} atualizacao(oes) falharam.`,
        {
          description:
            errors[0] ?? "Tente novamente."
        }
      );
    }

    if (!refreshed) {
      toast.warning(
        "Alteracoes processadas, mas a tela pode precisar ser atualizada."
      );
    }

    onComplete(failedIds);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!running) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Gerenciar listas dos contatos</DialogTitle>
          
        </DialogHeader>

        <div className="space-y-5 py-3">
          <p className="text-sm text-muted-foreground">
            <strong>{selectedIds.length}</strong> contato(s) selecionado(s).
          </p>
          <fieldset
            className="space-y-3"
            disabled={running}
          >
            <legend className="text-sm font-semibold">
              O que deseja fazer?
            </legend>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="bulk-list-mode"
                checked={mode === "add"}
                onChange={() => setMode("add")}
              />
              <span className="text-sm">
                <strong>Adicionar também</strong>
                <span className="block text-xs text-muted-foreground">
                  Mantém as listas atuais e adiciona
                  os contatos à lista escolhida.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="bulk-list-mode"
                checked={mode === "move"}
                onChange={() => setMode("move")}
              />
              <span className="text-sm">
                <strong>Mover para uma lista</strong>
                <span className="block text-xs text-muted-foreground">
                  Substitui as listas atuais pela lista
                  escolhida, inclusive para contatos sem lista.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Lista de destino
            </label>

            <select
              value={targetId}
              disabled={running}
              onChange={e => setTargetId(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">
                Selecione uma lista existente
              </option>
              {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
            </select>
          </div>

          {validDestination && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <p>
                <strong>{applicable.length}</strong>
                {" "}contato(s) serão atualizados.
              </p>
              <p>
                <strong>{ignored}</strong>
                {" "}permanecerão sem alteração.
              </p>

              {mode === "move" && (
                <p className="text-xs text-muted-foreground">
                  Contatos sem lista tambem podem ser movidos. As outras listas serao substituidas.
                </p>
              )}
            </div>
          )}

          {running && (
            <div
              className="space-y-2"
              role="status"
              aria-live="polite"
            >
              <div className="flex justify-between text-xs">
                <span>Atualizando contatos...</span>
                <span>
                  {progress} / {applicable.length}
                </span>
              </div>

              <progress
                className="w-full"
                value={progress}
                max={Math.max(applicable.length, 1)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={running}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={
              running ||
              !validDestination ||
              applicable.length === 0
            }
            onClick={() => void applyChanges()}
          >
            {running
              ? "Processando..."
              : mode === "move"
                ? `Mover ${applicable.length} contato(s)`
                : `Adicionar ${applicable.length} contato(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
