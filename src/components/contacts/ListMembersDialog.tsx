import { downloadContactsCsv } from "@/lib/contacts/export-csv";
import * as React from "react";
import { toast } from "sonner";
import {
  useDataStore,
  type Contact,
  type ContactList
} from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type Props = {
  list: ContactList | null;
  onClose: () => void;
};

export function ListMembersDialog({ list, onClose }: Props) {
  const {
    contacts,
    lists,
    fetchContacts,
    fetchLists,
    updateContact
  } = useDataStore();

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [targets, setTargets] =
    React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!list) return;

    setSearch("");
    setPage(1);
    setTargets({});

    void fetchContacts().catch(() => {
      toast.error("Falha ao carregar contatos desta lista.");
    });
  }, [list?.id, fetchContacts]);

  const members = React.useMemo(() => {
    if (!list) return [];

    const term = search.trim().toLowerCase();

    return contacts.filter(contact =>
      (contact.lists ?? []).includes(list.name) &&
      (
        !term ||
        [contact.name, contact.email, contact.company]
          .some(value =>
            (value ?? "").toLowerCase().includes(term)
          )
      )
    );
  }, [contacts, list?.name, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(members.length / 25)
  );
  const currentPage = Math.min(page, totalPages);

  const visible = members.slice(
    (currentPage - 1) * 25,
    currentPage * 25
  );

  async function changeList(
    contact: Contact,
    mode: "add" | "move"
  ) {
    if (!list || saving !== null) return;

    const destination = lists.find(
      item => item.id === targets[contact.id]
    );

    if (!destination || destination.id === list.id) {
      toast.error("Selecione outra lista existente.");
      return;
    }

    const current = contact.lists ?? [];

    if (
      mode === "add" &&
      current.includes(destination.name)
    ) {
      toast.info("O contato ja pertence a essa lista.");
      return;
    }

    const remaining = mode === "move"
      ? current.filter(name => name !== list.name)
      : current;

    const updated = Array.from(
      new Set([...remaining, destination.name])
    );

    setSaving(contact.id);

    try {
      await updateContact(contact.id, {
        name: contact.name,
        email: contact.email,
        company: contact.company ?? "",
        phone: contact.phone ?? "",
        status: contact.status,
        tags: contact.tags ?? [],
        lists: updated
      });

      await fetchLists();

      toast.success(
        mode === "move"
          ? "Contato movido para outra lista."
          : "Contato adicionado tambem a outra lista."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao atualizar o contato."
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog
      open={list !== null}
      onOpenChange={open => {
        if (!open && saving === null) onClose();
      }}
    >
      <DialogContent className="sm:max-w-6xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Contatos da lista: {list?.name ?? ""}
          </DialogTitle>
          <DialogDescription>
            Adicione um contato a outra lista ou mova sua
            associacao, sem duplicar o cadastro do e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Pesquisar nome, e-mail ou empresa..."
              aria-label="Pesquisar contatos da lista"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="sm:max-w-sm"
            />

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {members.length} contato(s)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={members.length === 0 || saving !== null}
                onClick={() => {
                  downloadContactsCsv(members);
                  toast.success("CSV da lista exportado com sucesso.");
                }}
              >
                Exportar CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-[850px] w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3">Nome / E-mail</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Listas</th>
                  <th className="p-3">Tags</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Gerenciar</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(contact => (
                  <tr key={contact.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">
                        {contact.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {contact.email}
                      </div>
                    </td>

                    <td className="p-3">
                      {contact.company || "—"}
                    </td>

                    <td className="p-3 text-xs">
                      {(contact.lists ?? []).join(", ") || "—"}
                    </td>

                    <td className="p-3 text-xs">
                      {(contact.tags ?? []).join(", ") || "—"}
                    </td>

                    <td className="p-3">
                      {contact.status}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-col gap-2">
                        <select
                          aria-label={`Destino de ${contact.email}`}
                          className="h-9 rounded-md border bg-background px-2 text-xs"
                          value={targets[contact.id] ?? ""}
                          disabled={saving !== null}
                          onChange={event => {
                            setTargets(previous => ({
                              ...previous,
                              [contact.id]: event.target.value
                            }));
                          }}
                        >
                          <option value="">
                            Escolher lista
                          </option>
                          {lists
                            .filter(item => item.id !== list?.id)
                            .map(item => (
                              <option
                                key={item.id}
                                value={item.id}
                              >
                                {item.name}
                              </option>
                            ))}
                        </select>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              saving !== null ||
                              !targets[contact.id]
                            }
                            onClick={() => {
                              void changeList(contact, "add");
                            }}
                          >
                            Adicionar também
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              saving !== null ||
                              !targets[contact.id]
                            }
                            onClick={() => {
                              void changeList(contact, "move");
                            }}
                          >
                            Mover
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-muted-foreground"
                    >
                      Nenhum contato encontrado nesta lista.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
