import * as React from "react";
import { getCampaignBeta, TREINO_FORCA_DEMO } from "@/lib/disparo-campaign-beta";
import { useServerFn } from "@tanstack/react-start";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  getLiveCampaignPulse
} from "@/lib/disparo-smtp-delivery.functions";

export const LYON_SENDING_MASK_CAMPAIGN_ID = "4d5f1795-6418-4fda-b72e-ead2f743ae67";
export const NEWSLETTER_2311_MASK_CAMPAIGN_ID = "0f1e6d18-98aa-48a9-97ef-5c9b6553088c";
const NEWSLETTER_2311_REFERENCE_TARGET = 18973;

export function hasSendingMask(campaignId?: string) {
  return campaignId === LYON_SENDING_MASK_CAMPAIGN_ID ||
    campaignId === NEWSLETTER_2311_MASK_CAMPAIGN_ID ||
    campaignId === "274613ce-eaa7-4214-8e98-9266dcb664dd";
}

const LYON_DEMO_START = Date.parse("2026-11-18T14:03:25Z");
const DEMO_HOUR_MS = 60 * 60 * 1000;

type Snapshot = {
  target: number;
  attempts: number;
  accepted: number;
  failed: number;
  prepared: number;
  queued: number;
  smtpAccepted: number;
  deferred: number;
  bounced: number;
  delivered: number;
  smtpFailed: number;
  processed: number;
  processing: number;
  sampledAt: number;
};

type Point = Snapshot & {
  time: string;
  rate: number;
};

const number = (n: number) => n.toLocaleString("pt-BR");

type FlipContent = (flip: () => void, turning: boolean) => React.ReactNode;

function CampaignFlipCard({ showReal, onFlip, children }: {
  showReal: boolean;
  onFlip: () => void;
  children: FlipContent;
}) {
  const [turning, setTurning] = React.useState(false);
  const timers = React.useRef<number[]>([]);
  const card = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
  }, []);

  const focusToggle = () => window.requestAnimationFrame(() => {
    card.current?.querySelector<HTMLButtonElement>("[data-flip-trigger]")
      ?.focus({ preventScroll: true });
  });

  const flip = () => {
    if (turning) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onFlip();
      focusToggle();
      return;
    }
    setTurning(true);
    timers.current = [
      window.setTimeout(onFlip, 180),
      window.setTimeout(() => {
        setTurning(false);
        focusToggle();
      }, 360)
    ];
  };

  return (
    <div data-campaign-flip-face={showReal ? "real" : "demo"}
      style={{ perspective: "1400px" }}>
      <style>{`
        @keyframes digitale-campaign-flip {
          0% { transform: rotateY(0); opacity: 1; }
          49% { transform: rotateY(90deg); opacity: 0; }
          50% { transform: rotateY(-90deg); opacity: 0; }
          100% { transform: rotateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .digitale-campaign-turning { animation: none !important; }
        }
      `}</style>
      <div ref={card} aria-busy={turning}
        className={turning ? "digitale-campaign-turning" : undefined}
        style={turning ? { animation: "digitale-campaign-flip 360ms ease-in-out" } : undefined}>
        {children(flip, turning)}
      </div>
    </div>
  );
}

export function LiveCampaignPulse({
  campaignId,
  showReal = false,
  onShowRealChange
}: {
  campaignId?: string;
  showReal?: boolean;
  onShowRealChange?: (showReal: boolean) => void;
}) {
  const fetchPulse = useServerFn(getLiveCampaignPulse);
  const beta = getCampaignBeta(campaignId);
  const lyonSendingDemo = campaignId === LYON_SENDING_MASK_CAMPAIGN_ID;

  const [current, setCurrent] =
    React.useState<Snapshot | null>(null);

  const [history, setHistory] =
    React.useState<Point[]>([]);

  const [error, setError] = React.useState("");
  const [lastUpdate, setLastUpdate] = React.useState(0);
  const [clock, setClock] = React.useState(Date.now());

  React.useEffect(() => {
    if (!lyonSendingDemo || showReal) return;
    let timer: number;
    function refreshDemoProgress() {
      const now = Date.now();
      setClock(now);
      const elapsed = Math.max(0, now - LYON_DEMO_START);
      if (elapsed < 5 * DEMO_HOUR_MS) {
        timer = window.setTimeout(refreshDemoProgress, DEMO_HOUR_MS - elapsed % DEMO_HOUR_MS);
      }
    }
    refreshDemoProgress();
    window.addEventListener("focus", refreshOnFocus);
    function refreshOnFocus() {
      window.clearTimeout(timer);
      refreshDemoProgress();
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [lyonSendingDemo, showReal]);

  React.useEffect(() => {
    if ((beta || lyonSendingDemo) && !showReal) return;
    let active = true;
    let loading = false;
    let previous: Snapshot | null = null;

    setCurrent(null);
    setHistory([]);
    setError("");
    setLastUpdate(0);

    const load = async () => {
      if (loading || !active) return;

      loading = true;

      try {
        const next = await fetchPulse({
          data: { campaignId: campaignId || "" }
        }) as Snapshot;

        if (!active) return;

        const elapsed = previous
          ? (next.sampledAt - previous.sampledAt) / 60000
          : 0;

        const delta = previous
          ? next.processed - previous.processed
          : 0;

        const rate = elapsed > 0 && delta >= 0
          ? Math.round(delta / elapsed)
          : 0;

        const point: Point = {
          ...next,
          time: new Date(next.sampledAt).toLocaleTimeString(
            "pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }
          ),
          rate
        };

        setCurrent(next);
        setLastUpdate(Date.now());
        setHistory(old => [...old, point].slice(-60));
        setError("");
        previous = next;
      } catch {
        if (active) {
          setError("Sem atualizacao: falha na consulta.");
        }
      } finally {
        loading = false;
      }
    };

    void load();

    const poll = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 2000);

    const ticker = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(ticker);
    };
  }, [campaignId, fetchPulse, beta, lyonSendingDemo, showReal]);

  const renderCard = (content: FlipContent) => beta || lyonSendingDemo ? (
    <CampaignFlipCard showReal={showReal}
      onFlip={() => onShowRealChange?.(!showReal)}>
      {content}
    </CampaignFlipCard>
  ) : content(() => {}, false);

  const latest = history[history.length - 1];

  const stale = !lastUpdate ||
    clock - lastUpdate > 10000;

  const rate = latest?.rate || 0;

  const total = current?.target || 0;

  const progress = total > 0 && current
    ? Math.min(100, current.attempts / total * 100)
    : 0;

  const metrics = current ? [
    {
      title: "Destinatarios previstos",
      value: current.target,
      color: "#315e91"
    },
    {
      title: "Tentativas registradas",
      value: current.attempts,
      color: "#315e91"
    },
    {
      title: "Aceitos pela API",
      value: current.accepted,
      color: "#315e91"
    },
    {
      title: "Na fila SMTP",
      value: current.queued,
      color: "#64748b"
    },
    {
      title: "Aceitos pelo SMTP",
      value: current.smtpAccepted,
      color: "#2563eb"
    },
    {
      title: "Adiados",
      value: current.deferred,
      color: "#c38a35"
    },
    {
      title: "Devolvidos",
      value: current.bounced,
      color: "#cc5757"
    },
    {
      title: "Entregues confirmados",
      value: current.delivered,
      color: "#21856b"
    },
    {
      title: "Falhas iniciais",
      value: current.failed,
      color: "#cc5757"
    },
    {
      title: "Ritmo do motor SMTP",
      value: rate,
      color: "#21856b",
      suffix: "/min"
    }
  ] : [];


  const demoProgress = Math.min(100, Math.max(0, Math.floor((clock - LYON_DEMO_START) / DEMO_HOUR_MS) * 20));


  
  // DIGITALE_VENEZA_REFERENCE_14518_V2
  // Estimativas exclusivamente visuais.
  if (
    campaignId === "f95990ff-57be-47f1-b43f-8fe37e8415d7"
    && !showReal
  ) {
    const target = 14518;
    const accepted = 14316;
    const bounced = target - accepted;
    const delivered = accepted - bounced;
    const failed = Math.round(bounced * 0.08);
    const readings = Math.round(delivered * 0.82);
    const clicks = 309;
    const unconfirmed = delivered - readings;

    const fmt = (n: number) =>
      n.toLocaleString("pt-BR");

    const metrics = [
      ["Destinatários previstos", fmt(target), "#315e91"],
      ["Tentativas estimadas", fmt(target), "#315e91"],
      ["Aceites API estimados", fmt(accepted), "#315e91"],
      ["Fila SMTP de referência", fmt(accepted), "#64748b"],
      ["Aceites SMTP estimados", fmt(accepted), "#2563eb"],
      ["Adiados estimados", "0", "#c38a35"],
      ["Devolvidos estimados", fmt(bounced), "#cc5757"],
      ["Entregas estimadas", fmt(delivered), "#21856b"],
      ["Falhas iniciais estimadas", fmt(failed), "#cc5757"],
      ["Ritmo SMTP de referência", "0/min", "#21856b"],
      ["Pronto para Ler (estimado)", fmt(delivered), "#21856b"],
      ["Leituras estimadas", fmt(readings), "#315e91"],
      ["Cliques estimados", fmt(clicks), "#7c3aed"],
      ["Leitura não confirmada (estimada)", fmt(unconfirmed), "#64748b"]
    ];

    return (
      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">
            Veneza 25/11
          </h3>
          <span className="text-xs font-semibold text-muted-foreground">
            Dados de referência — estimativas
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(([title, value, color]) => (
            <div key={title} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">
                {title}
              </p>
              <p
                className="mt-2 text-2xl font-bold tabular-nums"
                style={{ color }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {onShowRealChange && (
          <button
            type="button"
            className="text-sm underline"
            onClick={() => onShowRealChange(true)}
          >
            Ver dados reais da campanha
          </button>
        )}
      </section>
    );
  }

  // NEWSLETTER_2311_LYON_STRUCTURE_V2
  // A estrutura dos cards replica a máscara visual do Lyon. Valores exclusivamente
  // simulados: não alteram contadores, fila ou registros reais.
  if (campaignId === NEWSLETTER_2311_MASK_CAMPAIGN_ID && !showReal) {
    const total = NEWSLETTER_2311_REFERENCE_TARGET; // 18.973 destinatários
    const delivered = 18845;
    const readings = 14476; // leituras demonstrativas solicitadas para Newsletter 23/11
    const clicks = 418;
    const formatNewsletter = (value: number) => number(value);
    const newsletterMetrics: ReadonlyArray<readonly [string, string, string]> = [
      ["Destinatários previstos", formatNewsletter(total), "#315e91"],
      ["Tentativas registradas", formatNewsletter(total), "#315e91"],
      ["Aceitos pela API", "18.946", "#315e91"],
      ["Na fila SMTP", "0", "#64748b"],
      ["Aceitos pelo SMTP", "18.946", "#2563eb"],
      ["Adiados", "0", "#c38a35"],
      ["Devolvidos", "101", "#cc5757"],
      ["Entregues confirmados", formatNewsletter(delivered), "#21856b"],
      ["Falhas iniciais", "27", "#cc5757"],
      ["Ritmo do motor SMTP", "0/min", "#21856b"],
      ["Pronto para Ler", formatNewsletter(delivered), "#21856b"],
      ["Leituras", formatNewsletter(readings), "#315e91"],
      ["Cliques", formatNewsletter(clicks), "#7c3aed"],
      ["Leitura não confirmada", formatNewsletter(delivered - readings), "#64748b"]
    ];
    return renderCard(() => (
      <div data-newsletter-lyon-mask="v2" className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Newsletter 23/11 · relatório final de referência</h3>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">DADOS DE REFERÊNCIA</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {newsletterMetrics.map(([title, value, color]) => (
            <div key={title} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progresso da preparação</span>
            <span className="font-bold tabular-nums">100%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do cenário demonstrativo">
            <div className="h-full w-full rounded-full bg-blue-600" />
          </div>
        </div>
        {onShowRealChange && <button type="button" className="text-sm underline" onClick={() => onShowRealChange(true)}>Ver dados reais da campanha</button>}
      </div>
    ));
  }

  // Cenário fictício, independente do estado operacional.
  // Não altera status, destinatários, fila, APIs ou relatórios reais.
  if (hasSendingMask(campaignId) && !lyonSendingDemo && !showReal && !beta) {
    const newsletter23 = campaignId === NEWSLETTER_2311_MASK_CAMPAIGN_ID;
    return renderCard(() => (
      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{newsletter23 ? "Newsletter 23/11 · acompanhamento de referência" : "Painel de envio (DEMO)"}</h3>
          <span className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">DADOS DEMO</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Status DEMO</p>
            <p className="mt-2 text-2xl font-bold text-blue-600" aria-live="polite">{lyonSendingDemo && demoProgress === 100 ? "Analisando relatório de entrega" : "Enviando"}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">{newsletter23 ? "Meta visual de contatos (referência)" : "Destinatários previstos (DEMO)"}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums" style={{color:"#315e91"}}>{newsletter23 ? number(NEWSLETTER_2311_REFERENCE_TARGET) : lyonSendingDemo ? number(18682) : "18.136"}</p>
          </div>
        </div>
        {newsletter23 && <p className="text-sm font-medium">Enviando para 18.973 contatos <span className="font-normal text-muted-foreground">(meta visual demonstrativa; não corresponde ao total real programado)</span></p>}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm font-medium">
            <span>Progresso (DEMO)</span>
            {lyonSendingDemo && <span>{demoProgress}%{demoProgress === 100 ? " enviado" : ""}</span>}
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progresso DEMO" aria-valuenow={lyonSendingDemo ? demoProgress : undefined}>
            {lyonSendingDemo ? (
              <div className="h-full rounded-full bg-blue-600/70 transition-[width] duration-500" style={{ width: `${demoProgress}%` }} />
            ) : (
              <div className="h-full w-1/3 rounded-full bg-blue-600/70 animate-pulse" />
            )}
          </div>
        </div>
        {!lyonSendingDemo && onShowRealChange && <button type="button" className="text-sm underline" onClick={() => onShowRealChange(true)}>Ver dados reais da campanha</button>}
      </section>
    ));
  }

  // LYON_MILANO_STYLE_18682_V1
  // Visualizacao de demonstracao com estrutura de metricas do Milano.
  // Total de contatos apresentados permanece 18.682; nenhum registro real e alterado.
  if (lyonSendingDemo && !showReal) {
    const total = 18682;
    const formatLyon = (v: number) => number(v);
    const lyonMetrics: ReadonlyArray<readonly [string,string,string]> = [
      ["Destinatários previstos", formatLyon(total), "#315e91"],
      ["Tentativas registradas", formatLyon(total), "#315e91"],
      ["Aceitos pela API", formatLyon(total), "#315e91"],
      ["Na fila SMTP", "0", "#64748b"],
      ["Aceitos pelo SMTP", formatLyon(total), "#2563eb"],
      ["Adiados", "0", "#c38a35"],
      ["Devolvidos", "135", "#cc5757"],
      ["Entregues confirmados", formatLyon(total - 135), "#21856b"],
      ["Falhas iniciais", "0", "#cc5757"],
      ["Ritmo do motor SMTP", "0/min", "#21856b"],
      ["Pronto para Ler", formatLyon(total - 135), "#21856b"],
      ["Leituras", "13.173", "#315e91"],
      ["Cliques", "291", "#7c3aed"],
      ["Leitura não confirmada", "5.083", "#64748b"]
    ];
    return renderCard(() => (
      <div data-digitale-lyon-milano-mask="v1" className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Monitoramento em tempo real</h3>
          <span className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">DADOS DEMO</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {lyonMetrics.map(([title, value, color]) => (
            <div key={title} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progresso da preparação (DEMO)</span>
            <span className="font-bold tabular-nums">100%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-blue-600" />
          </div>
        </div>
      </div>
    ));
  }

  // DIGITALE_REACT_DEMO_V5
  // Somente uma visualizacao demonstrativa.
  // Nunca altera a resposta da API ou os dados armazenados.
  if (
    (beta && !showReal) ||
    campaignId ===
    "cdd61ff9-2273-4b87-9eac-af7d1ce731fc" ||
    campaignId ===
    "77031c19-c393-498e-af23-1610965747d5"
  ) {
    // Cenário fictício de apresentação, sem dados reais ou efeito em relatórios.
    const treinoDemo = campaignId === "77031c19-c393-498e-af23-1610965747d5";
    const treinoMetrics = treinoDemo ? TREINO_FORCA_DEMO.metrics : null;
    const demoMetrics = treinoMetrics ?? beta?.metrics ?? [
      ["Destinatários previstos", "17.434", "#315e91"],
      ["Tentativas registradas", "17.434", "#315e91"],
      ["Aceitos pela API", "17.415", "#315e91"],
      ["Na fila SMTP", "0", "#64748b"],
      ["Aceitos pelo SMTP", "17.415", "#2563eb"],
      ["Adiados", "0", "#c38a35"],
      ["Devolvidos", "164", "#cc5757"],
      ["Entregues confirmados", "17.251", "#21856b"],
      ["Falhas iniciais", "19", "#cc5757"],
      ["Ritmo do motor SMTP", "0/min", "#21856b"],
      ["Pronto para Ler", "14.652", "#21856b"],
      ["Leituras", "9.456", "#315e91"],
      ["Cliques", "167", "#7c3aed"],
      ["Leitura não confirmada", "5.196", "#64748b"]
    ];

    return renderCard((flip, turning) => (
      <div
        data-digitale-react-demo="v5"
        data-digitale-campaign-beta={beta ? campaignId : undefined}
        className="space-y-4 rounded-2xl border bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">
              {treinoDemo ? "Engajamento demonstrativo" : "Monitoramento em tempo real"}
            </h3>
            {treinoDemo && <p className="text-xs text-muted-foreground">Cenário demonstrativo independente; não corresponde aos resultados reais.</p>}
            
          </div>

          {beta ? (
            <button type="button" data-flip-trigger
              onClick={flip} disabled={turning}
              aria-label="Virar card para os dados reais"
              title="Ver dados reais"
              className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800 transition-colors hover:bg-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-wait">
              DADOS
            </button>
          ) : (
            <span className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">
              DADOS DEMO
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {demoMetrics.map(([title, value, color]) => (
            <div
              key={title}
              className="rounded-xl border p-3"
            >
              <p className="text-xs text-muted-foreground">
                {title}
              </p>

              <p
                className="mt-2 text-2xl font-bold tabular-nums"
                style={{ color }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              Progresso da preparação (DEMO)
            </span>
            <span className="font-bold tabular-nums">
              100%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full w-full rounded-full bg-blue-600"
            />
          </div>

          
        </div>
      </div>
    ));
  }

  return renderCard((flip, turning) => (
    <div data-digitale-real-campaign={campaignId}
      className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">
            Monitoramento em tempo real
          </h3>
          <p className="text-xs text-muted-foreground">
            Dados reais · Atualizacao automatica a cada 2 segundos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        {(beta || lyonSendingDemo) && (
          <button type="button" data-flip-trigger
            onClick={flip} disabled={turning}
            aria-label="Voltar aos dados de demonstração"
            title="Voltar à demonstração"
            className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800 transition-colors hover:bg-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-wait">
            VOLTAR
          </button>
        )}
        <span className={
          "rounded-full px-3 py-1 text-xs font-semibold " +
          (stale
            ? "bg-amber-100 text-amber-800"
            : "bg-emerald-100 text-emerald-800")
        }>
          {stale ? "Sem dados recentes" : "● Dados atualizados"}
        </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-amber-700">
          {error}
        </p>
      )}

      {!current ? (
        <p className="text-sm text-muted-foreground">
          {error ? "Não foi possível carregar os indicadores. Aguardando nova tentativa." : "Carregando indicadores reais..."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(item => (
              <div
                key={item.title}
                className="rounded-xl border p-3"
              >
                <p className="text-xs text-muted-foreground">
                  {item.title}
                </p>

                <p
                  className="mt-2 text-2xl font-bold tabular-nums"
                  style={{ color: item.color }}
                >
                  {number(item.value)}
                  {item.suffix || ""}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Progresso da preparacao
              </span>
              <span className="tabular-nums">
                {progress.toFixed(1).replace(".", ",")}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Tentativas registradas em relacao a tentativas
              mais destinatarios preparados.
              Nao representa entregas confirmadas.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-3">
              <h4 className="mb-1 text-sm font-semibold">
                Velocidade de processamento
              </h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Mensagens que sairam da fila por minuto, entre leituras
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      minTickGap={24}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      width={38}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      name="Aceites/min"
                      stroke="#21856b"
                      fill="#21856b"
                      fillOpacity={0.16}
                      strokeWidth={2.5}
                      isAnimationActive
                      animationDuration={450}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <h4 className="mb-1 text-sm font-semibold">
                Evolucao da campanha
              </h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Aceitos e preparados, sem simular valores
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      width={55}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="accepted"
                      name="Aceitos"
                      stroke="#315e91"
                      fill="#315e91"
                      fillOpacity={0.10}
                      strokeWidth={2.5}
                      isAnimationActive
                      animationDuration={450}
                    />
                    <Area
                      type="monotone"
                      dataKey="prepared"
                      name="Preparados"
                      stroke="#c38a35"
                      fill="#c38a35"
                      fillOpacity={0.10}
                      strokeWidth={2}
                      isAnimationActive
                      animationDuration={450}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Ultima leitura: {new Date(current.sampledAt)
              .toLocaleTimeString("pt-BR")}.
            Historico coletado desde a abertura deste painel.
            Entregas SMTP e devolucoes permanecem no
            acompanhamento detalhado abaixo.
          </p>
        </>
      )}
    </div>
  ));
}
