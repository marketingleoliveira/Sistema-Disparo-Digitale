import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCampaignRecipientPreview } from "@/lib/disparo-campaign-recipient-preview.functions";
import { getCampaignDemoEngagement } from "@/lib/disparo-campaign-beta";

type SampleRow = {
  email: string;
  status: string;
};

type CnpjRow = {
  email: string;
  cnpj: string;
  company: string;
  phone: string;
};

type Preview = {
  sample: SampleRow[];
  cnpjPool: CnpjRow[];
};

function hashValue(text: string): number {
  return Array.from(text).reduce((acc, ch, index) => {
    return acc + ch.charCodeAt(0) * (index + 1);
  }, 0);
}

export function CampaignRecipientDemo({ campaignId }: { campaignId: string }) {
  const fetchPreview = useServerFn(getCampaignRecipientPreview);

  const [data, setData] = React.useState<Preview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [view, setView] = React.useState<"opened" | "cnpj">("opened");

  React.useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setData(null);
    setSearch("");
    setView("opened");

    void fetchPreview({ data: { campaignId } })
      .then(result => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível carregar os registros.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [campaignId, fetchPreview]);

  const seed = hashValue(campaignId);
  const isPilatesReference = campaignId === "2a3a8e60-e72f-11f1-80bf-18e8d4c367ea";

  // O numero exibido no filtro corresponde ao card "Leituras" da mesma
  // mascara. A lista abaixo e somente uma amostra de ate 200 destinatarios.
  const { readings: openedTotal } = getCampaignDemoEngagement(campaignId);

  // Quantidades variadas da mascara, mantendo os valores específicos de Milano/Lyon.
  // Sem alterar registros reais ou atribuir aberturas efetivas.
  const cnpjDemoCounts: Record<string, number> = {
    "2a3a8e60-e72f-11f1-80bf-18e8d4c367ea": 26, // Pilates, amostra demonstrativa
    "86bd2a09-85f9-4641-9f8d-5a031e13ca8b": 112, // Milano
    "4d5f1795-6418-4fda-b72e-ead2f743ae67": 89,  // Lyon
    "274613ce-eaa7-4214-8e98-9266dcb664dd": 73, // Newsletter
    "77031c19-c393-498e-af23-1610965747d5": 67, // Treino
    "a89e9396-9906-4c43-b0d2-a031d9bd58d7": 83, // Aloe
    "ba60b51a-815b-4f20-8df4-29d6dc4c464d": 91, // Malha
    "cdd61ff9-2273-4b87-9eac-af7d1ce731fc": 77 // Fisiculturista
  };
  const cnpjTargetBase = cnpjDemoCounts[campaignId] ?? 61 + (seed % 34);

  const openedRows = (data?.sample || [])
    .slice(0, 200)
    .map(row => ({
      email: row.email,
      cnpj: "",
      company: "",
      phone: "",
      badge: "Clicado"
    }));

  const pool = data?.cnpjPool || [];
  const rotation = pool.length ? seed % pool.length : 0;
  const rotatedPool = [...pool.slice(rotation), ...pool.slice(0, rotation)];
  const cnpjRows = rotatedPool
    .slice(0, cnpjTargetBase)
    .map(row => ({
      email: row.email,
      cnpj: row.cnpj,
      company: row.company,
      phone: row.phone,
      badge: "Clicado"
    }));

  // Exporta todos os CNPJs exibidos na aba, independentemente da pesquisa.
  // CSV UTF-8 com separador ; (compativel com Excel em pt-BR).
  const exportCnpjCsv = () => {
    const safeField = (value: string) => {
      const normalized = String(value || "").replace(/\r|\n/g, " ").trim();
      // Evita interpretacao de formulas ao abrir o CSV em planilhas.
      const protectedValue = /^[=+\-@\t]/.test(normalized) ? "'" + normalized : normalized;
      return '"' + protectedValue.replace(/"/g, '""') + '"';
    };
    const lines = [
      ["RAZÃO SOCIAL", "CNPJ", "E-MAIL", "TELEFONE"].map(safeField).join(";"),
      ...cnpjRows.map(row =>
        [row.company, row.cnpj, row.email, row.phone].map(safeField).join(";")
      )
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aberturas-cnpj-DEMO-" + campaignId.slice(0, 8) + ".csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const activeRows = view === "opened" ? openedRows : cnpjRows;

  const visibleRows = activeRows.filter(row => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${row.email} ${row.cnpj}`.toLowerCase().includes(term);
  });

  return (
    <section className="mt-5 space-y-3 rounded-xl border bg-card p-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold">Destinatários e aberturas</h4>
      </div>

      {loading ? (
        <p className="text-sm">Carregando registros...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView("opened")}
              className={
                "rounded-md border px-3 py-2 text-xs font-medium " +
                (view === "opened"
                  ? "bg-foreground text-background"
                  : "bg-background")
              }
            >
              Aberturas ({openedTotal.toLocaleString("pt-BR")})
            </button>

            <button
              type="button"
              onClick={() => setView("cnpj")}
              className={
                "rounded-md border px-3 py-2 text-xs font-medium " +
                (view === "cnpj"
                  ? "bg-foreground text-background"
                  : "bg-background")
              }
            >
              {isPilatesReference ? "Abertura + CNPJ (referência)" : "Abertura + CNPJ"} ({cnpjRows.length})
            </button>
          </div>

          {view === "cnpj" && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Exportação da visualização demonstrativa; não comprova aberturas reais.
              </p>
              <button type="button" onClick={exportCnpjCsv}
                disabled={cnpjRows.length === 0}
                className="rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
                Exportar CSV ({cnpjRows.length})
              </button>
            </div>
          )}

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar e-mail ou CNPJ..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />

          {!isPilatesReference && (
            <p className="text-xs text-muted-foreground">
              {visibleRows.length} registros exibidos.
              {view === "opened" && (
                <> Amostra de destinatários da campanha; {openedTotal.toLocaleString("pt-BR")} é o total de leituras da máscara, não a quantidade de aberturas comprovadas nestes registros.</>
              )}
            </p>
          )}

          {isPilatesReference && view === "opened" && (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Total estimado: 7.461 aberturas · Com referência CNPJ: 26 · Sem CNPJ atribuído: 7.435. Sem eventos reais registrados para listar.
            </div>
          )}
          <div className="max-h-[440px] overflow-y-auto rounded-md border">
            {visibleRows.length === 0 ? (
              <p className="p-4 text-sm">Nenhum registro encontrado.</p>
            ) : (
              visibleRows.map((row, index) => (
                <div
                  key={`${row.email}-${index}`}
                  className="flex flex-wrap justify-between gap-2 border-b p-3 text-sm last:border-b-0"
                >
                  <span className="break-all font-medium">{row.email}</span>

                  <div className="flex flex-wrap items-center gap-2">
                    {row.cnpj ? (
                      <span className="font-mono text-xs">{row.cnpj}</span>
                    ) : null}

                    <span className="rounded-md bg-muted px-2 py-1 text-xs">
                      {row.badge}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
