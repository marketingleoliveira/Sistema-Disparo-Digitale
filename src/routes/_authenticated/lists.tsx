import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Plus, 
  Search, 
  List, 
  MoreHorizontal, 
  Trash2, 
  Users,
  Calendar,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useDataStore } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/lists")({
  component: ListsPage,
});

function ListsPage() {
  const { lists, fetchLists, addList, deleteList, isLoading } = useDataStore();
  const [search, setSearch] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [newListDesc, setNewListDesc] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const filteredLists = lists.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    try {
      await addList(newListName, newListDesc);
      toast.success("Lista criada com sucesso!");
      setIsAdding(false);
      setNewListName("");
      setNewListDesc("");
    } catch (error) {
      toast.error("Erro ao criar lista");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta lista?")) return;
    try {
      await deleteList(id);
      toast.success("Lista excluída");
    } catch (error) {
      toast.error("Erro ao excluir lista");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Listas</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Organize seus contatos em listas estáticas para disparos direcionados.
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all rounded-lg px-6"
        >
          <Plus size={18} className="mr-2" />
          Nova Lista
        </Button>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Pesquisar listas..." 
            className="pl-9 h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lists Grid */}
      {isLoading && lists.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list) => (
            <Card key={list.id} className="group hover:shadow-md transition-all border-border/60 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-secondary/50 rounded-lg text-primary">
                    <List size={20} />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(list.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-4 group-hover:text-accent transition-colors">
                  {list.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {list.description || "Sem descrição definida."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Users size={14} />
                    <span>{list.contactCount || 0} contatos</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                    <Calendar size={12} />
                    <span>{format(new Date(list.createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredLists.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center rounded-xl border-2 border-dashed border-border/60 bg-muted/5">
              <div className="mx-auto w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4">
                <List size={24} />
              </div>
              <h3 className="text-lg font-bold text-primary">Nenhuma lista encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Crie sua primeira lista para começar a organizar sua base de contatos Digitale Têxtil.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 font-bold"
                onClick={() => setIsAdding(true)}
              >
                Nova Lista
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog Nova Lista */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Lista</DialogTitle>
            <DialogDescription>
              Dê um nome e uma descrição para sua nova lista de contatos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateList} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Lista</Label>
              <Input 
                id="name" 
                placeholder="Ex: Newsletter Site" 
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input 
                id="description" 
                placeholder="Ex: Contatos que optaram pelo site corporativo" 
                value={newListDesc}
                onChange={e => setNewListDesc(e.target.value)}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar Lista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
