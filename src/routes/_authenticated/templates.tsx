import * as React from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit3, 
  Copy, 
  Trash2, 
  Play, 
  Layout, 
  Sparkles,
  ChevronRight,
  Filter
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VisualEmailEditor } from "@/components/editor/VisualEmailEditor";
import { motion, AnimatePresence } from "framer-motion";
import { CanvaImportDialog } from "@/components/templates/CanvaImportDialog";
import { useImportedTemplates } from "@/hooks/use-imported-templates";
import type { ImportedTemplate } from "@/lib/templates/canva-import";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/templates")({
  component: TemplatesPage,
});

// --- Mock Data ---

const CATEGORIES = [
  "Todos",
  "Newsletter",
  "Promoção",
  "Lançamento",
  "Produto",
  "Institucional",
  "Fitness",
  "Moda Praia",
  "White Label",
  "Datas comemorativas"
];

const TEMPLATES = [
  {
    id: 1,
    name: "Newsletter Semanal Verão",
    category: "Newsletter",
    updatedAt: "Há 2 dias",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop",
    isOfficial: true
  },
  {
    id: 2,
    name: "Promoção Black Friday",
    category: "Promoção",
    updatedAt: "Há 5 dias",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=500&fit=crop",
    isOfficial: true
  },
  {
    id: 3,
    name: "Lançamento Coleção Fitness",
    category: "Fitness",
    updatedAt: "Ontem",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=500&fit=crop",
    isOfficial: true
  },
  {
    id: 4,
    name: "Institucional - Digitale Têxtil",
    category: "Institucional",
    updatedAt: "Há 1 semana",
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=500&fit=crop",
    isOfficial: true
  },
  {
    id: 5,
    name: "Moda Praia 2026",
    category: "Moda Praia",
    updatedAt: "Há 3 horas",
    image: "https://images.unsplash.com/photo-1502033006978-d44a299349ef?w=400&h=500&fit=crop",
    isOfficial: false
  },
  {
    id: 6,
    name: "Oferta Relâmpago",
    category: "Promoção",
    updatedAt: "Há 4 dias",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=500&fit=crop",
    isOfficial: false
  }
];

// --- Sub-components ---

function TemplateCard({ template, onEdit }: { template: typeof TEMPLATES[0], onEdit: () => void }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
    >
      {/* Preview Visual */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img 
          src={template.image} 
          alt={template.name} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-primary/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
          <Button 
            onClick={onEdit}
            className="w-32 bg-accent text-accent-foreground font-bold"
            size="sm"
          >
            <Edit3 size={16} className="mr-2" /> Editar
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="w-15 h-8 p-0">
              <Copy size={14} />
            </Button>
            <Button variant="secondary" size="sm" className="w-15 h-8 p-0">
              <Play size={14} />
            </Button>
            <Button variant="destructive" size="sm" className="w-15 h-8 p-0">
              <Trash2 size={14} />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-32 border-white text-white hover:bg-white hover:text-primary font-bold">
            Usar Template
          </Button>
        </div>

        {template.isOfficial && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-accent text-accent-foreground border-none shadow-sm flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
              <Sparkles size={10} /> Oficial Digitale
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-primary truncate max-w-[160px]">{template.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{template.category} • {template.updatedAt}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function TemplatesPage() {
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState("Todos");
  const [searchQuery, setSearchQuery] = React.useState("");
  const { templates: importedTemplates, addTemplate, removeTemplate } = useImportedTemplates();
  const [previewTemplate, setPreviewTemplate] = React.useState<ImportedTemplate | null>(null);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === "Todos" || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const officialTemplates = filteredTemplates.filter(t => t.isOfficial);
  const userTemplates = filteredTemplates.filter(t => !t.isOfficial);

  const filteredImported = importedTemplates.filter(t => {
    const matchesCategory = activeCategory === "Todos" || t.category === activeCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditing(false)}
              className="font-bold text-muted-foreground"
            >
              <Layout size={18} className="mr-2" /> Voltar à Biblioteca
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-primary">Editando Template</h1>
              <p className="text-xs text-muted-foreground">Personalize o design para sua campanha.</p>
            </div>
          </div>
        </div>
        <VisualEmailEditor />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Escolha um modelo pronto ou crie seu próprio design personalizado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CanvaImportDialog onImported={addTemplate} />
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-accent text-accent-foreground font-bold shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} className="mr-2" />
            Criar template
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar templates..." 
              className="pl-10 h-10 bg-card" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Button variant="outline" size="sm" className="h-10 px-4 font-bold shrink-0">
              <Filter size={16} className="mr-2" /> Filtros avançados
            </Button>
          </div>
        </div>

        <ScrollArea className="w-full pb-2">
          <div className="flex items-center gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0",
                  activeCategory === category 
                    ? "bg-primary text-white shadow-md" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Featured Section: Digitale Têxtil */}
      {officialTemplates.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-accent" size={20} />
              <h2 className="text-lg font-bold text-primary">Templates da Digitale Têxtil</h2>
            </div>
            <Button variant="link" className="text-accent font-bold text-xs p-0 h-auto">
              Ver mais oficiais <ChevronRight size={14} />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {officialTemplates.map(template => (
              <TemplateCard key={template.id} template={template} onEdit={() => setIsEditing(true)} />
            ))}
          </div>
        </section>
      )}

      {/* Imported from Canva */}
      {filteredImported.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary">Importados do Canva</h2>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {filteredImported.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredImported.map(template => (
              <div
                key={template.id}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {template.image ? (
                    <img
                      src={template.image}
                      alt={template.name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Layout size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-primary/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                    <Button
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="w-32 bg-accent text-accent-foreground font-bold"
                    >
                      <Play size={14} className="mr-2" /> Pré-visualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-32 font-bold"
                      onClick={() => removeTemplate(template.id)}
                    >
                      <Trash2 size={14} className="mr-2" /> Excluir
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="border-none bg-primary text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Canva
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="truncate text-sm font-bold text-primary">{template.name}</h4>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {template.category} • pronto para disparo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* User Templates Section */}
      {userTemplates.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-primary">Meus Templates</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {userTemplates.map(template => (
              <TemplateCard key={template.id} template={template} onEdit={() => setIsEditing(true)} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && filteredImported.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 rounded-full bg-muted p-6 text-muted-foreground">
            <Search size={48} />
          </div>
          <h3 className="text-xl font-bold text-primary">Nenhum template encontrado</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Não encontramos templates para "{searchQuery}" na categoria "{activeCategory}". Tente outros termos.
          </p>
          <Button 
            variant="outline" 
            className="mt-8 font-bold"
            onClick={() => {
              setActiveCategory("Todos");
              setSearchQuery("");
            }}
          >
            Limpar todos os filtros
          </Button>
        </div>
      )}

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-primary">{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <iframe
              title={`Pré-visualização de ${previewTemplate.name}`}
              srcDoc={previewTemplate.html}
              sandbox=""
              className="h-[65vh] w-full rounded-lg border bg-white"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Separator = ({ orientation = "horizontal", className }: { orientation?: "horizontal" | "vertical", className?: string }) => (
  <div className={cn("bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "w-[1px] h-full", className)} />
);
