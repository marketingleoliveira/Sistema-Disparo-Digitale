import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Plus, 
  Search, 
  Target, 
  Trash2, 
  Filter,
  Users,
  Calendar,
  Loader2,
  ChevronRight,
  Settings2
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
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/segments")({
  component: SegmentsPage,
});

function SegmentsPage() {
  const { segments, fetchSegments, addSegment, deleteSegment, isLoading } = useDataStore();
  const [search, setSearch] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const filteredSegments = segments.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      // Mock de filtros para a versão inicial
      const filters = { engagement: "> 80", lastActivity: "30d" };
      await addSegment(newName, newDesc, filters);
      toast.success("Segmento criado com sucesso!");
      setIsAdding(false);
      setNewName("");
      setNewDesc("");
    } catch (error) {
      toast.error("Erro ao criar segmento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este segmento?")) return;
    try {
      await deleteSegment(id);
      toast.success("Segmento excluído");
    } catch (error) {
      toast.error("Erro ao excluir segmento");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Segmentação</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Crie filtros dinâmicos baseados no comportamento e atributos dos contatos.
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all rounded-lg px-6"
        >
          <Plus size={18} className="mr-2" />
          Novo Segmento
        </Button>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Pesquisar segmentos..." 
            className="pl-9 h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Segments Grid */}
      {isLoading && segments.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSegments.map((segment) => (
            <Card key={segment.id} className="group hover:shadow-md transition-all border-border/60 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-secondary/50 rounded-lg text-primary">
                    <Target size={20} />
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Settings2 size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(segment.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors">
                  {segment.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {segment.description || "Regras de filtragem dinâmica aplicadas."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {segment.filters && Object.entries(segment.filters).map(([key, value]: [string, any]) => (
                      <Badge key={key} variant="outline" className="text-[10px] bg-muted/30 border-dashed">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <Filter size={12} />
                      <span>Atualizado em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                      <Calendar size={12} />
                      <span>{format(new Date(segment.createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredSegments.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center rounded-xl border-2 border-dashed border-border/60 bg-muted/5">
              <div className="mx-auto w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold text-primary">Nenhum segmento encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Crie segmentos inteligentes para filtrar sua base automaticamente por comportamento.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 font-bold"
                onClick={() => setIsAdding(true)}
              >
                Novo Segmento
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog Novo Segmento */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Segmento</DialogTitle>
            <DialogDescription>
              O segmento filtrará contatos automaticamente com base nas regras que você definir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSegment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Segmento</Label>
              <Input 
                id="name" 
                placeholder="Ex: Clientes Inativos (+30 dias)" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description" 
                placeholder="Ex: Filtra contatos que não abrem e-mails há um mês" 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/30 border border-dashed border-primary/20 mt-4">
              <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
                <Settings2 size={14} />
                <span>Regras Sugeridas</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Nesta versão, os segmentos serão criados com filtros padrão de engajamento alto e atividade recente. O construtor visual de filtros será implementado na próxima etapa.
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar Segmento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
