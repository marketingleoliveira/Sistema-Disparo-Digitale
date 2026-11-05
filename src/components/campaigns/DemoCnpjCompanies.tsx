// DIGITALE_DEMO_219_IA_V2
import * as React from "react";
import { getDemoCnpjCompanies } from
  "@/lib/disparo-demo-companies.functions";

type Company = {
  email: string;
  cnpj: string;
  name: string;
  legalName: string;
  phone: string;
  website: string;
  demoOpenCount: number;
  clientStatus?: string;
  auditedEmails?: string[];
};

export function DemoCnpjCompanies({ search }: { search: string }) {
  const [records, setRecords] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    void getDemoCnpjCompanies()
      .then(result => {
        if (active) setRecords(result.companies);
      })
      .catch(err => {
        if (active) setError(
          err instanceof Error ? err.message : "Erro na consulta de CNPJs."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const term = search.trim().toLowerCase();

  const visible = records.filter(r =>
    !term ||
    r.email.includes(term) ||
    r.auditedEmails?.some(email => email.includes(term)) ||
    r.cnpj.includes(term) ||
    r.name.toLowerCase().includes(term) ||
    r.legalName.toLowerCase().includes(term)
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">
      Consultando CNPJs na IA Digitale...
    </p>;
  }

  if (error) {
    return <p role="alert" className="text-sm text-red-700">
      {error}
    </p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="font-medium">
          {visible.length} exibidos
        </span>
        <span className="text-muted-foreground">
          2.823 de 9.456 leituras DEMO com CNPJ
        </span>
      </div>

      <div className="max-h-[440px] space-y-2 overflow-y-auto">
        {visible.map((r, index) => (
          <div
            key={r.cnpj}
            className="space-y-3 rounded-xl border border-l-4 border-l-blue-500 bg-card p-3.5"
          >
            <button
              type="button"
              className="break-all text-left text-sm font-semibold text-blue-700 hover:underline"
              onClick={() =>
                setSelected(selected === r.cnpj ? null : r.cnpj)
              }
            >
              {r.email}
            </button>

            <p className="text-xs text-muted-foreground">
              CNPJ: {r.cnpj}
              
            </p>

            {selected === r.cnpj && (
              <div className="space-y-2 rounded-lg border bg-slate-50 p-3 text-sm">
                <p><strong>Razão social:</strong> {r.legalName || "Não informada"}</p>
                <p><strong>Nome fantasia:</strong> {r.name || "Não informado"}</p>
                <p><strong>CNPJ:</strong> {r.cnpj}</p>
                {Boolean(r.auditedEmails?.length) && (
                  <p><strong>Destinatários vinculados:</strong> {r.auditedEmails?.join(", ")}</p>
                )}
                <p>
                  <strong>Cadastro na IA:</strong>{" "}
                  {r.clientStatus === "active"
                    ? "Cliente ativo"
                    : r.clientStatus === "inactive"
                    ? "Cliente inativo"
                    : r.clientStatus === "unknown"
                    ? "Cliente cadastrado — situação desconhecida"
                    : "Não identificado na base de clientes"}
                </p>
                <p><strong>Telefone:</strong> {r.phone || "Não informado"}</p>
                <p><strong>Website:</strong> {r.website || "Não informado"}</p>
                <p className="text-xs text-muted-foreground">
                  Fonte: IA Digitale / Portal. Envio e abertura não realizados.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
