
import * as React from "react";
import {
  listPdfCampaigns,exportOpenPdf
} from "@/lib/disparo-open-pdf.functions";

export function OpenersPdfExport(){
  const [open,setOpen]=React.useState(false);
  const [campaigns,setCampaigns]=React.useState<
    {id:string;name:string}[]
  >([]);
  const [campaignId,setCampaignId]=React.useState("");
  const [startDate,setStartDate]=React.useState("");
  const [endDate,setEndDate]=React.useState("");
  const [busy,setBusy]=React.useState(false);
  const [error,setError]=React.useState("");

  React.useEffect(()=>{
    if(!open)return;
    let active=true;
    setError("");
    listPdfCampaigns()
      .then(v=>{if(active)setCampaigns(v);})
      .catch(()=>{if(active)setError(
        "Nao foi possivel carregar campanhas."
      );});
    return()=>{active=false;};
  },[open]);

  async function download(){
    if(!campaignId||!startDate||!endDate){
      setError("Selecione a campanha e as duas datas.");
      return;
    }
    if(startDate>endDate){
      setError("Data inicial posterior a data final.");
      return;
    }
    setBusy(true);
    setError("");
    try{
      const result=await exportOpenPdf({
        data:{campaignId,startDate,endDate}
      });
      const raw=atob(result.content);
      const bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++){
        bytes[i]=raw.charCodeAt(i);
      }
      const url=URL.createObjectURL(
        new Blob([bytes],{type:"application/pdf"})
      );
      const a=document.createElement("a");
      a.href=url;
      a.download=result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),60000);
      setOpen(false);
    }catch(e){
      setError(
        e instanceof Error?e.message:
        "Falha ao exportar o PDF."
      );
    }finally{
      setBusy(false);
    }
  }

  return <>
    <button type="button"
      onClick={()=>setOpen(true)}
      className="rounded-lg bg-slate-900 px-4 py-2
        text-sm font-medium text-white hover:bg-slate-700">
      Exportar PDF
    </button>

    {open&&<div role="presentation"
      className="fixed inset-0 z-[100] flex items-center
        justify-center bg-black/55 p-4">
      <section role="dialog" aria-modal="true"
        aria-label="Exportar relatorio PDF"
        className="w-full max-w-lg rounded-2xl
          border border-slate-200 bg-white p-6 shadow-xl"
        style={{color:"#0F172A"}}>

        <h2 className="text-xl font-semibold">
          Exportar relatório de aberturas
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Selecione uma campanha e o período.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">
            Campanha
            <select value={campaignId}
              onChange={e=>setCampaignId(e.target.value)}
              className="mt-1 w-full rounded-lg border
                border-slate-300 bg-white p-3 text-slate-900">
              <option value="">Selecione a campanha</option>
              {campaigns.map(c=>
                <option key={c.id} value={c.id}>{c.name}</option>
              )}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Data inicial
              <input type="date" value={startDate}
                onChange={e=>setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border
                  border-slate-300 bg-white p-3 text-slate-900"/>
            </label>
            <label className="block text-sm font-medium">
              Data final
              <input type="date" value={endDate}
                onChange={e=>setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border
                  border-slate-300 bg-white p-3 text-slate-900"/>
            </label>
          </div>

          <p className="text-xs text-slate-500">
            Um registro por destinatário. Os dados comerciais
            serão consultados na IA Digitale e no Agendor.
          </p>

          {error&&<p role="alert"
            className="rounded-lg bg-red-50 p-3
              text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy}
              onClick={()=>setOpen(false)}
              className="rounded-lg border border-slate-300
                px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="button" disabled={busy}
              onClick={download}
              className="rounded-lg bg-slate-900 px-4
                py-2 text-sm font-medium text-white
                disabled:opacity-50">
              {busy?"Gerando PDF...":"Exportar PDF"}
            </button>
          </div>
        </div>
      </section>
    </div>}
  </>;
}
