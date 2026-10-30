import { MultiOpenersPdfExport } from "./MultiOpenersPdfExport";
import { CompanyDetailsButton } from "./CompanyDetailsButton"; // DIGITALE_COMPANY_DETAILS_MODAL_V1

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MailOpen, Search } from "lucide-react";
import { getIaProspectingOpenReport }
  from "@/lib/disparo-open-report.functions";

type Report=Awaited<
  ReturnType<typeof getIaProspectingOpenReport>
>;

function brasilia(value:string):string {
  if(!value)return "—";
  const date=new Date(value.replace(" ","T")+"Z");
  if(Number.isNaN(date.getTime()))return value+" UTC";
  return date.toLocaleString("pt-BR",{
    timeZone:"America/Sao_Paulo",
    dateStyle:"short",
    timeStyle:"medium"
  });
}

export function OpenersReportPage(){
  const [data,setData]=React.useState<Report|null>(null);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState("");
  const [search,setSearch]=React.useState("");
  const [selectedList,setSelectedList]=React.useState("all");

  React.useEffect(()=>{
    let active=true;

    setLoading(true);
    setError("");
    getIaProspectingOpenReport({data:{listId:selectedList}})
      .then(value=>{
        if(active)setData(value);
      })
      .catch(()=>{
        if(active)setError(
          "Acesso não autorizado ou consulta indisponível."
        );
      })
      .finally(()=>{
        if(active)setLoading(false);
      });

    return ()=>{active=false};
  },[selectedList]);

  const rows=React.useMemo(()=>{
    const q=search.trim().toLowerCase();
    return (data?.rows??[]).filter(row=>
      !q ||
      row.email.toLowerCase().includes(q) ||
      (row.cnpj??"").includes(q) ||
      row.campaignName.toLowerCase().includes(q) ||
      row.listName.toLowerCase().includes(q)
    );
  },[data,search]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-12">
      <Link
        to="/reports"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={16}/>
        Voltar aos relatórios
      </Link>

      <header className="space-y-2">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <MailOpen size={26}/>
          Aberturas — Todas as listas
        </h1>
        <p className="text-sm text-muted-foreground">
          Aberturas por lista e campanha, sem duplicar e-mails no total geral.
        </p>
      </header>
<div className="flex justify-end"><MultiOpenersPdfExport/></div>
      

      {loading ? (
        <p>Carregando relatório...</p>
      ) : error ? (
        <p role="alert" className="rounded-xl border p-5 text-sm text-destructive">
          {error}
        </p>
      ) : data ? (
        <>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">
              Aberturas únicas
            </p>
            <p className="mt-2 text-2xl font-bold">
              {data.uniqueOpeners.toLocaleString("pt-BR")}
            </p>
          </div>

          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <h2 className="font-semibold">
                Destinatários que abriram
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="openers-list" className="text-sm">Lista:</label>
                <select
                  id="openers-list"
                  aria-label="Filtrar por lista"
                  value={selectedList}
                  onChange={e=>setSelectedList(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Todas as listas</option>
                  {data.lists.map(list=>(
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Search size={16}/>
                <input
                  aria-label="Pesquisar e-mail, CNPJ ou campanha"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  className="w-52 bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">CNPJ</th>
                    <th className="p-4">Lista</th>
                    <th className="p-4">Campanha</th>
                    <th className="p-4">Data/hora da abertura</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(row=>(
                    <tr key={row.email+"|"+row.listId+"|"+row.campaignId}>
                      <td className="p-4 font-medium"><CompanyDetailsButton showWebsite email={row.email} /></td>
                      <td className="p-4 whitespace-nowrap">
                        {row.cnpj??"Não localizado"}
                      </td>
                      <td className="p-4">{row.listName}</td>
                      <td className="p-4">{row.campaignName}</td>
                      <td className="p-4 whitespace-nowrap">
                        {brasilia(row.firstOpenedAt)}
                      </td>
                    </tr>
                  ))}
                  {rows.length===0&&(
                    <tr>
                      <td colSpan={5}
                        className="p-10 text-center text-muted-foreground">
                        Nenhuma abertura registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {data.cnpjLookupUnavailable && (
            <p role="status" className="text-sm text-amber-700">
              Consulta ao Agendor indisponível: CNPJs não recuperados neste momento.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Horários em Brasília. O CNPJ é consultado
            diretamente no Agendor e não é armazenado
            no Disparo Digitale. Até 500 registros recentes.
            Aberturas podem incluir carregamento automático de imagens.
          </p>
        </>
      ) : null}
    </main>
  );
}
