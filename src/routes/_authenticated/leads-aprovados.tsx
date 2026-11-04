import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listApprovedLeads } from "@/lib/approved-leads.functions";
import type { ApprovedLead } from "@/lib/approved-leads.server";

export const Route = createFileRoute(
  "/_authenticated/leads-aprovados"
)({
  component: ApprovedLeadsPage
});

function formatCnpj(value: string) {
  const d = value.replace(/\D/g, "");
  if (d.length !== 14) return value;
  return d.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });
}

function ApprovedLeadsPage() {
  const [leads, setLeads] = React.useState<ApprovedLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listApprovedLeads();
      setLeads(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao carregar leads."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = leads.filter(lead => {
    const q = search.trim().toLowerCase();
    const matches = [
      lead.company,
      lead.cnpj,
      lead.email,
      lead.phone,
      lead.website
    ].some(v => String(v || "").toLowerCase().includes(q));

    const statusMatches =
      filter === "all" ||
      (filter === "pending" && !lead.sdr) ||
      (filter === "assigned" && !!lead.sdr);

    return matches && statusMatches;
  });

  const pending = leads.filter(l => !l.sdr).length;
  const assigned = leads.filter(l => !!l.sdr).length;

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            IA DIGITALE / PROSPECÇÃO
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold mt-2">
            LEADS APROVADOS
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Empresas verificadas pela IA, aguardando distribuição comercial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Total aprovado", leads.length],
          ["Aguardando SDR", pending],
          ["Atribuídos", assigned]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold mt-3">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa, CNPJ, e-mail ou telefone"
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
          />

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="pending">Aguardando SDR</option>
            <option value="assigned">Atribuídos</option>
          </select>
        </div>

        {error && (
          <p className="rounded-lg border p-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {[
                  "Empresa",
                  "CNPJ",
                  "E-mail",
                  "Telefone",
                  "Site",
                  "UF",
                  "Aprovação",
                  "Status",
                  "SDR"
                ].map(h => (
                  <th key={h} className="p-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map(lead => (
                <tr key={lead.cnpj} className="border-b align-top">
                  <td className="p-3 font-medium">{lead.company}</td>
                  <td className="p-3 whitespace-nowrap">
                    {formatCnpj(lead.cnpj)}
                  </td>
                  <td className="p-3">{lead.email || "—"}</td>
                  <td className="p-3">{lead.phone || "—"}</td>
                  <td className="p-3 max-w-[220px] break-all">
                    {lead.website &&
                    /^https?:\/\//i.test(lead.website) ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {lead.website}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="p-3">{lead.uf || "—"}</td>
                  <td className="p-3 whitespace-nowrap">
                    {formatDate(lead.approvedAt)}
                  </td>
                  <td className="p-3">
                    <span className="inline-block rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                      {lead.sdr ? "Atribuído" : "Aguardando atribuição"}
                    </span>
                  </td>
                  <td className="p-3">
                    {lead.sdr || "Não atribuído"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !error && filtered.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              Nenhum lead aprovado encontrado.
            </div>
          )}

          {loading && (
            <div className="p-10 text-center text-muted-foreground">
              Carregando leads aprovados...
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          A atribuição manual a SDR será habilitada em uma próxima etapa.
          Esta tela não dispara campanhas nem envia contatos automaticamente.
        </p>
      </div>
    </div>
  );
}
