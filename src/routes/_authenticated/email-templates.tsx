import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2, Mail, Monitor, Pencil, Plus, Smartphone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { renderEmailPreview } from "@/lib/email-preview.functions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useTransactionalTemplates,
  type TransactionalTemplate,
} from "@/hooks/use-transactional-templates";
import {
  TransactionalTemplateDialog,
  type TransactionalTemplateDraft,
} from "@/components/email/TransactionalTemplateDialog";

export const Route = createFileRoute("/_authenticated/email-templates")({
  component: EmailTemplatesPage,
  head: () => ({
    meta: [
      { title: "Templates de E-mail | Digitale Têxtil" },
      {
        name: "description",
        content:
          "Pré-visualize os layouts de e-mail transacional da Digitale Têxtil antes do disparo.",
      },
      { property: "og:title", content: "Templates de E-mail | Digitale Têxtil" },
      {
        property: "og:description",
        content: "Layouts de e-mail com a identidade visual da Digitale Têxtil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/** Catálogo exibido na lateral. Os nomes correspondem às chaves do catálogo de templates. */
const TEMPLATE_LIST = [
  {
    name: "boas-vindas",
    label: "Boas-vindas",
    description: "Enviado quando um contato é cadastrado na base.",
  },
  {
    name: "confirmacao-contato",
    label: "Confirmação de formulário",
    description: "Recibo automático de mensagens recebidas pelo site.",
  },
  {
    name: "novo-contato-interno",
    label: "Alerta interno",
    description: "Avisa a equipe comercial sobre um novo lead.",
  },
  {
    name: "relatorio-campanha",
    label: "Relatório de campanha",
    description: "Resumo enviado ao responsável ao fim do processamento.",
  },
] as const;

type ViewportMode = "desktop" | "mobile";

function EmailTemplatesPage() {
  const [selected, setSelected] = React.useState<string>(TEMPLATE_LIST[0].name);
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop");
  const renderPreview = useServerFn(renderEmailPreview);
  const {
    templates: custom,
    isLoaded,
    createTemplate,
    updateTemplate,
    removeTemplate,
    duplicateTemplate,
  } = useTransactionalTemplates();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TransactionalTemplate | null>(null);
  const [initialDraft, setInitialDraft] =
    React.useState<TransactionalTemplateDraft | null>(null);

  const selectedCustom = custom.find((t) => t.id === selected) ?? null;
  const isOfficial = TEMPLATE_LIST.some((t) => t.name === selected);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["email-preview", selected],
    queryFn: () => renderPreview({ data: { name: selected } }),
    staleTime: 5 * 60 * 1000,
    enabled: isOfficial,
  });

  const previewHtml = selectedCustom ? selectedCustom.html : (data?.html ?? "");
  const previewSubject = selectedCustom ? selectedCustom.subject : (data?.subject ?? "—");

  function openCreate() {
    setEditing(null);
    setInitialDraft(null);
    setDialogOpen(true);
  }

  function openEdit(template: TransactionalTemplate) {
    setEditing(template);
    setInitialDraft(null);
    setDialogOpen(true);
  }

  /** Cria uma cópia editável a partir do layout oficial já renderizado. */
  function duplicateOfficial() {
    const meta = TEMPLATE_LIST.find((t) => t.name === selected);
    if (!meta || !data?.html) {
      toast.error("Aguarde a renderização do layout para duplicá-lo.");
      return;
    }
    const copy = duplicateTemplate({
      label: meta.label,
      description: meta.description,
      subject: data.subject ?? "",
      html: data.html,
    });
    setSelected(copy.id);
    toast.success("Cópia editável criada.");
  }

  function handleSubmit(draft: TransactionalTemplateDraft) {
    if (editing) {
      updateTemplate(editing.id, draft);
      toast.success("Template atualizado.");
      return;
    }
    const created = createTemplate(draft);
    setSelected(created.id);
    toast.success("Template criado.");
  }

  function handleRemove(template: TransactionalTemplate) {
    removeTemplate(template.id);
    if (selected === template.id) setSelected(TEMPLATE_LIST[0].name);
    toast.success("Template excluído.");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Templates de E-mail
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Layouts oficiais com a identidade da Digitale Têxtil, prontos para o
            disparo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="secondary"
            className="w-fit rounded-full border-none bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700"
          >
            Aguardando domínio remetente
          </Badge>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={15} /> Novo template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Lista de templates */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Layouts oficiais
          </p>
          {TEMPLATE_LIST.map((tpl) => {
            const isActive = tpl.name === selected;
            return (
              <button
                key={tpl.name}
                type="button"
                onClick={() => setSelected(tpl.name)}
                className={cn(
                  "w-full rounded-xl border bg-card p-4 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-accent shadow-md ring-1 ring-accent/20"
                    : "hover:border-primary/20 hover:bg-muted/30",
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "bg-secondary text-primary",
                    )}
                  >
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-primary">{tpl.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {tpl.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          <p className="pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Meus templates
          </p>
          {!isLoaded ? null : custom.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
              Nenhum template criado ainda. Use “Novo template” ou duplique um layout
              oficial para editar.
            </p>
          ) : (
            custom.map((tpl) => {
              const isActive = tpl.id === selected;
              return (
                <div
                  key={tpl.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 transition-all",
                    isActive
                      ? "border-accent shadow-md ring-1 ring-accent/20"
                      : "hover:border-primary/20 hover:bg-muted/30",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(tpl.id)}
                    aria-pressed={isActive}
                    className="flex w-full items-start gap-3 text-left focus-visible:outline-none"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        isActive ? "bg-accent/10 text-accent" : "bg-secondary text-primary",
                      )}
                    >
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-primary">{tpl.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {tpl.description || tpl.subject || "Sem descrição"}
                      </p>
                    </div>
                  </button>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 flex-1 gap-1 text-xs"
                      onClick={() => openEdit(tpl)}
                    >
                      <Pencil size={13} /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRemove(tpl)}
                      aria-label={`Excluir ${tpl.label}`}
                    >
                      <Trash2 size={13} /> Excluir
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pré-visualização */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b bg-muted/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Assunto
              </p>
              <p className="truncate text-sm font-semibold text-primary">
                {previewSubject || "—"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {isOfficial ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={duplicateOfficial}
                >
                  <Copy size={13} /> Duplicar para editar
                </Button>
              ) : selectedCustom ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => openEdit(selectedCustom)}
                >
                  <Pencil size={13} /> Editar
                </Button>
              ) : null}
              <Button
                variant={viewport === "desktop" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewport("desktop")}
                aria-label="Visualizar em desktop"
              >
                <Monitor size={15} />
              </Button>
              <Button
                variant={viewport === "mobile" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewport("mobile")}
                aria-label="Visualizar em mobile"
              >
                <Smartphone size={15} />
              </Button>
            </div>
          </div>

          <div className="flex justify-center bg-muted/20 p-4 sm:p-6">
            {isOfficial && isPending ? (
              <div className="flex h-[520px] items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : isOfficial && isError ? (
              <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Não foi possível renderizar o template."}
              </div>
            ) : (
              <iframe
                title={`Pré-visualização do template ${selected}`}
                srcDoc={previewHtml}
                className={cn(
                  "h-[640px] rounded-lg border bg-white transition-all duration-300",
                  viewport === "desktop" ? "w-full max-w-[680px]" : "w-[390px]",
                )}
              />
            )}
          </div>
        </div>
      </div>

      <TransactionalTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
        initialDraft={initialDraft}
        onSubmit={handleSubmit}
      />
    </div>
  );
}