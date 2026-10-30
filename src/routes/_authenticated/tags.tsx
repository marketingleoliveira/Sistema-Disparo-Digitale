import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Tag, Users, Loader2, Eye } from "lucide-react";
import { useDataStore } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/tags")({
  component: TagsPage,
});

// DIGITALE_TAGS_READONLY_V1
// Consulta somente leitura. Nenhuma operacao de alteracao de tags.
function TagsPage() {
  const { contacts, fetchContacts, isLoading } = useDataStore();

  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [contactSearch, setContactSearch] = React.useState("");

  React.useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  const tags = React.useMemo(() => {
    const names = Array.from(new Set([
      "IA",
      ...contacts.flatMap(contact => contact.tags ?? []),
    ]))
      .filter(name => typeof name === "string" && name.trim())
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    return names.map(name => ({
      name,
      count: contacts.filter(contact =>
        (contact.tags ?? []).includes(name)
      ).length,
    }));
  }, [contacts]);

  const filteredTags = tags.filter(tag =>
    tag.name.toLocaleLowerCase("pt-BR").includes(
      search.trim().toLocaleLowerCase("pt-BR")
    )
  );

  const tagContacts = React.useMemo(() => {
    if (!selectedTag) return [];

    const term = contactSearch.trim().toLocaleLowerCase("pt-BR");

    return contacts.filter(contact => {
      if (!(contact.tags ?? []).includes(selectedTag)) return false;

      if (!term) return true;

      return [
        contact.name,
        contact.email,
        contact.company,
      ].some(value =>
        String(value ?? "").toLocaleLowerCase("pt-BR").includes(term)
      );
    });
  }, [contacts, selectedTag, contactSearch]);

  const openTag = (name: string) => {
    setContactSearch("");
    setSelectedTag(name);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize as classificações e seus contatos associados.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar tags..."
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </span>
      </div>

      {isLoading && contacts.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando tags...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTags.map(tag => (
            <button
              key={tag.name}
              type="button"
              onClick={() => openTag(tag.name)}
              className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-xl bg-muted p-3">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold">
                      {tag.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tag.count} {tag.count === 1 ? "contato" : "contatos"}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {!isLoading && filteredTags.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma tag encontrada.
        </div>
      )}

      <Dialog
        open={selectedTag !== null}
        onOpenChange={open => {
          if (!open) {
            setSelectedTag(null);
            setContactSearch("");
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Contatos da tag: {selectedTag}
            </DialogTitle>
            <DialogDescription>
              Visualização somente leitura dos contatos associados.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <div className="relative w-full max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={contactSearch}
                onChange={event => setContactSearch(event.target.value)}
                placeholder="Pesquisar nome, e-mail ou empresa..."
                className="pl-10"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {tagContacts.length} contato(s)
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b">
                  <th className="p-3 font-semibold">Nome / E-mail</th>
                  <th className="p-3 font-semibold">Empresa</th>
                  <th className="p-3 font-semibold">Listas</th>
                  <th className="p-3 font-semibold">Tags</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {tagContacts.map(contact => (
                  <tr key={contact.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{contact.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {contact.email || "—"}
                      </div>
                    </td>
                    <td className="p-3">{contact.company || "—"}</td>
                    <td className="p-3">
                      {(contact.lists ?? []).join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      {(contact.tags ?? []).join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      {String(
                        "status" in contact
                          ? contact.status ?? "—"
                          : "—"
                      )}
                    </td>
                  </tr>
                ))}
                {tagContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      Nenhum contato encontrado nesta tag.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
