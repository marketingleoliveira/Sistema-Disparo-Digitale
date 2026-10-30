import { exportCampaignRankingPdf } from "@/lib/disparo-campaign-ranking-pdf.functions";

// DIGITALE_CAMPAIGN_RANKING_PDF_V1
async function downloadCampaignRankingPdf(
  period: "geral" | "d7" | "d30" | "d90" | "m12"
) {
  try {
    const result = await exportCampaignRankingPdf({
      data: { period }
    });

    const raw = atob(result.content);
    const bytes = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }

    const url = URL.createObjectURL(
      new Blob([bytes], { type: "application/pdf" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(
      () => URL.revokeObjectURL(url), 60000
    );
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : "Nao foi possivel gerar o PDF."
    );
  }
}

import * as React from "react";
import { getCampaignClickRanking } from "@/lib/disparo-campaign-click-ranking.functions";
import { getCampaignClickContacts } from "@/lib/disparo-campaign-click-contacts.functions";

// DIGITALE_CAMPAIGN_RANKING_V3
// DIGITALE_CAMPAIGN_CONTACTS_V2

type Period = "geral" | "d7" | "d30" | "d90" | "m12";

type Campaign = {
  id: string;
  name: string;
  geral: number;
  d7: number;
  d30: number;
  d90: number;
  m12: number;
};

type Contact = {
  name: string;
  email: string;
  clicks: number;
  cnpj: string | null;
};

const filters: { value: Period; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "d7", label: "7d" },
  { value: "d30", label: "30d" },
  { value: "d90", label: "90d" },
  { value: "m12", label: "12m" }
];

export function CampaignClicksRanking() {
  const [period, setPeriod] = React.useState<Period>("geral");
  const [items, setItems] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const [selected, setSelected] = React.useState<Campaign | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = React.useState(false);
  const [contactsError, setContactsError] = React.useState(false);

  // DIGITALE_CONTACT_SEARCH_V1
  const [contactSearch, setContactSearch] = React.useState("");


  React.useEffect(() => {
    let active = true;

    getCampaignClickRanking()
      .then(result => {
        if (!active) return;
        setItems(Array.isArray(result) ? result : []);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (!selected) return;

    let active = true;

    setContacts([]);
    setContactsLoading(true);
    setContactsError(false);

    getCampaignClickContacts({
      data: {
        campaignId: selected.id,
        period
      }
    })
      .then(result => {
        if (active) {
          setContacts(Array.isArray(result) ? result : []);
        }
      })
      .catch(() => {
        if (active) setContactsError(true);
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });

    return () => { active = false; };
  }, [selected, period]);

  const ranking = React.useMemo(
    () => [...items]
      .filter(item => item[period] > 0)
      .sort((a, b) =>
        b[period] - a[period] ||
        a.name.localeCompare(b.name, "pt-BR")
      )
      .slice(0, 10),
    [items, period]
  );

  const maximum = ranking[0]?.[period] || 1;

  const normalizeSearch = (value: string) =>
    value.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const filteredContacts = React.useMemo(() => {
    const term = normalizeSearch(contactSearch);
    if (!term) return contacts;

    const digits = term.replace(/\D/g, "");

    return contacts.filter(contact => {
      const name = normalizeSearch(contact.name);
      const email = normalizeSearch(contact.email);
      const cnpj = contact.cnpj || "";

      return (
        name.includes(term) ||
        email.includes(term) ||
        normalizeSearch(cnpj).includes(term) ||
        (digits.length > 0 &&
          cnpj.replace(/\D/g, "").includes(digits))
      );
    });
  }, [contacts, contactSearch]);


  return (
    <>
      <section className="lg:col-span-2 min-w-0 rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-primary">
              Ranking de Campanhas
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Campanhas com mais cliques nos links
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
<details className="relative z-20 shrink-0">
            <summary
              aria-label="Exportar ranking de campanhas"
              className="flex cursor-pointer list-none items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden"
            >
              ↓ Exportar ⌄
            </summary>
            <div className="absolute left-0 top-full z-50 mt-2 w-40 rounded-lg border bg-card p-1 shadow-xl">
              <button
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                onClick={event => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  void downloadCampaignRankingPdf(period);
                }}
              >
                PDF
              </button>
              <button
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                onClick={event => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  window.alert("A geração do relatório Excel será implementada na próxima etapa.");
                }}
              >
                Excel (.xlsx)
              </button>
            </div>
          </details>
<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
            
          {/* DIGITALE_CAMPAIGN_EXPORT_UI_V2 */}
          

          {filters.map(filter => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={period === filter.value}
                onClick={() => setPeriod(filter.value)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-bold transition-colors " +
                  (period === filter.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
</div>
        </div>

        <div className="max-h-[460px] min-h-[260px] space-y-5 overflow-y-auto pr-1">
          {loading && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Carregando ranking...
            </p>
          )}

          {error && (
            <p className="py-12 text-center text-sm text-destructive">
              Não foi possível carregar o ranking.
            </p>
          )}

          {!loading && !error && ranking.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma campanha recebeu cliques neste período.
            </p>
          )}

          {!loading && !error && ranking.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-primary">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className="min-w-0 truncate text-xs font-bold text-primary"
                    title={item.name}
                  >
                    {item.name}
                  </span>

                  <div className="shrink-0 text-right">
                    <span className="block text-sm font-bold tabular-nums text-primary">
                      {item[period].toLocaleString("pt-BR")} cliques
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSearch("");
                        setSelected(item);
                      }}
                      className="mt-1 text-xs font-semibold text-accent hover:underline"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      "h-full rounded-full " +
                      (index === 0 ? "bg-[#ed873f]" : "bg-[#31577e]")
                    }
                    style={{
                      width: `${(item[period] / maximum) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quem clicou nesta campanha"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div className="min-w-0">
                <h3 className="text-base font-bold">
                  Quem clicou nesta campanha
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              <div className="mb-4">
                <input
                  type="search"
                  value={contactSearch}
                  onChange={event =>
                    setContactSearch(event.target.value)
                  }
                  placeholder="Nome, CNPJ, email"
                  aria-label="Pesquisar contatos por nome, CNPJ ou email"
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              {contactsLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Carregando contatos...
                </p>
              ) : contactsError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  Não foi possível consultar os contatos.
                </p>
              ) : contacts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum contato identificado neste período.
                </p>
              ) : filteredContacts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum contato corresponde à pesquisa.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="mb-4 text-xs text-muted-foreground">
                    {filteredContacts.length} de {contacts.length} contatos exibidos
                  </p>

                  {filteredContacts.map((contact, index) => (
                    <div
                      key={contact.email}
                      className="flex items-start justify-between gap-4 rounded-xl border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {index + 1}. {contact.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <a
                            href={`/contacts?clickContact=${encodeURIComponent(contact.email)}`}
                            title="Abrir ficha deste contato"
                            className="break-all font-medium text-accent underline-offset-2 hover:underline focus-visible:underline"
                          >
                            {contact.email}
                          </a>
                          {contact.cnpj && (
                            <span className="whitespace-nowrap">
                              · CNPJ: {contact.cnpj}
                            </span>
                          )}
                        </div>
                      </div>

                      <strong className="shrink-0 text-sm tabular-nums">
                        {contact.clicks.toLocaleString("pt-BR")} cliques
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
