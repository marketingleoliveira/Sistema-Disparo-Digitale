// DIGITALE_COMPANY_DETAILS_MODAL_V1
// Dados sob demanda e so para destinatarios com abertura registrada.
import { spawn } from "node:child_process";
import { requireDisparoUser } from "./disparo-auth.server";

export type CompanyDetails = {
  email: string;
  cnpj: string | null;
  tradeName: string | null;
  legalName: string | null;
  phone: string | null;
  website: string | null;
  sources: string[];
  conflict: boolean;
};

type RecordEntry = {
  cnpj: string | null;
  tradeName: string | null;
  legalName: string | null;
  phone: string | null;
  website: string | null;
  source: string;
};

function safeEmail(value: string): string {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail invalido.");
  }
  return email;
}

function query(sql: string): Promise<string[][]> {
  return new Promise((resolve,reject) => {
    const env = process.env;
    if (!env["DB_USER"] || env["DB_PASSWORD"] === undefined) {
      reject(new Error("Conexao MariaDB indisponivel.")); return;
    }
    const child = spawn("mysql", [
      "--host",env["DB_HOST"] || "127.0.0.1",
      "--port",env["DB_PORT"] || "3306",
      "--user",env["DB_USER"],
      "--database","TESTE_DISPARO",
      "--default-character-set=utf8mb4",
      "--batch","--raw","--skip-column-names"
    ], {env:{...env,MYSQL_PWD:env["DB_PASSWORD"]},stdio:["pipe","pipe","pipe"]});
    let output="";
    let complete=false;
    const done=(error?:Error) => {
      if(complete)return;
      complete=true; clearTimeout(watchdog);
      if(error)reject(error);
      else resolve(output.trim() ? output.trim().split("\n").map(line=>line.split("\t")) : []);
    };
    const watchdog=setTimeout(()=>{child.kill("SIGKILL");done(new Error("Tempo limite da consulta."));},6000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data",chunk=>{output+=chunk;if(output.length>400000){child.kill("SIGKILL");done(new Error("Consulta excedeu limite."));}});
    child.stderr.on("data",()=>{});
    child.on("error",()=>done(new Error("Cliente MariaDB indisponivel.")));
    child.on("close",code=>code===0?done():done(new Error("Erro na consulta da empresa.")));
    child.stdin.on("error",()=>{});
    child.stdin.end(sql+"\n");
  });
}
function dec(value?:string):string {
  try{return Buffer.from(value||"","hex").toString("utf8").trim();}catch{return "";}
}
function clean(value:string):string|null {
  const v=value.trim();return v&&v!=="NULL"?v:null;
}
function cnpj(value:string):string|null {
  const digits=value.replace(/\D/g,"");
  if(!/^\d{14}$/.test(digits)||/^(\d)\1{13}$/.test(digits))return null;
  return digits;
}
function formatCnpj(value:string):string {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,"$1.$2.$3/$4-$5");
}
function identity(email:string):string {
  return Buffer.from(email,"utf8").toString("hex").toUpperCase();
}

export async function getDisparoCompanyDetailsDB(rawEmail:string,campaignId?:string):Promise<CompanyDetails> {
  const user = requireDisparoUser();
  if(!["Desenvolvedor","Diretoria","Gerência"].includes(user.role))
    throw new Error("Acesso nao autorizado.");
  const email=safeEmail(rawEmail);
  const key=identity(email);
  // Impede transformar o endpoint numa ferramenta para consultar qualquer empresa.
  // DIGITALE_DEMO_COMPANY_AUTH_V1
  // Mantem o login e as permissoes existentes.
  // No DEMO, comprova a participacao real na campanha,
  // sem exigir abertura real para eventos simulados.
  const isDemo =
    campaignId === "cdd61ff9-2273-4b87-9eac-af7d1ce731fc";

  const allowed=await query(isDemo ? `
    SELECT 1
    FROM TESTE_DISPARO.disparo_campaign_recipients r
    WHERE BINARY r.campaign_id =
      BINARY 'cdd61ff9-2273-4b87-9eac-af7d1ce731fc'
      AND HEX(LOWER(TRIM(r.recipient_email)))='${key}'
    LIMIT 1;
  ` : `
    SELECT 1 FROM TESTE_DISPARO.disparo_email_events e
    INNER JOIN TESTE_DISPARO.disparo_email_attempts a ON BINARY a.id=BINARY e.attempt_id
    INNER JOIN TESTE_DISPARO.disparo_campaign_recipients r
       ON BINARY r.attempt_id=BINARY a.id AND BINARY r.campaign_id=BINARY a.campaign_id
    WHERE e.event_type='open'
      AND a.status='accepted' AND a.send_kind='campaign'
      AND r.delivery_status='accepted' AND r.sent_at IS NOT NULL
      AND HEX(LOWER(TRIM(r.recipient_email)))='${key}'
    LIMIT 1;
  `);
  if(!allowed.length)throw new Error("Destinatario sem abertura registrada.");
  const records:RecordEntry[]=[];
  const ia=await query(`
    SELECT HEX(COALESCE(c.cnpj,'')),HEX(COALESCE(c.company,'')),
           HEX(COALESCE(p.phone,'')),HEX(COALESCE(p.company, ''))
    FROM portal_digitale.prospecting_email_contacts c
    LEFT JOIN portal_digitale.prospecting_auto_candidates p
      ON BINARY p.id=BINARY c.candidate_id
    WHERE HEX(LOWER(TRIM(c.email)))='${key}' LIMIT 50;
  `).catch(()=>[] as string[][]);
  for(const row of ia){
    records.push({cnpj:cnpj(dec(row[0])),tradeName:clean(dec(row[1]))||clean(dec(row[3])),
      legalName:null,phone:clean(dec(row[2])),website:null,source:"IA Digitale"});
  }
  // Se a IA vinculou o email a um unico CNPJ, permite completar a ficha no
  // Portal pelo proprio CNPJ, mesmo que o email de contato da empresa seja outro.
  const iaIds=[...new Set(records.map(r=>r.cnpj).filter((v):v is string=>Boolean(v)))];
  const byCnpj=iaIds.length===1
    ? ` OR REPLACE(REPLACE(REPLACE(COALESCE(o.cnpj,''),'.',''),'/',''),'-','')='${iaIds[0]}'`
    : "";
  const portal=await query(`
    SELECT HEX(COALESCE(o.cnpj,'')),HEX(COALESCE(o.name, '')),
           HEX(COALESCE(o.legal_name, '')),HEX(COALESCE(o.phone, '')),HEX(COALESCE(o.website, ''))
    FROM portal_digitale.crm_people p
    JOIN portal_digitale.crm_organizations o
      ON BINARY o.id=BINARY p.organization_id
    WHERE HEX(LOWER(TRIM(p.email)))='${key}'
    UNION ALL
    SELECT HEX(COALESCE(o.cnpj,'')),HEX(COALESCE(o.name, '')),
           HEX(COALESCE(o.legal_name, '')),HEX(COALESCE(o.phone, '')),HEX(COALESCE(o.website, ''))
    FROM portal_digitale.crm_organizations o
    WHERE HEX(LOWER(TRIM(o.email)))='${key}' ${byCnpj}
    LIMIT 50;
  `).catch(()=>[] as string[][]);
  for(const row of portal){
    records.push({cnpj:cnpj(dec(row[0])),tradeName:clean(dec(row[1])),
      legalName:clean(dec(row[2])),phone:clean(dec(row[3])),website:clean(dec(row[4])),source:"Portal/Agendor"});
  }
  const ids=[...new Set(records.map(r=>r.cnpj).filter((v):v is string=>Boolean(v)))];
  const conflict=ids.length>1;
  // Nao mistura razao social/telefone de empresas com CNPJ divergente.
  const selected=conflict?[]:records.filter(r=>!ids.length || !r.cnpj || r.cnpj===ids[0]);
  // Priorizar dados do mesmo CNPJ, depois nomes/telefones ausentes da IA.
  const company=ids.length===1 ? ids[0] : null;
  const details=selected.filter(r=>!company || r.cnpj===company);
  const fallback=details.length?details:selected;
  return {
    email,
    cnpj:company?formatCnpj(company):null,
    tradeName:fallback.find(r=>r.tradeName)?.tradeName ?? null,
    legalName:fallback.find(r=>r.legalName)?.legalName ?? null,
    phone:fallback.find(r=>r.phone)?.phone ?? null,
    website:fallback.find(r=>r.website)?.website ?? null,
    sources:[...new Set(fallback.map(r=>r.source))],
    conflict
  };
}
