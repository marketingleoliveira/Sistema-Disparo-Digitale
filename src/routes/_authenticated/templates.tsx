import * as React from "react";
import {
  Plus,
  Search,
  Edit3,
  Copy,
  Trash2,
  Play,
  Layout,
  Sparkles,
  Filter,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisualEmailEditor } from "@/components/editor/VisualEmailEditor";
import { INITIAL_BLOCKS, type EditorBlock } from "@/components/editor/editor-types";
import { motion } from "framer-motion";
import { CanvaImportDialog } from "@/components/templates/CanvaImportDialog";
import { useTemplateLibrary } from "@/hooks/use-template-library";
import { useHiddenOfficialTemplates } from "@/hooks/use-hidden-official-templates";
import { blocksToEmailHtml } from "@/lib/templates/blocks-to-html";
import { createTemplateId, type StoredTemplate } from "@/lib/templates/stored-template";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/templates")({
  component: TemplatesPage,
  head: () => ({
    meta: [
      { title: "Templates de Campanha | Digitale Têxtil" },
      {
        name: "description",
        content:
          "Crie, edite, duplique e importe templates de e-mail para as campanhas da Digitale Têxtil.",
      },
      { property: "og:title", content: "Templates de Campanha | Digitale Têxtil" },
      {
        property: "og:description",
        content: "Biblioteca de templates de e-mail marketing da Digitale Têxtil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

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
  "Datas comemorativas",
] as const;

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== "Todos");

interface OfficialTemplate {
  id: string;
  name: string;
  category: string;
  image: string;
  blocks: EditorBlock[];
}

/** Modelos base da marca: sempre disponíveis e usados como ponto de partida. */
const OFFICIAL_TEMPLATES: OfficialTemplate[] = [
  {
    id: "official-newsletter",
    name: "Newsletter Institucional",
    category: "Newsletter",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop",
    blocks: INITIAL_BLOCKS,
  },
  {
    id: "official-promocao",
    name: "Promoção de Coleção",
    category: "Promoção",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=500&fit=crop",
    blocks: INITIAL_BLOCKS.map((b) =>
      b.type === "title"
        ? { ...b, content: { text: "{{nome}}, sua coleção com condição especial" } }
        : b,
    ),
  },
  {
    id: "official-lancamento",
    name: "Lançamento de Linha",
    category: "Lançamento",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=500&fit=crop",
    blocks: INITIAL_BLOCKS.map((b) =>
      b.type === "title" ? { ...b, content: { text: "Nova linha disponível" } } : b,
    ),
  },
];

type EditorState =
  | { mode: "closed" }
  | { mode: "new"; name: string; category: string; blocks: EditorBlock[] }
  | { mode: "edit"; template: StoredTemplate };

function TemplatesPage() {
  const [editor, setEditor] = React.useState<EditorState>({ mode: "closed" });
  const [activeCategory, setActiveCategory] = React.useState<string>("Todos");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [previewTemplate, setPreviewTemplate] = React.useState<StoredTemplate | null>(null);
  const [renaming, setRenaming] = React.useState<StoredTemplate | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameCategory, setRenameCategory] = React.useState<string>(CATEGORY_OPTIONS[0]!);

  const { templates, isLoaded, addTemplate, updateTemplate, removeTemplate, duplicateTemplate } =
    useTemplateLibrary();
  const { hidden, hideOfficial, restoreAll } = useHiddenOfficialTemplates();

  const matches = React.useCallback(
    (name: string, category: string) => {
      const byCategory = activeCategory === "Todos" || category === activeCategory;
      const bySearch = name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return byCategory && bySearch;
    },
    [activeCategory, searchQuery],
  );

  const officialFiltered = OFFICIAL_TEMPLATES.filter(
    (t) => !hidden.includes(t.id) && matches(t.name, t.category),
  );
  const myFiltered = templates.filter((t) => matches(t.name, t.category));

  /** Cria um template novo no editor, partindo de um modelo oficial ou em branco. */
  const openNewEditor = (source?: OfficialTemplate) => {
    setEditor({
      mode: "new",
      name: source ? `${source.name} — cópia` : "Novo template",
      category: source?.category ?? CATEGORY_OPTIONS[0]!,
      blocks: source ? source.blocks : INITIAL_BLOCKS,
    });
  };

  const handleSaveFromEditor = (blocks: EditorBlock[]) => {
    if (editor.mode === "new") {
      const now = new Date().toISOString();
      const created: StoredTemplate = {
        id: createTemplateId("editor"),
        name: editor.name.trim() || "Novo template",
        category: editor.category,
        image: String(blocks.find((b) => b.type === "image")?.content?.url ?? ""),
        html: blocksToEmailHtml(blocks, editor.name),
        kind: "editor",
        blocks,
        createdAt: now,
        updatedAt: now,
      };
      addTemplate(created);
      toast.success("Template criado e salvo na sua biblioteca.");
      setEditor({ mode: "closed" });
      return;
    }
    if (editor.mode === "edit") {
      updateTemplate(editor.template.id, {
        blocks,
        html: blocksToEmailHtml(blocks, editor.template.name),
        image:
          String(blocks.find((b) => b.type === "image")?.content?.url ?? "") ||
          editor.template.image,
      });
      toast.success("Alterações salvas.");
      setEditor({ mode: "closed" });
    }
  };

  const handleDuplicateOfficial = (source: OfficialTemplate) => {
    const now = new Date().toISOString();
    addTemplate({
      id: createTemplateId("copy"),
      name: `${source.name} (cópia)`,
      category: source.category,
      image: source.image,
      html: blocksToEmailHtml(source.blocks, source.name),
      kind: "editor",
      blocks: source.blocks,
      createdAt: now,
      updatedAt: now,
    });
    toast.success("Modelo copiado para “Meus templates”.");
  };

  const openRename = (template: StoredTemplate) => {
    setRenaming(template);
    setRenameValue(template.name);
    setRenameCategory(template.category);
  };

  const confirmRename = () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name) {
      toast.error("Informe um nome para o template.");
      return;
    }
    updateTemplate(renaming.id, { name, category: renameCategory });
    toast.success("Template atualizado.");
    setRenaming(null);
  };

  // ----- Editor em tela cheia -----
  if (editor.mode !== "closed") {
    const editingName = editor.mode === "new" ? editor.name : editor.template.name;
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setEditor({ mode: "closed" })}
              className="font-bold text-muted-foreground"
            >
              <Layout size={18} className="mr-2" /> Voltar à Biblioteca
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-primary">
                {editor.mode === "new" ? "Criando template" : "Editando template"}
              </h1>
              <p className="text-xs text-muted-foreground">{editingName}</p>
            </div>
          </div>

          {editor.mode === "new" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="tpl-name" className="text-[11px] font-bold">
                  Nome
                </Label>
                <Input
                  id="tpl-name"
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  className="h-9 w-56"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-category" className="text-[11px] font-bold">
                  Categoria
                </Label>
                <select
                  id="tpl-category"
                  value={editor.category}
                  onChange={(e) => setEditor({ ...editor, category: e.target.value })}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <VisualEmailEditor
          initialBlocks={editor.mode === "new" ? editor.blocks : editor.template.blocks}
          onSave={handleSaveFromEditor}
          saveLabel={editor.mode === "new" ? "Salvar novo template" : "Salvar alterações"}
        />
      </div>
    );
  }

  // ----- Biblioteca -----
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite, duplique ou importe modelos prontos do Canva.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CanvaImportDialog
            onImported={(template) => {
              addTemplate(template);
            }}
          />
          <Button
            onClick={() => openNewEditor()}
            className="bg-accent font-bold text-accent-foreground shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Criar template
          </Button>
        </div>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              className="h-10 bg-card pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 shrink-0 px-4 font-bold"
            onClick={() => {
              setActiveCategory("Todos");
              setSearchQuery("");
            }}
          >
            <Filter size={16} className="mr-2" /> Limpar filtros
          </Button>
        </div>

        <ScrollArea className="w-full pb-2">
          <div className="flex items-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Modelos oficiais */}
      {officialFiltered.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="text-accent" size={20} />
            <h2 className="text-lg font-bold text-primary">Modelos da Digitale Têxtil</h2>
            {hidden.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-xs font-bold"
                onClick={() => {
                  restoreAll();
                  toast.success("Modelos oficiais restaurados.");
                }}
              >
                Restaurar modelos removidos ({hidden.length})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {officialFiltered.map((template) => (
              <motion.div
                layout
                key={template.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={template.image}
                    alt={`Pré-visualização do modelo ${template.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-primary/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                    <Button
                      size="sm"
                      onClick={() => openNewEditor(template)}
                      className="w-36 bg-accent font-bold text-accent-foreground"
                    >
                      <Edit3 size={14} className="mr-2" /> Usar e editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-36 font-bold"
                      onClick={() => handleDuplicateOfficial(template)}
                    >
                      <Copy size={14} className="mr-2" /> Duplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-36 font-bold"
                      onClick={() => {
                        hideOfficial(template.id);
                        toast.success(`"${template.name}" removido da biblioteca.`);
                      }}
                    >
                      <Trash2 size={14} className="mr-2" /> Excluir
                    </Button>
                  </div>
                  <div className="absolute left-3 top-3 z-10">
                    <Badge className="flex items-center gap-1 border-none bg-accent text-[9px] font-bold uppercase tracking-wider text-accent-foreground shadow-sm">
                      <Sparkles size={10} /> Oficial
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-sm font-bold text-primary">{template.name}</h3>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{template.category}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Meus templates */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-primary">Meus templates</h2>
          <Badge variant="secondary" className="text-[10px] font-bold">
            {myFiltered.length}
          </Badge>
        </div>

        {myFiltered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {myFiltered.map((template) => (
              <motion.div
                layout
                key={template.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {template.image ? (
                    <img
                      src={template.image}
                      alt={`Pré-visualização do template ${template.name}`}
                      loading="lazy"
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
                      className="w-36 bg-accent font-bold text-accent-foreground"
                    >
                      <Play size={14} className="mr-2" /> Pré-visualizar
                    </Button>
                    {template.kind === "editor" && template.blocks ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-36 font-bold"
                        onClick={() => setEditor({ mode: "edit", template })}
                      >
                        <Edit3 size={14} className="mr-2" /> Editar design
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-36 font-bold"
                        onClick={() => openRename(template)}
                      >
                        <Edit3 size={14} className="mr-2" /> Renomear
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-10 p-0"
                        aria-label={`Duplicar ${template.name}`}
                        onClick={() => {
                          duplicateTemplate(template.id);
                          toast.success("Template duplicado.");
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-10 p-0"
                        aria-label={`Excluir ${template.name}`}
                        onClick={() => {
                          removeTemplate(template.id);
                          toast.success("Template removido.");
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="absolute left-3 top-3 z-10">
                    <Badge className="border-none bg-primary text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                      {template.kind === "editor" ? "Editor" : "Canva"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-sm font-bold text-primary">{template.name}</h3>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {template.category} • pronto para disparo
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
            <div className="mb-6 rounded-full bg-muted p-6 text-muted-foreground">
              <Layout size={40} />
            </div>
            <h3 className="text-lg font-bold text-primary">
              {isLoaded ? "Nenhum template seu por aqui" : "Carregando biblioteca..."}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Crie um template no editor visual ou importe um design pronto do Canva.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => openNewEditor()} className="bg-accent font-bold text-accent-foreground">
                <Plus size={16} className="mr-2" /> Criar template
              </Button>
              <CanvaImportDialog onImported={addTemplate} />
            </div>
          </div>
        )}
      </section>

      {/* Pré-visualização */}
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

      {/* Renomear / recategorizar */}
      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Editar template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-name" className="text-xs font-bold">
                Nome
              </Label>
              <Input
                id="rename-name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rename-category" className="text-xs font-bold">
                Categoria
              </Label>
              <select
                id="rename-category"
                value={renameCategory}
                onChange={(e) => setRenameCategory(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)} className="font-bold">
              Cancelar
            </Button>
            <Button onClick={confirmRename} className="bg-accent font-bold text-accent-foreground">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
