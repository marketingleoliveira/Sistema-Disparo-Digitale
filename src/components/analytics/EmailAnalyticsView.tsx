import { OpenersSummaryLink } from "@/components/analytics/OpenersSummaryLink";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Mail,
  AlertCircle,
  MailOpen
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getEmailAnalytics } from "@/lib/disparo-email-analytics.functions";

type Analytics = Awaited<ReturnType<typeof getEmailAnalytics>>;

type Props = {
  summary?: boolean;
};

const formatNumber = (value: number) =>
  value.toLocaleString("pt-BR");

const percent = (value: number | null) =>
  value === null
    ? "—"
    : `${value.toLocaleString("pt-BR")}%`;

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^\s*[=+\-@]/.test(raw) ? "'" + raw : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function EmailAnalyticsView({
  summary = false
}: Props) {
  const [days, setDays] = React.useState(30);
  const [customMode, setCustomMode] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [appliedRange, setAppliedRange] = React.useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    if (customMode && !appliedRange) {
      setData(null);
      setLoading(false);
      setError("");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError("");

    getEmailAnalytics({
      data: {
        days,
        ...(customMode && appliedRange
          ? appliedRange
          : {})
      }
    })
      .then(result => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) {
          setData(null);
          setError("Não foi possível consultar o histórico de envios.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days, customMode, appliedRange]);

  const exportCsv = () => {
    if (!data || summary || data.campaigns.length === 0) return;

    const rows: Array<Array<string | number>> = [
      [
        "Campanha",
        "Identificador",
        "Tentativas",
        "Aceitos pelo provedor",
        "Falhas",
        "Simulados",
        "Ultima tentativa"
      ],
      ...data.campaigns.map(c => [
        c.name,
        c.id,
        c.attempts,
        c.accepted,
        c.failed,
        c.simulated,
        c.lastAttempt
      ])
    ];

    const csv = "\uFEFF" +
      rows.map(row => row.map(csvCell).join(";")).join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = customMode && appliedRange
      ? `relatorio-disparos-${appliedRange.startDate}-a-${appliedRange.endDate}.csv`
      : `relatorio-disparos-${days}-dias.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const totals = data?.totals;

  const cards = [
    {
      label: "Campanhas registradas",
      value: totals ? formatNumber(totals.campaigns) : "—",
      icon: Mail
    },
    {
      label: "Aceitos pelo provedor",
      value: totals ? formatNumber(totals.accepted) : "—",
      icon: CheckCircle2
    },
    {
      label: "Falhas de envio",
      value: totals ? formatNumber(totals.failed) : "—",
      icon: AlertCircle
    },
    {
      label: "Aberturas únicas",
      value: <OpenersSummaryLink />,
      icon: MailOpen
    },
    {
      label: "Em processamento",
      value: totals ? formatNumber(totals.queued) : "—",
      icon: Clock3
    },
    {
      label: "Taxa de aceitação",
      value: percent(totals?.acceptanceRate ?? null),
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {summary ? "Métricas de Disparos" : "Relatórios de Disparos"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary
              ? "Resumo do desempenho dos e-mails enviados pelo sistema."
              : "Histórico detalhado das tentativas de envio por campanha."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Período"
            value={customMode ? "custom" : String(days)}
            onChange={e => {
              const value = e.target.value;
              setError("");
              setAppliedRange(null);

              if (value === "custom") {
                setCustomMode(true);
              } else {
                setCustomMode(false);
                setDays(Number(value));
              }
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value="custom">Personalizar</option>
          </select>

          {summary ? (
            <Link
              to="/reports"
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              <FileText size={16} />
              Relatório completo
            </Link>
          ) : (
            <button
              type="button"
              onClick={exportCsv}
              disabled={!data?.campaigns.length || loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {customMode && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-primary">
            Personalizar período
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Data inicial
              <input
                type="date"
                aria-label="Data inicial"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Data final
              <input
                type="date"
                aria-label="Data final"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                if (!startDate || !endDate) {
                  setError("Informe as duas datas.");
                  return;
                }

                if (startDate > endDate) {
                  setError(
                    "A data final deve ser igual ou posterior à inicial."
                  );
                  return;
                }

                setError("");
                setAppliedRange({ startDate, endDate });
              }}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Aplicar período
            </button>
          </div>

          {appliedRange ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Período aplicado: {appliedRange.startDate} até{" "}
              {appliedRange.endDate}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Selecione as datas e clique em Aplicar período.
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">
          Carregando histórico de disparos...
        </p>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map(card =>
              card.label === "Aberturas únicas" ? (
                <Link
                  key={card.label}
                  to="/reports/opens"
                  className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Abrir relatório de aberturas"
                >
                  <card.icon size={18} className="mb-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{card.value}</p>
                </Link>
              ) : (
                <div
                  key={card.label}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <card.icon size={18} className="mb-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{card.value}</p>
                </div>
              )
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-1 text-base font-semibold">
              Evolução dos disparos
            </h2>
            <p className="mb-5 text-xs text-muted-foreground">
              Tentativas de campanhas por dia. Simulações não são envios reais.
            </p>

            {data.daily.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-lg bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Nenhum disparo registrado neste período.
                O gráfico será preenchido após os próximos envios.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accepted" name="Aceitos" fill="#1e2d4d" />
                    <Bar dataKey="failed" name="Falhas" fill="#ea580c" />
                    <Bar dataKey="simulated" name="Simulados" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {!summary && (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b p-5">
                <h2 className="text-base font-semibold">
                  Histórico por campanha
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Até 200 campanhas recentes no período selecionado.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="p-4">Campanha</th>
                      <th className="p-4 text-right">Tentativas</th>
                      <th className="p-4 text-right">Aceitos</th>
                      <th className="p-4 text-right">Falhas</th>
                      <th className="p-4 text-right">Simulados</th>
                      <th className="p-4">Último envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map(c => (
                      <tr key={c.id} className="border-t">
                        <td className="p-4 font-medium">{c.name}</td>
                        <td className="p-4 text-right">{formatNumber(c.attempts)}</td>
                        <td className="p-4 text-right">{formatNumber(c.accepted)}</td>
                        <td className="p-4 text-right">{formatNumber(c.failed)}</td>
                        <td className="p-4 text-right">{formatNumber(c.simulated)}</td>
                        <td className="p-4">{c.lastAttempt || "—"}</td>
                      </tr>
                    ))}

                    {data.campaigns.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-muted-foreground">
                          Ainda não há disparos para apresentar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground">
            Os números de aceitação indicam respostas positivas do serviço de envio.
            Entrega na caixa postal, abertura, clique e rejeição dependem
            de eventos de rastreamento confirmados e ainda não estão disponíveis.
          </div>
        </>
      )}
    </div>
  );
}
