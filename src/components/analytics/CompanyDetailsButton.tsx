// DIGITALE_COMPANY_DETAILS_MODAL_V1
import * as React from "react";
import { getDisparoCompanyDetails } from "@/lib/disparo-company-details.functions";

type CompanyData = Awaited<ReturnType<typeof getDisparoCompanyDetails>>;

function Info({label,value}:{label:string;value:string|null|undefined}){
  return <div className="rounded-lg border border-slate-200 p-3">
    <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
    <div className="break-words text-sm font-medium text-slate-900">{value||"Não informado"}</div>
  </div>;
}


function WebsiteInfo({value}:{value:string|null|undefined}){
  let href:string|null=null;

  if(value){
    try{
      const raw=value.trim();
      const url=new URL(
        /^https?:\/\//i.test(raw)?raw:"https://"+raw
      );
      if(url.protocol==="https:"||url.protocol==="http:"){
        href=url.href;
      }
    }catch{}
  }

  return (
    <div className="rounded-lg border p-3"
      style={{backgroundColor:"#F8FAFC",borderColor:"#E2E8F0"}}>
      <div className="mb-1 text-xs font-medium"
        style={{color:"#64748B"}}>Site</div>
      {href ? (
        <a href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-sm font-semibold hover:underline"
          style={{color:"#2563EB"}}>
          {value}
        </a>
      ) : (
        <span className="text-sm font-semibold"
          style={{color:"#0F172A"}}>
          {value||"Não informado"}
        </span>
      )}
    </div>
  );
}

export function CompanyDetailsButton({email,showWebsite=false}:{email:string;showWebsite?:boolean}){
  const [open,setOpen]=React.useState(false);
  const [loading,setLoading]=React.useState(false);
  const [detail,setDetail]=React.useState<CompanyData|null>(null);
  const [error,setError]=React.useState<string|null>(null);
  const closeRef=React.useRef<HTMLButtonElement>(null);
  const lastRequest=React.useRef(0);

  React.useEffect(()=>{
    if(!open)return;
    closeRef.current?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    document.addEventListener("keydown",onKey);
    return()=>document.removeEventListener("keydown",onKey);
  },[open]);

  const show=()=>{
    const request=++lastRequest.current;
    setOpen(true);setLoading(true);setError(null);setDetail(null);
    void getDisparoCompanyDetails({data:{email}})
      .then(value=>{if(lastRequest.current===request)setDetail(value);})
      .catch(()=>{if(lastRequest.current===request)setError("Não foi possível carregar os dados da empresa.");})
      .finally(()=>{if(lastRequest.current===request)setLoading(false);});
  };
  return <>
    <button type="button" onClick={show} aria-haspopup="dialog"
      title="Ver informações da empresa"
      className="cursor-pointer text-left font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-300">
      {email}
    </button>
    {open&&<div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <section role="dialog" aria-modal="true" aria-label="Informações da empresa" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold text-slate-900">Informações da empresa</h2>
            <p className="mt-1 break-all text-sm text-slate-500">{email}</p></div>
          <button ref={closeRef} type="button" onClick={()=>setOpen(false)} aria-label="Fechar detalhes" className="rounded-lg border border-slate-200 px-3 py-1.5 text-lg hover:bg-slate-100">×</button>
        </div>
        {loading?<div role="status" className="py-8 text-center text-sm text-slate-500">Consultando IA Digitale e Portal/Agendor...</div>
        :error?<p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
        :detail?<>
          {detail.conflict&&<p role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Há CNPJs diferentes associados a esse e-mail. Dados da empresa não foram combinados automaticamente.</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Razão social" value={detail.legalName}/>
            <Info label="Nome fantasia" value={detail.tradeName}/>
            <Info label="CNPJ" value={detail.cnpj}/>
            <Info label="Telefone" value={detail.phone}/>
            <div className="sm:col-span-2"><Info label="E-mail" value={detail.email}/></div>
            {showWebsite&&<div className="sm:col-span-2"><WebsiteInfo value={detail.website}/></div>}
          </div>
          <p className="mt-4 text-xs text-slate-500">Origem Portal/Agendor</p>
        </>:null}
        <div className="mt-5 flex justify-end"><button type="button" onClick={()=>setOpen(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200">Fechar</button></div>
      </section>
    </div>}
  </>;
}
