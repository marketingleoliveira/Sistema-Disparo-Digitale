
import * as React from "react";
// DIGITALE_MULTI_OPEN_XLSX_V1
import { exportMultiOpenCsv }
  from "@/lib/disparo-multi-open-csv.functions";
import { listPdfCampaigns }
  from "@/lib/disparo-open-pdf.functions";
import { exportMultiOpenPdf }
  from "@/lib/disparo-multi-open-pdf.functions";

export function MultiOpenersPdfExport(){
  const [open,setOpen]=React.useState(false);
  const [campaigns,setCampaigns]=React.useState<
    {id:string;name:string}[]
  >([]);
  const [selected,setSelected]=React.useState<string[]>([]);
  const [startDate,setStartDate]=React.useState("");
  const [endDate,setEndDate]=React.useState("");
  const [busy,setBusy]=React.useState(false);
  const [loading,setLoading]=React.useState(false);
  const [error,setError]=React.useState("");

  React.useEffect(()=>{
    if(!open)return;
    let active=true;
    setLoading(true);
    setError("");

    listPdfCampaigns()
      .then(v=>{if(active)setCampaigns(v);})
      .catch(()=>{
        if(active)setError("Falha ao carregar campanhas.");
      })
      .finally(()=>{
        if(active)setLoading(false);
      });

    return()=>{active=false};
  },[open]);

  function toggle(id:string){
    setSelected(previous=>
      previous.includes(id)
        ? previous.filter(x=>x!==id)
        : [...previous,id]
    );
  }

  async function download(format:"pdf"|"csv"){
    if(selected.length<1||selected.length>5){
      setError("Selecione entre 1 e 5 campanhas.");
      return;
    }

    if(!startDate||!endDate||startDate>endDate){
      setError("Defina um periodo valido.");
      return;
    }

    setBusy(true);
    setError("");

    try{
      const data = {
        campaignIds:selected,
        startDate,
        endDate
      };

      const result = format === "pdf"
        ? await exportMultiOpenPdf({data})
        : await exportMultiOpenCsv({data});

      const raw=atob(result.content);
      const bytes=new Uint8Array(raw.length);

      for(let i=0;i<raw.length;i++){
        bytes[i]=raw.charCodeAt(i);
      }

      const blob=new Blob(
        [bytes],{type:format === "pdf"
          ? "application/pdf"
          : "text/csv;charset=utf-8"}
      );
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");

      a.href=url;
      a.download=result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(
        ()=>URL.revokeObjectURL(url),60000
      );
      setOpen(false);
    }catch(e){
      setError(
        e instanceof Error?e.message:
        "Falha ao gerar PDF."
      );
    }finally{
      setBusy(false);
    }
  }

  return <>
    <button type="button"
      onClick={()=>setOpen(true)}
      className="rounded-lg border border-slate-300
        bg-white px-4 py-2 text-sm font-medium
        text-slate-900 hover:bg-slate-100">
      Exportar
    </button>

    {open&&<div role="presentation"
      className="fixed inset-0 z-[110] flex items-center
        justify-center bg-black/55 p-4">

      <section role="dialog" aria-modal="true"
        aria-label="Exportar campanhas"
        className="max-h-[90vh] w-full max-w-xl
          overflow-y-auto rounded-2xl border
          border-slate-200 bg-white p-6 shadow-xl"
        style={{color:"#0F172A"}}>

        <h2 className="text-xl font-semibold">
          Exportar campanhas
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Selecione de 1 a 5 campanhas.
          Cada campanha terá sua própria tabela no PDF
          ou uma tabela unica no CSV.
        </p>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">
            Campanhas ({selected.length}/5)
          </p>

          <div className="max-h-56 space-y-1 overflow-y-auto
            rounded-lg border border-slate-200 p-2">

            {loading&&<p className="p-3 text-sm">
              Carregando campanhas...
            </p>}

            {!loading&&campaigns.map(c=>(
              <label key={c.id}
                className="flex cursor-pointer items-center
                  gap-3 rounded-lg p-2 hover:bg-slate-50">
                <input type="checkbox"
                  checked={selected.includes(c.id)}
                  disabled={
                    busy||(
                      selected.length>=5&&
                      !selected.includes(c.id)
                    )
                  }
                  onChange={()=>toggle(c.id)}
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            Data inicial
            <input type="date" value={startDate}
              onChange={e=>setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg
                border border-slate-300 bg-white p-3
                text-slate-900"/>
          </label>

          <label className="text-sm font-medium">
            Data final
            <input type="date" value={endDate}
              onChange={e=>setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg
                border border-slate-300 bg-white p-3
                text-slate-900"/>
          </label>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Uma linha por destinatário em cada campanha.
          Inclui telefone, CNPJ, website e primeira abertura.
        </p>

        {error&&<p role="alert"
          className="mt-4 rounded-lg bg-red-50
            p-3 text-sm text-red-700">
          {error}
        </p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={busy}
            onClick={()=>setOpen(false)}
            className="rounded-lg border border-slate-300
              px-4 py-2 text-sm">
            Cancelar
          </button>

          <button type="button"
            disabled={busy||loading||selected.length<1}
            onClick={()=>void download("csv")}
            className="rounded-lg border border-slate-300
              bg-white px-4 py-2 text-sm font-medium
              text-slate-900 hover:bg-slate-100
              disabled:opacity-50">
            {busy?"Gerando...":"CSV"}
          </button>

          <button type="button"
            disabled={busy||loading||selected.length<1}
            onClick={()=>void download("pdf")}
            className="rounded-lg bg-slate-900 px-4
              py-2 text-sm font-medium text-white
              disabled:opacity-50">
            {busy?"Gerando...":"PDF"}
          </button>
        </div>
      </section>
    </div>}
  </>;
}
