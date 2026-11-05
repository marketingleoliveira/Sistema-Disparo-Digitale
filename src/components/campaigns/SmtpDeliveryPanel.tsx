import { createPortal } from "react-dom";
import { demoCnpjCompanies } from "@/lib/disparo-demo-cnpj-companies";
import { DemoCnpjCompanies } from "@/components/campaigns/DemoCnpjCompanies";
import { CompanyDetailsButton } from "@/components/analytics/CompanyDetailsButton";
import { LiveCampaignPulse } from "./LiveCampaignPulse";
import { getCampaignBeta } from "@/lib/disparo-campaign-beta";
import { getDisparoOpenedCnpjEmails } from "@/lib/disparo-opened-cnpj.functions";

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
  // DIGITALE_DEMO_POPUP_POSITION_V1
  const [demoPopupPosition, setDemoPopupPosition] =
    React.useState({ x: 16, y: 16 });

  const [copiedDemoCnpj, setCopiedDemoCnpj] = React.useState(false);
  const [showReal, setShowReal] = React.useState(false);
  // DIGITALE_DEMO_COMPANY_MODAL_V1
  const [demoCompanyInfo, setDemoCompanyInfo] =
    React.useState<{ cnpj: string; company: string } | null>(null);

  const beta = showReal ? null : getCampaignBeta(campaignId);

  React.useEffect(() => { setShowReal(false); }, [campaignId]);
  const getData = useServerFn(getSmtpDeliverySummary);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  // DIGITALE_ABERTURA_CNPJ_V1
  const getCnpjEmails = useServerFn(getDisparoOpenedCnpjEmails);
  const [cnpjMatches, setCnpjMatches] = React.useState<string[]>([]);
  const [cnpjLoading, setCnpjLoading] = React.useState(false);
  const [cnpjError, setCnpjError] = React.useState("");

  const openedCandidates = (data?.records || [])
    .filter((r: Recipient) => Number(r.openCount) > 0)
    .map((r: Recipient) => r.email.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 200)
    .join("\n");

  React.useEffect(() => {
    if (filter !== "opened_cnpj") return;

    let active = true;
    setCnpjMatches([]);
    setCnpjError("");

    if (!campaignId || !openedCandidates) {
      setCnpjLoading(false);
      return;
    }

    setCnpjLoading(true);

    void getCnpjEmails({
      data: {
        campaignId,
        emails: openedCandidates.split("\n")
      }
    })
      .then(result => {
        if (active) setCnpjMatches(result.emails);
      })
      .catch(() => {
        if (active) setCnpjError(
          "Não foi possível consultar os CNPJs."
        );
      })
      .finally(() => {
        if (active) setCnpjLoading(false);
      });

    return () => { active = false; };
  }, [filter, campaignId, openedCandidates, getCnpjEmails]);

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
          // DIGITALE_DEMO_OPEN_VISUAL_V1
          // Gera aberturas visuais apenas para a campanha DEMO,
          // usando a base real de destinatarios ja carregada.
          if (
            campaignId === "cdd61ff9-2273-4b87-9eac-af7d1ce731fc" &&
            result &&
            Array.isArray(result.records)
          ) {
            const baseDate = new Date("2026-11-01T08:00:00Z");

            const demoRecords = result.records.map((item: any, index: number) => {
              const shouldOpen = index < 200 || index % 3 !== 0;

              if (!shouldOpen) {
                return {
                  ...item,
                  sendStatus: item.sendStatus || "accepted",
                  deliveryStatus: item.deliveryStatus || "sent",
                  openCount: 0,
                  firstOpen: ""
                };
              }

              // DIGITALE_DEMO_OPEN_CUTOFF_10H_V1
              // Limite fixo: 03/11/2026 as 10h em Brasilia.
              // Aberturas simuladas nunca ultrapassam esse instante.
              const demoCutoff = Date.parse("2026-11-03T13:00:00Z");
              const demoStart = baseDate.getTime();
              const windowMs = demoCutoff - demoStart + 1;
              const offsetMs = (
                index * 37 * 60000 +
                ((index * 47 + 13) % 60) * 1000
              ) % windowMs;

              const openDate = new Date(demoStart + offsetMs);
              const yyyy = openDate.getUTCFullYear();
              const mm = String(openDate.getUTCMonth() + 1).padStart(2, "0");
              const dd = String(openDate.getUTCDate()).padStart(2, "0");
              const hh = String(openDate.getUTCHours()).padStart(2, "0");
              const mi = String(openDate.getUTCMinutes()).padStart(2, "0");
              const ss = String(openDate.getUTCSeconds()).padStart(2, "0");

              return {
                ...item,
                sendStatus: "accepted",
                deliveryStatus: "sent",
                openCount: (index % 4) + 1,
                firstOpen: `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
              };
            });

            setData({
              ...result,
              records: demoRecords,
              totals: {
                ...result.totals,
                sent: 17434,
                delivered: 17251,
                bounced: 164,
                opened: 14652
              }
            });
          } else {
            setData(result);
          }

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
      () => void load(), 10000
    );
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [campaignId, getData]);

  
// DIGITALE_DEMO_GRAFICOS_V1
// Dados ficticios exclusivamente para a campanha DEMO.
// Nenhuma alteracao no banco de dados ou na API.
const isDemoCampaign =
  campaignId === "cdd61ff9-2273-4b87-9eac-af7d1ce731fc";

const totals = beta
  ? {
      attempts: beta.target,
      sent: beta.accepted,
      delivered: beta.delivered,
      bounced: beta.bounced,
      opened: beta.readings,
      unconfirmed: 0,
      deferred: 0,
      failed: beta.failed
    }
  : isDemoCampaign && data?.totals
  ? {
      ...data.totals,
      sent: 17434,
      delivered: 17251,
      bounced: 164,
      opened: 14652
    }
  : data?.totals;


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
  const readyToReadTotal = beta?.readyToRead ?? openedTotal;

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


  // DIGITALE_DEMO_CNPJ_82_V1
  // Exclusivo da interface DEMO. Nao altera eventos nem CNPJs reais.
  const demoCnpjRows: Recipient[] = demoCnpjCompanies.map(
    ({ cnpj, company }) => ({
      email: `CNPJ ${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12)} — ${company}`,
      campaign: "Milano - DEMO",
      sendStatus: "simulated",
      deliveryStatus: null,
      openCount: 1,
      firstOpen: null,
      lastOpen: null,
    } as unknown as Recipient)
  );


  // DIGITALE_MILANO_200_OPENED_ROWS_V1
  // Dados ilustrativos: nunca persistir, exportar como reais
  // ou registrar eventos de abertura no banco.
  const milanoDemoOpenedRows: Recipient[] = beta
    ? Array.from({ length: 200 }, (_, index) => {
        const template = (data?.records || [])[0] || demoCnpjRows[0];
        const number = String(index + 1).padStart(3, "0");

        return {
          ...template,
          id: `milano-demo-opened-${number}`,
          email: `contato${number}@milano-demo.invalid`,
          campaign: "Milano - DEMO",
          openCount: 1,
        } as Recipient;
      })
    : [];

  const visible: Recipient[] = (beta && filter === "opened" ? milanoDemoOpenedRows : (beta && filter === "opened_cnpj"
    ? demoCnpjRows
    : (data?.records || [])))

    .filter((r: Recipient) => {
      const term = search.toLowerCase().trim();
      if (term && !r.email.toLowerCase().includes(term) &&
          !r.campaign.toLowerCase().includes(term)) return false;
      if (filter === "sent") return r.sendStatus === "accepted";
      if (filter === "delivered") return r.deliveryStatus === "sent";
      if (filter === "bounced") return r.deliveryStatus === "bounced";
      if (filter === "opened") return r.openCount > 0;
       if (filter === "opened_cnpj")
         return beta
           ? true
           : r.openCount > 0 &&
             cnpjMatches.includes(r.email.trim().toLowerCase());
      if (filter === "waiting") {
        return r.sendStatus === "accepted" &&
          (!r.deliveryStatus || r.deliveryStatus === "deferred");
      }
      return true;
    });

  return (
    <section
      className="space-y-4"
      onClickCapture={(event) => {
        // DIGITALE_DEMO_CLOSE_CAPTURE_FIX_V2
        // Eventos do portal React não devem reabrir o card.
        const clickTarget = event.target;
        if (
          clickTarget instanceof Element &&
          clickTarget.closest(
            '[role="dialog"][aria-label="Informações da empresa"]'
          )
        ) {
          return;
        }

        if (!beta || filter !== "opened_cnpj") return;

        const target = event.target as HTMLElement;
        let element: HTMLElement | null = target;
        let company = null;

        for (let i = 0; element && i < 5; i++) {
          const content = element.textContent || "";

          if (content.length > 500) break;

          const match = content.match(
            /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/
          );

          if (match) {
            const digits = match[0].replace(/\D/g, "");
            company = demoCnpjCompanies.find(
              item => item.cnpj === digits
            );
            if (company) break;
          }

          element = element.parentElement;
        }

        if (!company) return;

        event.preventDefault();
        event.stopPropagation();

        setDemoPopupPosition({
          x: Math.max(
            12,
            Math.min(
              event.clientX + 12,
              window.innerWidth - Math.min(512, window.innerWidth - 24) - 12
            )
          ),
          y: Math.max(
            12,
            Math.min(event.clientY + 12, window.innerHeight - 330)
          )
        });

        setDemoCompanyInfo({
          cnpj: company.cnpj,
          company: company.company
        });
      }}
    >
      {/* DIGITALE_DEMO_PORTAL_POSITION_V2 */}
{demoCompanyInfo && beta && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-[9999]"
          style={{
            top: demoPopupPosition.y,
            left: demoPopupPosition.x,
            width: "min(32rem, calc(100vw - 24px))"
          }}
          role="presentation"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setDemoCompanyInfo(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Informações da empresa"
            className="w-full max-w-lg rounded-xl bg-white p-6 text-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">
                Informações da empresa
              </h3>
              <button
                type="button"
                onClick={() => setDemoCompanyInfo(null)}
                className="rounded-md border px-3 py-2"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500">
                  Razão social / Nome cadastrado
                </p>
                <p className="mt-1 font-semibold">
                  {demoCompanyInfo.company}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  CNPJ
                </p>
                
                {/* DIGITALE_DEMO_CONTATOS_COPIAR_V4 */}
                <button
                  type="button"
                  title="Clique para copiar o CNPJ"
                  className="mt-1 flex items-center gap-2 rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-50"
                  onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const value = demoCompanyInfo.cnpj;
                    try {
                      await navigator.clipboard.writeText(value);
                      setCopiedDemoCnpj(true);
                    } catch {
                      setCopiedDemoCnpj(false);
                    }
                  }}
                >
                  {demoCompanyInfo.cnpj.slice(0, 2)}.
                  {demoCompanyInfo.cnpj.slice(2, 5)}.
                  {demoCompanyInfo.cnpj.slice(5, 8)}/
                  {demoCompanyInfo.cnpj.slice(8, 12)}-
                  {demoCompanyInfo.cnpj.slice(12)}
                  <span className="text-xs">
                    {copiedDemoCnpj ? "Copiado!" : "Copiar"}
                  </span>
                </button>
              </div>
            </div>

            
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500">
                  Telefone de contato
                </p>
                <p className="mt-1 font-medium">
                  {demoCnpjCompanies.find(
                    c => c.cnpj === demoCompanyInfo.cnpj
                  )?.phone || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Site da empresa
                </p>
                {(() => {
                  const site = demoCnpjCompanies.find(
                    c => c.cnpj === demoCompanyInfo.cnpj
                  )?.site;
                  return site ? (
                    <a href={site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-blue-600 underline">
                      {site}
                    </a>
                  ) : (
                    <p className="mt-1">Não informado</p>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDemoCompanyInfo(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      <LiveCampaignPulse campaignId={campaignId}
        showReal={showReal} onShowRealChange={setShowReal} />
      <div>
        <h3 className="font-semibold">Acompanhamento dos envios</h3>
        <p className="text-xs text-muted-foreground">
          {beta
            ? "Resumo beta com métricas simuladas."
            : "Consulte os envios, as entregas e as aberturas."}
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
                  Pronto para Ler
                </p>

                <div className="relative mx-auto mt-3 h-36 w-36">
                  <svg
                    viewBox="0 0 120 120"
                    className="h-full w-full"
                    role="img"
                    aria-label={`Pronto para Ler: ${percentage(readyToReadTotal, sentTotal)} por cento`}
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
                            sentTotal > 0
                              ? readyToReadTotal / sentTotal * 100
                              : 0
                          ),
                        strokeDashoffset:
                          100 - Math.min(100,
                            sentTotal > 0
                              ? readyToReadTotal / sentTotal * 100
                              : 0
                          )
                      } as React.CSSProperties}
                    />
                  </svg>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <strong className="text-2xl font-bold tabular-nums">
                      {percentage(readyToReadTotal, sentTotal)}%
                    </strong>
                    <span className="text-[11px] text-muted-foreground">
                      {readyToReadTotal.toLocaleString("pt-BR")} registros
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
                {beta ? "Destinatários — DEMO" : "Status por destinatário"}
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
              <option value="opened">
                {beta ? "Com abertura — 8.962" : "Com abertura"}
              </option>
               <option value="opened_cnpj">Abertura CNPJ</option>
              <option value="waiting">Aguardando confirmação</option>
            </select>

            {/* DIGITALE_EXPORTAR_ABERTURA_CNPJ_V1 */}
            {filter === "opened_cnpj" && (
              <button
                type="button"
                disabled={cnpjLoading && !beta}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  const formatCnpj = (value: string) => {
                    const d = value.replace(/\D/g, "");
                    return d.length === 14
                      ? `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
                      : value;
                  };

                  const rows = beta
                    ? demoCnpjCompanies.filter(company =>
                        visible.some(r =>
                          r.email.includes(
                            formatCnpj(company.cnpj)
                          )
                        )
                      ).map(company => ({
                        tipo: "DEMO",
                        empresa: company.company,
                        cnpj: formatCnpj(company.cnpj),
                        email: "",
                        telefone: company.phone || "",
                        site: company.site || "",
                        abertura: "Simulada"
                      }))
                    : visible.map(r => ({
                        tipo: "REAL",
                        empresa: "",
                        cnpj: "",
                        email: r.email,
                        telefone: "",
                        site: "",
                        abertura: "Registrada"
                      }));

                  const headings = [
                    "Tipo",
                    "Empresa",
                    "CNPJ",
                    "Telefone",
                    "Site"
                  ];

                  const escapeCsv = (value: unknown) => {
                    let v = String(value ?? "");
                    if (/^[=+\-@]/.test(v.trimStart())) {
                      v = "'" + v;
                    }
                    return '"' + v.replace(/"/g, '""') + '"';
                  };

                  const content = [
                    headings.map(escapeCsv).join(";"),
                    ...rows.map(item => [
                      item.tipo,
                      item.empresa,
                      item.cnpj,
                      item.telefone,
                      item.site
                    ].map(escapeCsv).join(";"))
                  ].join("\r\n");

                  const blob = new Blob(
                    ["\uFEFF", content],
                    { type: "text/csv;charset=utf-8" }
                  );

                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = beta
                    ? "digitale-abertura-cnpj-demo.csv"
                    : "digitale-abertura-cnpj-real.csv";

                  document.body.appendChild(link);
                  link.click();
                  link.remove();

                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                className="shrink-0 rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Exportar CSV
              </button>
            )}

          </div>

          

            {!beta && filter === "opened_cnpj" && cnpjLoading && (
            <p className="text-sm text-muted-foreground">
              Consultando CNPJs na IA Digitale e no Portal/Agendor...
            </p>
          )}

          {!beta && filter === "opened_cnpj" && cnpjError && (
            <p role="alert" className="text-sm text-red-700">
              {cnpjError}
            </p>
          )}

          {/* DIGITALE_DEMO_CNPJ_REAL_V1 */}
          {campaignId === "cdd61ff9-2273-4b87-9eac-af7d1ce731fc" &&
            filter === "opened_cnpj" && (
              <DemoCnpjCompanies search={search} />
            )}

          <div
            className="max-h-[440px] space-y-2 overflow-y-auto"
            style={{
              display:
                campaignId === "cdd61ff9-2273-4b87-9eac-af7d1ce731fc" &&
                filter === "opened_cnpj"
                  ? "none" : undefined
            }}
          >
            {visible.length === 0 && !cnpjLoading && !cnpjError && (
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
                {/* DIGITALE_EMAIL_EMPRESA_CLICK_V1 */}
                <div className="break-all text-sm font-semibold">
                  {item.email ? (
                    <CompanyDetailsButton email={item.email} campaignId={campaignId} showWebsite />
                  ) : (
                    "Destinatário não identificado"
                  )}
                </div>

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

          {data?.limited && (
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
