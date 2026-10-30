
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen, ChevronDown, HelpCircle, Loader2, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { listPublishedHelpArticles } from "@/lib/help/articles.functions";
import type { HelpArticle } from "@/lib/help/articles.server";

export const Route = createFileRoute("/_authenticated/ajuda")({
  component: AjudaPage,
  head: () => ({
    meta: [{ title: "Central de Ajuda | Digitale Textil" }]
  }),
});

const MODULES: Record<string, string> = {
  templates: "Templates",
  contacts: "Contatos",
  lists: "Listas",
  campaigns: "Campanhas",
  dashboard: "Dashboard",
  automations: "Automações",
  reports: "Relatórios",
  segments: "Segmentos",
  forms: "Formulários",
  "email-templates": "E-mails",
  settings: "Configurações",
  users: "Usuários",
};

function Answer({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-[13px] leading-6 text-foreground/80">
      {content.split(/\n{2,}/).map((part, i) => (
        <p key={i} className="whitespace-pre-line break-words">
          {part.split(/(\*\*[^*]+\*\*)/g).map((s, j) =>
            s.startsWith("**") && s.endsWith("**") ? (
              <strong key={j}>{s.slice(2, -2)}</strong>
            ) : (
              <React.Fragment key={j}>{s}</React.Fragment>
            )
          )}
        </p>
      ))}
    </div>
  );
}

function Questions({
  articles, opened, toggle
}: {
  articles: HelpArticle[];
  opened: string | null;
  toggle: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {articles.map((article) => {
        const active = opened === article.id;

        return (
          <div key={article.id} className="py-1">
            <button
              type="button"
              aria-expanded={active}
              aria-controls={`answer-${article.id}`}
              onClick={() => toggle(article.id)}
              className="flex min-h-12 w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>{article.title}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${
                  active ? "rotate-180" : ""
                }`}
              />
            </button>

            {active && (
              <div
                id={`answer-${article.id}`}
                className="pb-4 pr-7"
              >
                <Answer content={article.content} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Módulo: {MODULES[article.module] ?? article.module}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AjudaPage() {
  const [articles, setArticles] =
    React.useState<HelpArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [opened, setOpened] =
    React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    listPublishedHelpArticles()
      .then((rows) => {
        if (!cancelled) setArticles(rows);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return articles.filter((article) => {
      if (!term) return true;

      return [
        article.title,
        article.summary,
        article.content,
        MODULES[article.module] ?? article.module
      ].join(" ").toLocaleLowerCase("pt-BR").includes(term);
    });
  }, [articles, search]);

  const faqs = filtered.filter((a) => a.isFaq);
  const guides = filtered.filter((a) => !a.isFaq);

  const toggle = (id: string) => {
    setOpened((current) => current === id ? null : id);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-12">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen size={16} />
          Suporte
        </div>

        <h1 className="text-2xl font-bold text-primary">
          Central de Ajuda
        </h1>

        <p className="text-sm text-muted-foreground">
          Orientações sobre as funções disponíveis para seu perfil.
        </p>
      </header>

      <section className="rounded-xl border bg-card px-5 py-6 shadow-sm sm:px-7">
        <div className="flex items-start gap-3">
          <HelpCircle size={20} className="mt-1 text-primary" />

          <div>
            <h2 className="text-lg font-bold text-primary">
              Perguntas Frequentes
            </h2>

            <p className="text-xs text-muted-foreground">
              Respostas para as dúvidas mais comuns
            </p>
          </div>
        </div>

        <div className="relative my-5">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
          />

          <Input
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpened(null);
            }}
            placeholder="Pesquisar uma pergunta ou assunto..."
          />
        </div>

        {loading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Carregando...
          </p>
        ) : error ? (
          <p role="alert" className="py-6 text-sm text-destructive">
            Não foi possível carregar os tutoriais.
          </p>
        ) : faqs.length ? (
          <Questions
            articles={faqs}
            opened={opened}
            toggle={toggle}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search
              ? "Nenhuma pergunta encontrada."
              : "Nenhuma pergunta publicada para seu perfil."}
          </p>
        )}
      </section>

      {!loading && !error && guides.length > 0 && (
        <section className="rounded-xl border bg-card px-5 py-6 shadow-sm sm:px-7">
          <h2 className="text-lg font-bold text-primary">
            Outros tutoriais
          </h2>

          <Questions
            articles={guides}
            opened={opened}
            toggle={toggle}
          />
        </section>
      )}
    </div>
  );
}
