import { exportEngagementPdf } from "@/lib/disparo-engagement-pdf.functions";

// DIGITALE_ENGAGEMENT_PDF_V1
async function downloadDigitaleEngagementPdf() {
  try {
    const result = await exportEngagementPdf();
    const raw = atob(result.content);
    const bytes = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }

    const url = URL.createObjectURL(
      new Blob([bytes], { type: "application/pdf" })
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      60000
    );
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Nao foi possivel gerar o PDF."
    );
  }
}

import { CampaignClicksRanking } from "@/components/analytics/CampaignClicksRanking";
// DIGITALE_CAMPAIGN_NOTIFICATIONS_V1
import { CampaignNotificationsFeed } from "@/components/notifications/CampaignNotifications";
import { useEffect as useGreetingEffect, useState as useGreetingState } from "react";

// DIGITALE_GREETING_BRASILIA_V1
function getBrasiliaGreeting(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date());

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? 0
  );

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function BrasiliaGreeting() {
  const [greeting, setGreeting] = useGreetingState("Olá");

  useGreetingEffect(() => {
    const update = () => setGreeting(getBrasiliaGreeting());

    update();

    const interval = setInterval(update, 30000);

    return () => clearInterval(interval);
  }, []);

  return <>{greeting}</>;
}

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { getClickEngagementRanking } from "@/lib/disparo-click-ranking.functions";
import { getClickContactDetails } from "@/lib/disparo-click-details.functions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Users, 
  Mail, 
  MousePointer2, 
  UserMinus, 
  AlertOctagon,
  TrendingUp, 
  TrendingDown,
  Calendar,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  Filter,
  ChevronRight,
  Send,
  UserPlus,
  CheckCircle2,
  Clock,
  Bell,
  Loader2,
  ShieldCheck
} from "lucide-react";

import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/hooks/use-auth";
import { useDataStore } from "@/hooks/use-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// --- Mock Data ---

const kpiStats = [
  { label: "Contatos", value: "0", trend: "0%", trendType: "up", icon: Users },
  { label: "E-mails enviados", value: "0", trend: "0%", trendType: "up", icon: Mail },
  { label: "Taxa de abertura", value: "0%", trend: "0%", trendType: "up", icon: ArrowUpRight },
  { label: "Taxa de cliques", value: "0%", trend: "0%", trendType: "up", icon: MousePointer2 },
  { label: "Descadastros", value: "0", trend: "0%", trendType: "down", icon: UserMinus },
  { label: "Bounce", value: "0%", trend: "0%", trendType: "down", icon: AlertOctagon },
];

const performanceData: any[] = [];

const engagementLevels = [
  { name: "Muito engajados", value: 0, color: "oklch(0.20 0.05 260)" },
  { name: "Engajados", value: 0, color: "oklch(0.65 0.20 45)" },
  { name: "Pouco engajados", value: 0, color: "oklch(0.97 0.01 260)" },
  { name: "Inativos", value: 0, color: "oklch(0.85 0.02 260)" },
];

const recentCampaigns: any[] = [];

const activities: any[] = [];

// --- Components ---

function KpiCard({ stat }: { stat: typeof kpiStats[0] }) {
  const isUp = stat.trendType === "up";
  const isNeutral = stat.label === "Descadastros" || stat.label === "Bounce";
  
  const trendColor = isNeutral 
    ? (isUp ? "text-destructive bg-destructive/10" : "text-emerald-600 bg-emerald-50")
    : (isUp ? "text-emerald-600 bg-emerald-50" : "text-destructive bg-destructive/10");

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/5 p-2 text-primary shadow-inner">
          <stat.icon size={16} />
        </div>
        <div className={cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm", trendColor)}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {stat.trend}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
        <p className="text-2xl font-bold text-primary tracking-tight mt-0.5">{stat.value}</p>
      </div>
    </div>
  );
}


function EmptyState({ title, description, actionLabel }: { title: string, description: string, actionLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-4 rounded-full bg-secondary p-4 text-primary">
        <Mail size={32} />
      </div>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      <Button className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
        <Plus size={16} className="mr-2" />
        {actionLabel}
      </Button>
    </div>
  );
}

type ClickDetailEvent = {
  id: string;
  campaign: string;
  url: string;
  occurredAtUtc: string;
};

function formatClickDate(utc: string): string {
  if (!utc) return "Nao informado";
  const date = new Date(utc + "Z");

  if (Number.isNaN(date.getTime())) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function ClickDetailsModal({
  name,
  email,
  onClose
}: {
  name: string;
  email: string;
  onClose: () => void;
}) {
  const fetchDetails = useServerFn(getClickContactDetails);

  const [events, setEvents] = React.useState<
    ClickDetailEvent[]
  >([]);

  const [summary, setSummary] = React.useState({
    clicks: 0,
    campaigns: 0,
    links: 0,
    lastClickUtc: ""
  });

  const [nextOffset, setNextOffset] =
    React.useState<number | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);
    setEvents([]);
    setNextOffset(null);

    fetchDetails({data: {email, offset: 0}})
      .then(result => {
        if (!active) return;

        setSummary(result.summary);
        setEvents(result.events);
        setNextOffset(result.nextOffset);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [email, fetchDetails]);

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const more = async () => {
    if (nextOffset === null || loadingMore) return;

    setLoadingMore(true);
    setError(false);

    try {
      const result = await fetchDetails({
        data: {email, offset: nextOffset}
      });

      setSummary(result.summary);
      setEvents(previous => [...previous, ...result.events]);
      setNextOffset(result.nextOffset);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes de engajamento"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-primary">
              Detalhes de engajamento
            </h2>
            <p className="mt-1 font-medium text-sm">
              {name || email}
            </p>
            <p className="break-all text-xs text-muted-foreground">
              {email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Fechar
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Carregando histórico...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Cliques", summary.clicks.toLocaleString("pt-BR")],
                  ["Campanhas", summary.campaigns.toLocaleString("pt-BR")],
                  ["Links diferentes", summary.links.toLocaleString("pt-BR")],
                  ["Ultimo clique", formatClickDate(summary.lastClickUtc)]
                ].map(([title, value]) => (
                  <div
                    key={title}
                    className="rounded-xl border bg-muted/10 p-3"
                  >
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="mb-3 mt-6 text-sm font-bold text-primary">
                Histórico de links acessados
              </h3>

              {events.length === 0 && !error ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum clique encontrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="rounded-xl border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-primary">
                          {event.campaign}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatClickDate(event.occurredAtUtc)}
                        </span>
                      </div>
                      {/^https?:\/\//i.test(event.url) && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="mt-2 inline-block max-w-full break-all rounded-lg border border-accent/30 px-3 py-2 text-xs text-accent transition-colors hover:bg-accent/10"
                        >
                          {event.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-destructive">
                  Não foi possível carregar os detalhes.
                  Tente novamente.
                </p>
              )}

              {nextOffset !== null && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void more()}
                  className="mt-4 w-full rounded-lg border px-4 py-2 text-sm font-semibold text-primary hover:bg-muted disabled:opacity-50"
                >
                  {loadingMore ? "Carregando..." : "Carregar mais registros"}
                </button>
              )}

              <p className="mt-4 text-[11px] text-muted-foreground">
                Os horários são exibidos no fuso de Brasília.
                Os registros podem incluir acessos automáticos de sistemas
                de segurança dos provedores de e-mail.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [selectedClickContact, setSelectedClickContact] =
    React.useState<{name: string; email: string} | null>(null);

  const rankingFn = useServerFn(getClickEngagementRanking);

  const [engagementRanking, setEngagementRanking] =
    React.useState<Array<{
      name: string;
      email: string;
      clicks: number;
      campaigns: number;
    }>>([]);

  const [engagementLoading, setEngagementLoading] =
    React.useState(true);

  const [engagementError, setEngagementError] =
    React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    setEngagementLoading(true);
    setEngagementError(false);

    rankingFn()
      .then((data) => {
        if (mounted) setEngagementRanking(data);
      })
      .catch(() => {
        if (mounted) setEngagementError(true);
      })
      .finally(() => {
        if (mounted) setEngagementLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [rankingFn]);

  const { user } = useAuthStore();
  const { contacts, campaigns, fetchContacts, fetchCampaigns, isLoading } = useDataStore();
  
  React.useEffect(() => {
    fetchContacts();
    fetchCampaigns();
  }, [fetchContacts, fetchCampaigns]);

  const hasData = campaigns.length > 0 || contacts.length > 0;

  const dynamicKpiStats = [
    { label: "Contatos", value: contacts.length.toLocaleString(), trend: "0%", trendType: "up" as const, icon: Users },
    { label: "E-mails enviados", value: campaigns.filter(c => c.status === 'Enviada').length.toLocaleString(), trend: "0%", trendType: "up" as const, icon: Mail },
    { label: "Taxa de abertura", value: "0%", trend: "0%", trendType: "up" as const, icon: ArrowUpRight },
    { label: "Taxa de cliques", value: "0%", trend: "0%", trendType: "up" as const, icon: MousePointer2 },
    { label: "Descadastros", value: contacts.filter(c => c.status === 'Descadastrado').length.toLocaleString(), trend: "0%", trendType: "down" as const, icon: UserMinus },
    { label: "Bounce", value: "0%", trend: "0%", trendType: "down" as const, icon: AlertOctagon },
  ];

  if (isLoading && !hasData) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Visão geral</h1>
          <Link to="/campaigns">
            <Button className="bg-accent text-accent-foreground"><Plus size={16} className="mr-2" /> Criar campanha</Button>
          </Link>
        </div>
        <EmptyState 
          title="Você ainda não possui dados" 
          description="Comece adicionando contatos ou criando sua primeira campanha para ver os resultados aqui."
          actionLabel="Adicionar primeiro contato"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary"><BrasiliaGreeting />, {user?.name.split(' ')[0]}!</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Confira as informações do seu painel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex border-border/60 hover:bg-secondary">
             Exportar Dados
          </Button>
          <Link to="/campaigns">
            <Button className="w-full sm:w-auto bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all rounded-lg px-6">
              <Plus size={18} className="mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>


      {/* Notifications Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold text-primary">Notificações Recentes</h3>
        </div>
        <CampaignNotificationsFeed />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Usuários Online</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-primary">0</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Em tempo real</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <UserPlus size={24} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Usuários</p>
            <span className="text-3xl font-black text-primary">1</span>
            <p className="text-[10px] text-muted-foreground font-medium">Ativos no sistema</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Users size={24} />
          </div>
        </div>
      </div>


      {/* Main Charts & Side Info Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* DIGITALE_CAMPAIGN_RANKING_V3 */}
        <CampaignClicksRanking />

        {/* Ranking real de cliques externos - MariaDB */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-primary">
                Engajamento da base
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Destinatarios com mais cliques em links externos
              </p>
            </div>
            
            {/* DIGITALE_ENGAGEMENT_EXPORT_UI_V1 */}
            <div className="flex shrink-0 items-center gap-3">
              <details className="relative group">
                <summary
                  aria-label="Escolher formato de exportação"
                  className="flex cursor-pointer list-none items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden"
                >
                  <span aria-hidden="true">↓</span>
                  Exportar
                  <span aria-hidden="true">⌄</span>
                </summary>

                <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border bg-card p-1.5 shadow-xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-card-foreground hover:bg-muted"
                    onClick={event => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      void downloadDigitaleEngagementPdf();
                    }}
                  >
                    <span aria-hidden="true">▤</span>
                    PDF
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-card-foreground hover:bg-muted"
                    onClick={event => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      window.alert(
                        "Exportação em Excel: interface pronta. A geração do relatório será implementada na próxima etapa."
                      );
                    }}
                  >
                    <span aria-hidden="true">▦</span>
                    Excel (.xlsx)
                  </button>
                </div>
              </details>

              <MousePointer2 size={20} className="text-accent" />
            </div>
          </div>

          {engagementLoading ? (
            <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              Carregando engajamento...
            </div>
          ) : engagementError ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm font-semibold text-primary">
                Nao foi possivel carregar os cliques.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Verifique a consulta do MariaDB.
              </p>
            </div>
          ) : engagementRanking.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/10 p-7 text-center">
              <MousePointer2
                size={28}
                className="mx-auto mb-3 text-muted-foreground"
              />
              <p className="font-semibold text-primary">
                Nenhum clique registrado
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                O ranking sera preenchido quando houver acessos
                aos links rastreados das campanhas.
              </p>
            </div>
          ) : (
            <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
              {engagementRanking.map((contact, index) => {
                const maximum = engagementRanking[0]?.clicks || 1;
                const percentage =
                  Math.max(3, (contact.clicks / maximum) * 100);

                return (
                  <div key={contact.email} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-primary">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-primary">
                            {contact.name || contact.email}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {contact.email}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-primary">
                            {contact.clicks.toLocaleString("pt-BR")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            cliques
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedClickContact({
                              name: contact.name,
                              email: contact.email
                            })}
                            className="mt-1 text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
                          >
                            Detalhes
                          </button>
                        </div>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 border-t pt-3 text-[11px] text-muted-foreground">
            Ranking por cliques registrados.
            Exibindo ate 30 destinatarios.
          </div>
          {selectedClickContact && (
            <ClickDetailsModal
              name={selectedClickContact.name}
              email={selectedClickContact.email}
              onClose={() => setSelectedClickContact(null)}
            />
          )}
        </div>
      </div>

      {/* Campaigns Table & Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaigns Table */}
        <div className="lg:col-span-2 min-w-0 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-base font-bold text-primary">Campanhas recentes</h3>
            <Link to="/campaigns" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Campanha</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Destinatários</th>
                  <th className="px-6 py-3">Abertura</th>
                  <th className="px-6 py-3">Cliques</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.slice(0, 5).map((camp) => (
                  <tr key={camp.id} className="group hover:bg-secondary/40 transition-all cursor-pointer">
                    <td className="px-6 py-5 font-bold text-primary text-sm">{camp.name}</td>
                    <td className="px-6 py-5 text-xs font-medium text-muted-foreground">{camp.date}</td>
                    <td className="px-6 py-5 text-xs font-mono">{camp.recipients.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-5 text-xs">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-8 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: camp.open.replace('%', '').replace(',', '.') + '%' }} />
                         </div>
                         <span className="font-bold">{camp.open}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-primary">{camp.clicks}</td>
                    <td className="px-6 py-5">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-sm",
                          camp.status === 'Enviada' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                          camp.status === 'Agendada' && "bg-blue-50 text-blue-700 border-blue-100",
                          camp.status === 'Rascunho' && "bg-zinc-50 text-zinc-600 border-zinc-200",
                          camp.status === 'Em andamento' && "bg-orange-50 text-orange-700 border-orange-100"
                        )}
                      >
                        {camp.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        {/* Recent Activity Timeline */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-base font-bold text-primary">Atividade recente</h3>
          <div className="space-y-6">
            {activities.map((act, i) => (
              <div key={act.id} className="relative flex gap-4">
                {i !== activities.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-full w-[2px] bg-muted/50" />
                )}
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <act.icon size={14} />
                </div>
                <div className="flex flex-col gap-1 pb-2">
                  <p className="text-xs font-bold text-primary">{act.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{act.desc}</p>
                  <span className="text-[10px] text-muted-foreground/60">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="mt-4 w-full text-xs font-bold text-muted-foreground hover:text-primary">
            Ver log completo
          </Button>
        </div>
      </div>
    </div>
  );
}
