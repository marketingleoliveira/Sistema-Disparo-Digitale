import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { renderEmailPreview } from "@/lib/email-preview.functions";

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

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["email-preview", selected],
    queryFn: () => renderPreview({ data: { name: selected } }),
    staleTime: 5 * 60 * 1000,
  });

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
        <Badge
          variant="secondary"
          className="w-fit rounded-full border-none bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700"
        >
          Aguardando domínio remetente
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Lista de templates */}
        <div className="space-y-3">
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
        </div>

        {/* Pré-visualização */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b bg-muted/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Assunto
              </p>
              <p className="truncate text-sm font-semibold text-primary">
                {data?.subject ?? "—"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
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
            {isPending ? (
              <div className="flex h-[520px] items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : isError ? (
              <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Não foi possível renderizar o template."}
              </div>
            ) : (
              <iframe
                title={`Pré-visualização do template ${selected}`}
                srcDoc={data?.html ?? ""}
                className={cn(
                  "h-[640px] rounded-lg border bg-white transition-all duration-300",
                  viewport === "desktop" ? "w-full max-w-[680px]" : "w-[390px]",
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}