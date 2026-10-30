import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  Users,
  MousePointerClick,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Automation, AutomationNode } from "@/components/automations/automation-types";
import { listDisparoAutomations, saveDisparoAutomationDraft } from "@/lib/disparo-automations.functions";
import { AutomationPlanner } from "@/components/automations/AutomationPlanner";
import {
  validateAutomationNodes,
  validateRequiredAutomationNodes,
} from "@/lib/disparo-automation-validator.mjs";

const automations: Automation[] = [
  {
    id: "digitale-newsletter",
    name: "Novos inscritos na Newsletter",
    status: "draft",
    trigger: "Nova inscrição na Newsletter",
    activeContacts: 0,
    lastRun: "Nunca executada",
    nodes: [
      {
        id: "newsletter-1",
        type: "trigger",
        label: "Nova inscrição na Newsletter",
        description: "Cadastro realizado no site da Digitale Têxtil",
      },
      {
        id: "newsletter-2",
        type: "condition",
        label: "Verificar autorização de marketing",
        description: "Contato elegível e não descadastrado",
      },
      {
        id: "newsletter-3",
        type: "action",
        label: "Apresentação da Digitale Têxtil",
        description: "Material institucional de boas-vindas",
      },
    ],
  },
  {
    id: "digitale-clientes",
    name: "Base de Clientes",
    status: "draft",
    trigger: "Comunicação programada por categoria",
    activeContacts: 0,
    lastRun: "Nunca executada",
    nodes: [
      {
        id: "clientes-1",
        type: "trigger",
        label: "Selecionar comunicação",
        description: "Radar, Bem-estar ou Novidades e Lançamentos",
      },
      {
        id: "clientes-2",
        type: "condition",
        label: "Verificar base de clientes",
        description: "Contato elegível para receber marketing",
      },
      {
        id: "clientes-3",
        type: "action",
        label: "Radar Digitale",
        description: "Conteúdo Radar Digitale",
      },
      {
        id: "clientes-4",
        type: "action",
        label: "Sexta do Bem-estar",
        description: "Conteúdo de bem-estar",
      },
      {
        id: "clientes-5",
        type: "action",
        label: "Novidades ou Lançamentos",
        description: "Novos tecidos, artigos e lançamentos",
      },
    ],
  },
  {
    id: "digitale-interesse",
    name: "Interesse no Site",
    status: "draft",
    trigger: "Interesse identificado pelo tracking pixel",
    activeContacts: 0,
    lastRun: "Nunca executada",
    nodes: [
      {
        id: "interesse-1",
        type: "trigger",
        label: "Visita a artigo ou tecido",
        description: "Exemplo: visitante visualizou o tecido Milano",
      },
      {
        id: "interesse-2",
        type: "condition",
        label: "Identificar contato",
        description: "Associar evento a e-mail da base com segurança",
      },
      {
        id: "interesse-3",
        type: "condition",
        label: "Verificar autorização e duplicidade",
        description: "Consentimento, descadastro e frequência",
      },
      {
        id: "interesse-4",
        type: "action",
        label: "Selecionar material do artigo",
        description: "Exemplo: conteúdo referente ao tecido Milano",
      },
      {
        id: "interesse-5",
        type: "action",
        label: "Preparar e-mail personalizado",
        description: "Somente rascunho; envio não implementado",
      },
    ],
  },
];

const descriptions: Record<string, string> = {
  "digitale-newsletter":
    "Apresentação da Digitale Têxtil para novos inscritos na Newsletter.",
  "digitale-clientes":
    "Radar Digitale, Sexta do Bem-estar e Novidades ou Lançamentos.",
  "digitale-interesse":
    "Conteúdo relacionado ao interesse identificado no site pelo tracking pixel.",
};

const audiences: Record<string, string> = {
  "digitale-newsletter": "Novos inscritos",
  "digitale-clientes": "Base de clientes",
  "digitale-interesse": "Leads identificados",
};

const icons = [
  Mail,
  Users,
  MousePointerClick,
];

export const Route = createFileRoute("/_authenticated/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Automation | null>(null);
  // DIGITALE_AUTOMATION_GUIDE_V1
  const [guideSelectedId, setGuideSelectedId] = useState("digitale-newsletter");
  const [automationItems, setAutomationItems] =
    useState<Automation[]>(automations);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDrafts = async () => {
      try {
        const records = await listDisparoAutomations();

        if (cancelled) return;

        const expectedIds = new Set(
          automations.map((item) => item.id)
        );

        if (
          records.length !== automations.length ||
          !records.every((item) => expectedIds.has(item.id)) ||
          !automations.every((item) =>
            records.some((record) => record.id === item.id)
          )
        ) {
          throw new Error(
            "Banco de automacoes com registros incompletos."
          );
        }

        const updated = automations.map((automation) => {
          const record = records.find(
            (item) => item.id === automation.id
          );

          if (!record) {
            throw new Error("Rascunho ausente no banco.");
          }

          if (record.configuration === "{}") {
            return automation;
          }

          try {
            const parsed = JSON.parse(record.configuration);

            if (
              !parsed ||
              typeof parsed !== "object" ||
              !Array.isArray(parsed.nodes) ||
              parsed.nodes.length < 1 ||
              parsed.nodes.length > 100
            ) {
              throw new Error(
                "Estrutura de rascunho invalida."
              );
            }

            const ids = new Set<string>();

            const validNodes = parsed.nodes.every(
              (node: unknown) => {
                if (
                  !node ||
                  typeof node !== "object" ||
                  Array.isArray(node)
                ) {
                  return false;
                }

                const item = node as Record<string, unknown>;

                if (
                  typeof item["id"] !== "string" ||
                  !item["id"].trim() ||
                  item["id"].length > 100 ||
                  typeof item["label"] !== "string" ||
                  !item["label"].trim() ||
                  item["label"].length > 191 ||
                  !["trigger", "condition", "action"].includes(
                    String(item["type"])
                  ) ||
                  (
                    item["description"] !== undefined &&
                    (
                      typeof item["description"] !== "string" ||
                      item["description"].length > 2000
                    )
                  )
                ) {
                  return false;
                }

                if (ids.has(item["id"])) {
                  return false;
                }

                ids.add(item["id"]);
                return true;
              }
            );

            if (!validNodes) {
              throw new Error("Etapas salvas invalidas.");
            }

            if (
              parsed.nodes[0]?.type !== "trigger" ||
              parsed.nodes.filter(
                (node: AutomationNode) => node.type === "trigger"
              ).length !== 1
            ) {
              throw new Error("Gatilho inicial invalido.");
            }

            for (const node of parsed.nodes) {
              if (
                node.nextIds !== undefined &&
                (
                  !Array.isArray(node.nextIds) ||
                  node.nextIds.some(
                    (nextId: unknown) =>
                      typeof nextId !== "string" ||
                      !ids.has(nextId) ||
                      nextId === node.id
                  ) ||
                  new Set(node.nextIds).size !== node.nextIds.length
                )
              ) {
                throw new Error("Conexoes salvas invalidas.");
              }
            }

            // DIGITALE_VALIDATE_LOADED_DRAFT_V1
            // Aplicar no carregamento as mesmas regras do backend.
            validateAutomationNodes(parsed.nodes);
            validateRequiredAutomationNodes(
              automation.id,
              parsed.nodes
            );

            const savedName =
              typeof parsed.name === "string" &&
              parsed.name.trim()
                ? parsed.name
                : automation.name;

            const savedTrigger =
              typeof parsed.trigger === "string" &&
              parsed.trigger.trim()
                ? parsed.trigger
                : automation.trigger;

            const restoredNodes = parsed.nodes.map(
              (node: AutomationNode, index: number) => ({
                ...node,
                icon:
                  automation.nodes.find(
                    (original) => original.id === node.id
                  )?.icon ??
                  automation.nodes[index]?.icon ??
                  automation.nodes[0]?.icon,
              })
            );

            return {
              ...automation,
              name: savedName,
              trigger: savedTrigger,
              nodes: restoredNodes,
              status: "draft" as const,
              activeContacts: 0,
              lastRun: "Nunca executada",
            };
          } catch {
            throw new Error(
              "Configuracao armazenada invalida."
            );
          }
        });

        setAutomationItems(updated);
        setLoadError(false);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoadingDrafts(false);
      }
    };

    void loadDrafts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveDraft = async (
    automation: Automation,
    nodes: AutomationNode[]
  ) => {
    if (loadingDrafts || loadError) {
      throw new Error(
        "Salvamento indisponivel enquanto os rascunhos nao estiverem carregados."
      );
    }

    await saveDisparoAutomationDraft({
      data: {
        id: automation.id,
        configuration: {
          name: automation.name,
          trigger: automation.trigger,
          nodes: nodes.map(({ icon, ...node }) => node),
          enabled: false,
          published: false,
          sendingEnabled: false,
        },
      },
    });

    const savedNodes = nodes.map((node) => ({ ...node }));

    setAutomationItems((current) =>
      current.map((item) =>
        item.id === automation.id
          ? {
              ...item,
              nodes: savedNodes,
              status: "draft",
              activeContacts: 0,
              lastRun: "Nunca executada",
            }
          : item
      )
    );

    setSelected((current) =>
      current?.id === automation.id
        ? { ...current, nodes: savedNodes }
        : current
    );
  };

  const visible = automationItems.filter((automation) =>
    `${automation.name} ${automation.trigger} ${descriptions[automation.id]}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR"))
  );

  // O catálogo inicial possui as três jornadas obrigatórias.
  const guideAutomation: Automation =
    automationItems.find((a) => a.id === guideSelectedId) ??
    automations[0]!;

  if (selected) {
    return (
      <AutomationPlanner
        automation={selected as never}
        onClose={() => setSelected(null)}
        onSaveDraft={
          loadingDrafts || loadError ? undefined : handleSaveDraft
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Automações
        </h1>
        <p className="text-muted-foreground">
          Gerencie as três jornadas de comunicação da Digitale Têxtil.
        </p>
        {loadingDrafts && (
          <p className="text-xs text-muted-foreground" role="status">
            Verificando rascunhos salvos...
          </p>
        )}
        {loadError && (
          <p className="text-xs text-amber-600" role="alert">
            Não foi possível recuperar ou validar os rascunhos.
            Exibindo modelos iniciais somente para consulta.
            O salvamento permanece bloqueado.
          </p>
        )}
      </div>

      <Card className="border p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              Configuração em desenvolvimento
            </p>
            <p className="text-xs text-muted-foreground">
              {/* DIGITALE_DRAFT_MESSAGES_V1 */}
              As três automações estão inativas e não publicadas.
              O salvamento de rascunhos está disponível após a
              validação dos dados armazenados. Gatilhos automáticos,
              agendamentos e envios não estão habilitados.
            </p>
          </div>
        </div>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar automações..."
          className="pl-9"
        />
      </div>

      {/* DIGITALE_AUTOMATION_GUIDE_V1 */}
      <section
        aria-labelledby="automation-guide-title"
        className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-xl"
      >
        <div className="border-b border-slate-700 bg-slate-900 p-6">
          <p className="mb-2 text-sm font-semibold text-indigo-300">
            Central explicativa
          </p>
          <h2 id="automation-guide-title" className="text-2xl font-bold text-white">
            Como funciona cada automação
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Explore os gatilhos, as verificações e as ações existentes
            em cada rascunho de comunicação.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {automationItems.map((automation, index) => {
              const Icon = icons[index] ?? Mail;
              const active = guideAutomation.id === automation.id;
              return (
                <button
                  type="button"
                  key={automation.id}
                  aria-pressed={active}
                  onClick={() => setGuideSelectedId(automation.id)}
                  className={
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 " +
                    (active
                      ? "border-indigo-400 bg-indigo-500/20 text-white"
                      : "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500")
                  }
                >
                  <Icon className="h-6 w-6 shrink-0 text-indigo-300" />
                  <span>
                    <span className="block text-sm font-bold">{automation.name}</span>
                    <span className="mt-1 block text-xs text-slate-300">
                      {audiences[automation.id]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white">
              {guideAutomation.name}
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              {descriptions[guideAutomation.id]}
            </p>

            <div className="mt-6">
              {guideAutomation.nodes.map((node, index) => {
                const tone =
                  node.type === "trigger"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : node.type === "condition"
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-indigo-500/50 bg-indigo-500/10";
                const category =
                  node.type === "trigger"
                    ? "GATILHO"
                    : node.type === "condition"
                      ? "VERIFICAÇÃO"
                      : "AÇÃO";

                return (
                  <div key={node.id}>
                    <div className={"rounded-xl border p-4 " + tone}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold tracking-wider text-slate-300">
                            {category}
                          </span>
                          <h4 className="mt-1 break-words font-bold text-white">
                            {node.label}
                          </h4>
                          <p className="mt-2 break-words text-sm leading-relaxed text-slate-200">
                            {node.description || "Sem descrição cadastrada."}
                          </p>
                          {node.nextIds !== undefined && (
                            <p className="mt-2 text-xs text-slate-300">
                              Conexões explícitas:{" "}
                              {node.nextIds.length
                                ? node.nextIds.join(", ")
                                : "nenhuma"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < guideAutomation.nodes.length - 1 && (
                      <div aria-hidden="true" className="mx-auto h-8 w-0.5 bg-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Representação explicativa das etapas. Não executa nem simula
              disparos e não substitui as validações do construtor.
            </p>
          </div>

          <aside className="h-fit rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h4 className="font-bold text-white">Resumo da jornada</h4>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <span className="text-slate-400">Público</span>
                <p className="mt-1 text-white">{audiences[guideAutomation.id]}</p>
              </div>
              <div>
                <span className="text-slate-400">Gatilho</span>
                <p className="mt-1 text-white">{guideAutomation.trigger}</p>
              </div>
              <div>
                <span className="text-slate-400">Etapas</span>
                <p className="mt-1 text-white">{guideAutomation.nodes.length}</p>
              </div>
              <div>
                <span className="text-slate-400">Condições</span>
                <p className="mt-1 text-white">
                  {guideAutomation.nodes.filter((node) => node.type === "condition").length}
                </p>
              </div>
            </div>
            <div className="my-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
              Rascunho desativado. Sem publicação, agendamentos ou envios automáticos.
            </div>
            <Button
              type="button"
              className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-500"
              onClick={() => setSelected(guideAutomation)}
            >
              <Settings2 className="h-4 w-4" />
              Abrir construtor
            </Button>
          </aside>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {visible.map((automation) => {
          const Icon = icons[automations.indexOf(automation)] ?? Mail;

          return (
            <Card
              key={automation.id}
              className="flex flex-col gap-4 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-muted p-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary">Rascunho</Badge>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold">
                  {automation.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {descriptions[automation.id]}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Público: </span>
                  {audiences[automation.id]}
                </p>
                <p>
                  <span className="text-muted-foreground">Gatilho: </span>
                  {automation.trigger}
                </p>
                <p>
                  <span className="text-muted-foreground">Etapas: </span>
                  {automation.nodes.length}
                </p>
                <p>
                  <span className="text-muted-foreground">Execuções: </span>
                  Nenhuma registrada
                </p>
              </div>

              <div className="mt-auto pt-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setSelected(automation)}
                >
                  <Settings2 className="h-4 w-4" />
                  Visualizar fluxo
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma automação encontrada.
        </p>
      )}
    </div>
  );
}
