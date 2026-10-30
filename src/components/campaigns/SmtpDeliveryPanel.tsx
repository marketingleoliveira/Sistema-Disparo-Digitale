import { LiveCampaignPulse } from "./LiveCampaignPulse";

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSmtpDeliverySummary } from
  "@/lib/disparo-smtp-delivery.functions";

type Recipient = {
  email: string;
  sendStatus: string;
  deliveryStatus: string;
  openCount: number;
  firstOpen: string;
  dsn: string;
  detail: string;
  campaign: string;
};


// DIGITALE_BRASILIA_TIME_V1
// O MariaDB armazena este horario em UTC.
// Converte apenas a exibicao, preservando o registro original.
function formatBrasilia(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);

  if (!match) return value;

  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).format(date);
}

function reason(item: Recipient): string {
  const text = (item.dsn + " " + item.detail).toLowerCase();

  if (/5\.1\.1|no.?such.?user|does not exist|user unknown|unknown recipient/i.test(text)) {
    return "Endereço de e-mail não encontrado.";
  }

  if (/mailbox full|quota exceeded|5\.2\.2/i.test(text)) {
    return "A caixa de e-mail está cheia.";
  }

  if (/blocked|spam|policy/i.test(text)) {
    return "O servidor recusou a mensagem.";
  }

  if (/mailbox unavailable/i.test(text)) {
    return "A caixa de e-mail está indisponível.";
  }

  return "A mensagem foi devolvida pelo servidor de destino.";
}

function delivery(item: Recipient): string {
  if (item.deliveryStatus === "sent") return "Entregue";
  if (item.deliveryStatus === "bounced") return "Devolvido";
  if (item.deliveryStatus === "deferred") return "Nova tentativa";
  if (item.sendStatus === "accepted") return "Aguardando confirmação";
  return "Não confirmado";
}

function sent(item: Recipient): string {
  if (item.sendStatus === "accepted") return "Enviado";
  if (item.sendStatus === "failed") return "Falha no envio";
  if (item.sendStatus === "simulated") return "Não enviado";
  return "Aguardando envio";
}

export function SmtpDeliveryPanel({
  campaignId
}: { campaignId?: string }) {
  const getData = useServerFn(getSmtpDeliverySummary);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  // DIGITALE_CAMPAIGN_MODAL_DASHBOARD_V1

React.useEffect(() => {
    let active = true;
    let loading = false;
    setData(null);
    setSearch("");
    setFilter("all");


    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const result = await getData({
          data: { campaignId: campaignId || "" }
        });
        if (active) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Falha na consulta."
          );
        }
      } finally {
        loading = false;
      }
    };

    void load();
    const timer = window.setInterval(
      () => void load(), 120000
    );
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [campaignId, getData]);

  const totals = data?.totals;

  // Indicadores calculados apenas com dados existentes.
  const sentTotal = Math.max(0, Number(totals?.sent) || 0);
  const deliveredTotal = Math.max(
    0, Number(totals?.delivered) || 0
  );
  const bouncedTotal = Math.max(
    0, Number(totals?.bounced) || 0
  );
  const openedTotal = Math.max(
    0, Number(totals?.opened) || 0
  );

  const percentage = (value: number, base: number) =>
    base > 0
      ? ((value / base) * 100).toFixed(1).replace(".", ",")
      : "0,0";

  const chartValues = [
    { label: "Enviados", value: sentTotal, color: "#294766" },
    { label: "Entregues", value: deliveredTotal, color: "#26866a" },
    { label: "Devolvidos", value: bouncedTotal, color: "#dc6464" },
    { label: "Aberturas", value: openedTotal, color: "#ed873f" }
  ];

  const chartMaximum = Math.max(
    1, ...chartValues.map(item => item.value)
  );


  const visible: Recipient[] = (data?.records || [])
    .filter((r: Recipient) => {
      const term = search.toLowerCase().trim();
      if (term && !r.email.toLowerCase().includes(term) &&
          !r.campaign.toLowerCase().includes(term)) return false;
      if (filter === "sent") return r.sendStatus === "accepted";
      if (filter === "delivered") return r.deliveryStatus === "sent";
      if (filter === "bounced") return r.deliveryStatus === "bounced";
      if (filter === "opened") return r.openCount > 0;
      if (filter === "waiting") {
        return r.sendStatus === "accepted" &&
          (!r.deliveryStatus || r.deliveryStatus === "deferred");
      }
      return true;
    });

  return (
    <section className="space-y-4">
      <LiveCampaignPulse campaignId={campaignId} />
      <div>
        <h3 className="font-semibold">Acompanhamento dos envios</h3>
        <p className="text-xs text-muted-foreground">
          Consulte os envios, as entregas e as aberturas.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      )}
      {!data && !error && (
        <p className="text-sm">Carregando informações...</p>
      )}

      {totals && (
        <>
          {/* DIGITALE_RECIPIENTS_UNIFIED_V1 */}

          {true && (
            <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Enviados", totals.sent],
              ["Entregues", totals.delivered],
              ["Devolvidos", totals.bounced],
              ["Aberturas", totals.opened]
            ].map(([label, value]) => (
              <div key={String(label)}
                className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  {label}
                </p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>


          
          
          {/* DIGITALE_CAMPAIGN_PREMIUM_CHARTS_V1 */}
          <style>{`
            @keyframes digitale-premium-reveal {
              from { opacity: 0; transform: translateY(14px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes digitale-premium-line {
              from { stroke-dashoffset: 1; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes digitale-premium-ring {
              from { stroke-dashoffset: 100; }
              to { stroke-dashoffset: var(--ring-end); }
            }
            @keyframes digitale-premium-risk {
              from { width: 0%; }
              to { width: var(--risk-width); }
            }
            .digitale-premium-card {
              animation: digitale-premium-reveal .65s ease-out both;
            }
            .digitale-premium-line {
              stroke-dasharray: 1;
              animation: digitale-premium-line 1.5s ease-out both;
            }
            .digitale-premium-ring {
              stroke-dasharray: 100;
              animation: digitale-premium-ring 1.35s
                cubic-bezier(.2,.75,.2,1) both;
            }
            .digitale-premium-risk {
              animation: digitale-premium-risk 1s ease-out both;
            }
            @media (prefers-reduced-motion: reduce) {
              .digitale-premium-card,
              .digitale-premium-line,
              .digitale-premium-ring,
              .digitale-premium-risk {
                animation: none !important;
              }
            }
          `}</style>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">
              Desempenho da campanha
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* ENVIADOS - CURVA ANIMADA */}
              <div
                className="digitale-premium-card flex min-h-[215px] flex-col rounded-2xl border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Enviados
                  </span>
                  <svg viewBox="0 0 24 24"
                    width="18" height="18"
                    fill="none" stroke="#315e91"
                    strokeWidth="1.7"
                    aria-hidden="true">
                    <path strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m22 2-7 20-4-9-9-4Z M22 2 11 13"/>
                  </svg>
                </div>

                <p className="mt-4 text-3xl font-bold tabular-nums">
                  {sentTotal.toLocaleString("pt-BR")}
                </p>

                <div className="mt-auto pt-3">
                  <svg
                    viewBox="0 0 320 96"
                    className="h-24 w-full"
                    role="img"
                    aria-label={`Volume total de ${sentTotal} envios`}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="digitale-sent-gradient"
                        x1="0" y1="0" x2="0" y2="1"
                      >
                        <stop offset="0%"
                          stopColor="#315e91"
                          stopOpacity=".25"/>
                        <stop offset="100%"
                          stopColor="#315e91"
                          stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    <path
                      d="M 4 76 C 52 75, 60 48, 100 56 S 150 74, 195 28 S 258 50, 316 10 L 316 96 L 4 96 Z"
                      fill="url(#digitale-sent-gradient)"
                    />

                    <path
                      d="M 4 76 C 52 75, 60 48, 100 56 S 150 74, 195 28 S 258 50, 316 10"
                      fill="none"
                      stroke="#315e91"
                      strokeWidth="4"
                      strokeLinecap="round"
                      pathLength={1}
                      className="digitale-premium-line"
                    />

                    <circle
                      cx="316" cy="10" r="5"
                      fill="#315e91"
                    />
                  </svg>
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  Representação visual do volume enviado
                </p>
              </div>

              {/* DEVOLVIDOS - INDICADOR DE RISCO */}
              <div
                className="digitale-premium-card flex min-h-[215px] flex-col rounded-2xl border bg-card p-4"
                style={{animationDelay:"100ms"}}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Devolvidos
                  </span>
                  <svg viewBox="0 0 24 24"
                    width="18" height="18"
                    fill="none" stroke="#dc5858"
                    strokeWidth="1.7"
                    aria-hidden="true">
                    <path
                      d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z"
                      strokeLinejoin="round"/>
                    <path d="M12 7v6 M12 17h.01"
                      strokeLinecap="round"/>
                  </svg>
                </div>

                <p className="mt-4 text-3xl font-bold tabular-nums">
                  {bouncedTotal.toLocaleString("pt-BR")}
                </p>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    {bouncedTotal === 0 ? (
                      <>
                        <span className="text-emerald-500">
                          ✓
                        </span>
                        <span className="text-muted-foreground">
                          Nenhuma devolução
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-500">
                          !
                        </span>
                        <span className="text-muted-foreground">
                          Devoluções registradas
                        </span>
                      </>
                    )}
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="digitale-premium-risk h-full rounded-full bg-red-500"
                      style={{
                        width: `${Math.min(100,
                          sentTotal > 0
                            ? bouncedTotal / sentTotal * 100
                            : 0
                        )}%`,
                        ["--risk-width" as string]:
                          `${Math.min(100,
                            sentTotal > 0
                              ? bouncedTotal / sentTotal * 100
                              : 0
                          )}%`
                      } as React.CSSProperties}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {percentage(bouncedTotal, sentTotal)}%
                    {" dos envios"}
                  </p>
                </div>
              </div>

              {/* ENTREGUES - ANEL VERDE */}
              <div
                className="digitale-premium-card rounded-2xl border bg-card p-4"
                style={{animationDelay:"200ms"}}
              >
                <p className="text-center text-sm font-semibold">
                  Entregues
                </p>

                <div className="relative mx-auto mt-3 h-36 w-36">
                  <svg
                    viewBox="0 0 120 120"
                    className="h-full w-full"
                    role="img"
                    aria-label={`Taxa de entrega: ${percentage(deliveredTotal, sentTotal)} por cento`}
                  >
                    <circle cx="60" cy="60" r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity=".1"
                      strokeWidth="10"/>

                    <circle cx="60" cy="60" r="45"
                      fill="none"
                      stroke="#198b72"
                      strokeWidth="10"
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      pathLength={100}
                      className="digitale-premium-ring"
                      style={{
                        ["--ring-end" as string]:
                          100 - Math.min(100,
                            sentTotal > 0
                              ? deliveredTotal / sentTotal * 100
                              : 0
                          ),
                        strokeDashoffset:
                          100 - Math.min(100,
                            sentTotal > 0
                              ? deliveredTotal / sentTotal * 100
                              : 0
                          )
                      } as React.CSSProperties}
                    />
                  </svg>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <strong className="text-2xl font-bold tabular-nums">
                      {percentage(deliveredTotal, sentTotal)}%
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {deliveredTotal.toLocaleString("pt-BR")} registros
                    </span>
                  </div>
                </div>
              </div>

              {/* ABERTURAS - ANEL LARANJA */}
              <div
                className="digitale-premium-card rounded-2xl border bg-card p-4"
                style={{animationDelay:"300ms"}}
              >
                <p className="text-center text-sm font-semibold">
                  Aberturas
                </p>

                <div className="relative mx-auto mt-3 h-36 w-36">
                  <svg
                    viewBox="0 0 120 120"
                    className="h-full w-full"
                    role="img"
                    aria-label={`Taxa de abertura: ${percentage(openedTotal, deliveredTotal)} por cento`}
                  >
                    <circle cx="60" cy="60" r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity=".1"
                      strokeWidth="10"/>

                    <circle cx="60" cy="60" r="45"
                      fill="none"
                      stroke="#ed873f"
                      strokeWidth="10"
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      pathLength={100}
                      className="digitale-premium-ring"
                      style={{
                        ["--ring-end" as string]:
                          100 - Math.min(100,
                            deliveredTotal > 0
                              ? openedTotal / deliveredTotal * 100
                              : 0
                          ),
                        strokeDashoffset:
                          100 - Math.min(100,
                            deliveredTotal > 0
                              ? openedTotal / deliveredTotal * 100
                              : 0
                          )
                      } as React.CSSProperties}
                    />
                  </svg>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <strong className="text-2xl font-bold tabular-nums">
                      {percentage(openedTotal, deliveredTotal)}%
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {openedTotal.toLocaleString("pt-BR")} registros
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(totals.unconfirmed > 0 ||
            totals.deferred > 0 ||
            totals.failed > 0) && (
            <p className="text-xs text-muted-foreground">
              {totals.unconfirmed > 0 &&
                `Aguardando confirmação: ${totals.unconfirmed}. `}
              {totals.deferred > 0 &&
                `Nova tentativa: ${totals.deferred}. `}
              {totals.failed > 0 &&
                `Falhas no envio: ${totals.failed}.`}
            </p>
          )}

            </div>
          )}

          {true && (
            <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Status por destinatário
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Acompanhe individualmente envios, entregas e aberturas.
              </p>
            </div>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {visible.length} exibidos
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar e-mail..."
              aria-label="Pesquisar destinatário"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Filtrar destinatários"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="sent">Enviados</option>
              <option value="delivered">Entregues</option>
              <option value="bounced">Devolvidos</option>
              <option value="opened">Com abertura</option>
              <option value="waiting">Aguardando confirmação</option>
            </select>
          </div>

          <div className="max-h-[440px] space-y-2 overflow-y-auto">
            {visible.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum destinatário encontrado.
              </p>
            )}

            {visible.map((item, index) => (
              <div key={`${item.email}-${index}`}
                className={
                  "rounded-xl border border-l-4 bg-card p-3.5 " +
                  "space-y-3 transition-colors " +
                  (item.deliveryStatus === "bounced" ||
                   item.sendStatus === "failed"
                    ? "border-l-red-500"
                    : item.openCount > 0
                      ? "border-l-blue-500"
                      : item.deliveryStatus === "sent"
                        ? "border-l-emerald-500"
                        : "border-l-amber-500")
                }>
                <p className="break-all text-sm font-semibold">
                  {item.email || "Destinatário não identificado"}
                </p>

                {!campaignId && item.campaign && (
                  <p className="text-xs text-muted-foreground">
                    Campanha: {item.campaign}
                  </p>
                )}

                
{/* DIGITALE_STATUS_COLORS_V3 */}
<div className="flex flex-wrap items-center gap-2 text-xs">

  {(filter === "all" || filter === "sent") && (
    <div
      className="min-w-[95px] rounded-lg border px-3 py-2"
      style={{
        backgroundColor: "rgba(49,94,145,0.08)",
        borderColor: "rgba(49,94,145,0.28)"
      }}
    >
      <span className="block text-[10px] text-muted-foreground">
        Envio
      </span>
      <strong className="font-semibold" style={{color:"#315e91"}}>
        {sent(item)}
      </strong>
    </div>
  )}

  {(filter === "all" ||
    filter === "delivered" ||
    filter === "bounced" ||
    filter === "waiting") && (
    <div
      className="min-w-[95px] rounded-lg border px-3 py-2"
      style={{
        backgroundColor:
          item.deliveryStatus === "bounced"
            ? "rgba(220,88,88,0.08)"
            : item.deliveryStatus === "sent"
              ? "rgba(25,139,114,0.08)"
              : "rgba(237,135,63,0.08)",
        borderColor:
          item.deliveryStatus === "bounced"
            ? "rgba(220,88,88,0.28)"
            : item.deliveryStatus === "sent"
              ? "rgba(25,139,114,0.28)"
              : "rgba(237,135,63,0.28)"
      }}
    >
      <span className="block text-[10px] text-muted-foreground">
        Entrega
      </span>
      <strong
        className="font-semibold"
        style={{
          color:
            item.deliveryStatus === "bounced"
              ? "#dc5858"
              : item.deliveryStatus === "sent"
                ? "#198b72"
                : "#c97330"
        }}
      >
        {delivery(item)}
      </strong>
    </div>
  )}

  {(filter === "all" || filter === "opened") && (
    <div
      className="min-w-[95px] rounded-lg border px-3 py-2"
      style={{
        backgroundColor: item.openCount > 0
          ? "rgba(237,135,63,0.08)"
          : "rgba(125,135,150,0.06)",
        borderColor: item.openCount > 0
          ? "rgba(237,135,63,0.28)"
          : "rgba(125,135,150,0.18)"
      }}
    >
      <span className="block text-[10px] text-muted-foreground">
        Abertura
      </span>
      <strong
        className="font-semibold"
        style={item.openCount > 0
          ? {color:"#c97330"}
          : undefined}
      >
        {item.openCount > 0 ? "Registrada" : "Não registrada"}
      </strong>
    </div>
  )}

</div>

{item.deliveryStatus === "bounced" && (
                  <p className="rounded-md bg-red-50 p-2 text-xs text-red-800">
                    {reason(item)}
                  </p>
                )}

                {item.openCount > 0 && item.firstOpen && (
                  <p className="text-xs text-muted-foreground">
                    Primeira abertura: {formatBrasilia(item.firstOpen)}
                  </p>
                )}
              </div>
            ))}
          </div>

            </div>
          )}

          {data.limited && (
            <p className="text-xs text-muted-foreground">
              Exibindo os 200 registros mais recentes.
              Os indicadores consideram todos os registros.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Entregue indica aceitação pelo servidor de destino,
            não necessariamente pela caixa de entrada.
            Aberturas não garantem leitura humana.
            Atualização automática a cada 30 segundos.
          </p>
        </>
      )}
    </section>
  );
}
