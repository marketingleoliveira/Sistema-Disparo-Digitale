import * as React from "react";
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

export function LiveCampaignPulse({
  campaignId
}: {
  campaignId?: string;
}) {
  const fetchPulse = useServerFn(getLiveCampaignPulse);

  const [current, setCurrent] =
    React.useState<Snapshot | null>(null);

  const [history, setHistory] =
    React.useState<Point[]>([]);

  const [error, setError] = React.useState("");
  const [lastUpdate, setLastUpdate] = React.useState(0);
  const [clock, setClock] = React.useState(Date.now());

  React.useEffect(() => {
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
  }, [campaignId, fetchPulse]);

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


  // DIGITALE_REACT_DEMO_V5
  // Somente uma visualizacao demonstrativa.
  // Nunca altera a resposta da API ou os dados armazenados.
  if (
    campaignId ===
    "cdd61ff9-2273-4b87-9eac-af7d1ce731fc"
  ) {
    const demoMetrics = [
      ["Destinatários previstos", "17.434", "#315e91"],
      ["Tentativas registradas", "17.434", "#315e91"],
      ["Aceitos pela API", "17.251", "#315e91"],
      ["Na fila SMTP", "0", "#64748b"],
      ["Aceitos pelo SMTP", "17.251", "#2563eb"],
      ["Adiados", "0", "#c38a35"],
      ["Devolvidos", "164", "#cc5757"],
      ["Entregues confirmados", "17.251", "#21856b"],
      ["Falhas iniciais", "19", "#cc5757"],
      ["Ritmo do motor SMTP", "0/min", "#21856b"],
      ["Aberturas", "14.652", "#21856b"],
      ["Leituras", "9.456", "#315e91"],
      ["Cliques", "167", "#7c3aed"],
      ["Não lidos", "2.599", "#64748b"]
    ];

    return (
      <div
        data-digitale-react-demo="v5"
        className="space-y-4 rounded-2xl border bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">
              Monitoramento em tempo real
            </h3>
            
          </div>

          <span className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">
            DADOS DEMO
          </span>
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
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">
            Monitoramento em tempo real
          </h3>
          <p className="text-xs text-muted-foreground">
            Dados reais · Atualizacao automatica a cada 2 segundos
          </p>
        </div>

        <span className={
          "rounded-full px-3 py-1 text-xs font-semibold " +
          (stale
            ? "bg-amber-100 text-amber-800"
            : "bg-emerald-100 text-emerald-800")
        }>
          {stale ? "Sem dados recentes" : "● Dados atualizados"}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-amber-700">
          {error}
        </p>
      )}

      {!current ? (
        <p className="text-sm text-muted-foreground">
          Consultando dados do MariaDB...
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
  );
}
