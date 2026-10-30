import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { BookOpen, Pencil, Plus, Search, Trash2, Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  listAdminHelpArticles, saveHelpArticleFn, deleteHelpArticleFn,
} from "@/lib/help/articles.functions";
import { HELP_MODULES, type HelpModule } from "@/lib/help/permissions";
import type { HelpArticle, HelpStatus } from "@/lib/help/articles.server";

export const Route = createFileRoute("/_authenticated/settings_/help")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== "Desenvolvedor") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: HelpAdminPage,
  head: () => ({ meta: [{ title: "Gerenciar Tutoriais | Digitale" }] }),
});

type Draft = { id?: string; module: HelpModule; title: string; summary: string; content: string; status: HelpStatus; isFaq: boolean; sortOrder: number };
const EMPTY: Draft = { module: "templates", title: "", summary: "", content: "", status: "draft", isFaq: true, sortOrder: 0 };
const MODULE_LABELS: Record<HelpModule, string> = {
  dashboard: "Dashboard", campaigns: "Campanhas", templates: "Templates",
  "email-templates": "E-mails", automations: "Automações", forms: "Formulários",
  contacts: "Contatos", lists: "Listas", segments: "Segmentos",
  reports: "Relatórios", settings: "Configurações", users: "Usuários",
};

function HelpAdminPage() {
  const { user } = useAuthStore();
  const [articles, setArticles] = React.useState<HelpArticle[]>([]);
  const [draft, setDraft] = React.useState<Draft>({ ...EMPTY });
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const reload = React.useCallback(async () => {
    const result = await listAdminHelpArticles();
    setArticles(result);
  }, []);
  React.useEffect(() => {
    reload().catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar tutoriais"))
      .finally(() => setLoading(false));
  }, [reload]);

  if (user?.role !== "Desenvolvedor") {
    return <p className="p-6 text-sm text-destructive">Acesso restrito ao ADM Master.</p>;
  }

  const selected = draft.id ? articles.find((item) => item.id === draft.id) : undefined;
  const visible = articles.filter((article) => `${article.title} ${article.summary} ${article.module}`.toLowerCase().includes(search.toLowerCase()));
  const startNew = () => setDraft({ ...EMPTY });
  const choose = (article: HelpArticle) => {
    setDraft({ id: article.id, module: article.module, title: article.title, summary: article.summary,
      content: article.content, status: article.status, isFaq: article.isFaq, sortOrder: article.sortOrder });
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveHelpArticleFn({ data: draft });
      await reload();
      setDraft((prev) => ({ ...prev, id: result.id }));
      toast.success("Tutorial salvo com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar tutorial.");
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`Excluir permanentemente o tutorial "${selected.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteHelpArticleFn({ data: { id: selected.id } });
      await reload();
      startNew();
      toast.success("Tutorial excluido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir tutorial.");
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen size={14} /> Configurações / Ajustes / Gerenciar Tutoriais
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Gerenciar Tutoriais</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edite os conteúdos da Central de Ajuda. Somente o ADM Master pode acessar esta tela.</p>
        </div>
        <Button type="button" onClick={startNew}><Plus size={16} className="mr-2" /> Novo tutorial</Button>
      </header>
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-xl border bg-card p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar tutoriais..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-auto">
            {loading ? <p className="text-xs text-muted-foreground">Carregando...</p> : visible.length === 0 ?
              <p className="py-8 text-center text-xs text-muted-foreground">Nenhum tutorial cadastrado.</p> :
              visible.map((article) => (
                <button type="button" key={article.id} onClick={() => choose(article)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition hover:bg-muted/40 ${draft.id === article.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <p className="truncate text-sm font-semibold">{article.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{MODULE_LABELS[article.module]}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{article.status === "published" ? "Publicado" : article.status === "draft" ? "Rascunho" : "Arquivado"}</Badge>
                </button>
              ))}
          </div>
        </aside>
        <form onSubmit={save} className="space-y-5 rounded-xl border bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{selected ? "Editar tutorial" : "Novo tutorial"}</h2>
            {selected && <Button type="button" variant="outline" size="sm" onClick={startNew}><ArrowLeft size={14} className="mr-1" /> Novo</Button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="help-title">Título</Label>
              <Input id="help-title" maxLength={180} required value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ex.: Como criar um template" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-module">Módulo / público autorizado</Label>
              <select id="help-module" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.module}
                onChange={(e) => setDraft((prev) => ({ ...prev, module: e.target.value as HelpModule }))}>
                {HELP_MODULES.map((module) => <option key={module} value={module}>{MODULE_LABELS[module]}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Ex.: artigos de Templates são visíveis para SDK. As permissões reais são validadas pelo servidor.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-status">Situação</Label>
              <select id="help-status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.status}
                onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as HelpStatus }))}>
                <option value="draft">Rascunho (somente ADM)</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado (somente ADM)</option>
              </select>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <label htmlFor="help-faq" className="flex items-center gap-2 text-sm font-medium">
                <input
                  id="help-faq"
                  type="checkbox"
                  checked={draft.isFaq}
                  onChange={(e) => setDraft((p) => ({
                    ...p, isFaq: e.target.checked
                  }))}
                />
                Exibir em Perguntas Frequentes
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="help-order">Ordem de exibicao</Label>
              <Input
                id="help-order"
                type="number"
                min={0}
                max={9999}
                value={draft.sortOrder}
                onChange={(e) => setDraft((p) => ({
                  ...p, sortOrder: Number(e.target.value) || 0
                }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="help-summary">Resumo</Label>
              <Textarea id="help-summary" maxLength={500} rows={2} value={draft.summary}
                onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))} placeholder="Descrição curta do tutorial" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="help-content">Passo a passo / conteúdo</Label>
              <Textarea id="help-content" required rows={16} className="font-mono text-sm leading-relaxed" maxLength={100000}
                value={draft.content} onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="1. Acesse Templates...\n2. Clique em Criar...\n3. Salve o modelo..." />
              <p className="text-xs text-muted-foreground">Nesta etapa, o texto será armazenado com segurança. O editor de imagens e vídeos será implementado em seguida.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            {selected ? <Button type="button" variant="destructive" disabled={deleting || saving} onClick={remove}><Trash2 size={15} className="mr-2" /> Excluir</Button> : <span />}
            <Button type="submit" disabled={saving || deleting || !draft.title.trim() || !draft.content.trim()}>
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />} Salvar tutorial
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
