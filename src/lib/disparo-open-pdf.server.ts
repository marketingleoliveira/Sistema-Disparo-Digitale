
import { spawnSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireDisparoUser } from "./disparo-auth.server";
import { getDisparoCompanyDetailsDB } from "./disparo-company-details.server";

type Request = {
  campaignId: string;
  startDate: string;
  endDate: string;
};

function authorize() {
  const user = requireDisparoUser();
  if (!["Desenvolvedor","Diretoria","Gerência"].includes(user.role)) {
    throw new Error("Acesso nao autorizado.");
  }
}

function db(sql:string):string[][] {
  const env = process.env;
  if (env.DB_NAME !== "TESTE_DISPARO" ||
      !env.DB_USER || env.DB_PASSWORD === undefined) {
    throw new Error("MariaDB nao configurado.");
  }
  const r = spawnSync("mysql",[
    "--host",env.DB_HOST||"127.0.0.1",
    "--port",env.DB_PORT||"3306",
    "--user",env.DB_USER,
    "--database","TESTE_DISPARO",
    "--default-character-set=utf8mb4",
    "--batch","--raw","--skip-column-names"
  ],{
    input:sql+";\n",encoding:"utf8",
    timeout:20000,maxBuffer:8*1024*1024,
    env:{...env,MYSQL_PWD:env.DB_PASSWORD}
  });
  if(r.error||r.status!==0) {
    throw new Error("Consulta MariaDB indisponivel.");
  }
  const output=r.stdout.trim();
  return output?output.split("\n").map(x=>x.split("\t")):[];
}

function dec(hex?:string):string {
  if(!hex||hex==="NULL")return "";
  if(!/^(?:[0-9a-f]{2})*$/i.test(hex))
    throw new Error("Dados invalidos.");
  return Buffer.from(hex,"hex").toString("utf8");
}

function dateUTC(value:string,nextDay=false):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Data invalida.");
  const [y,m,d]=value.split("-").map(Number);
  const day=new Date(Date.UTC(y,m-1,d));
  if(day.toISOString().slice(0,10)!==value)
    throw new Error("Data inexistente.");
  // Periodo civil de Brasilia (UTC-3).
  const ms=day.getTime()+3*3600000+
    (nextDay?86400000:0);
  return new Date(ms).toISOString().slice(0,19)
    .replace("T"," ");
}

function text(value:unknown):string {
  return String(value??"Nao informado")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\x20-\x7e]/g,"?");
}

export function listPdfCampaignsDB() {
  authorize();
  return db(`
    SELECT HEX(id),HEX(name)
    FROM disparo_campaigns
    WHERE archived_at IS NULL
    ORDER BY created_at DESC
    LIMIT 2000
  `).map(r=>({id:r[0],name:dec(r[1])}));
}

export async function createOpenPdfDB(input:Request) {
  authorize();

  const {campaignId,startDate,endDate}=input;
  if(!/^[0-9A-F]{2,256}$/i.test(campaignId) ||
     campaignId.length%2!==0)
    throw new Error("Campanha invalida.");

  if(startDate>endDate)
    throw new Error("Periodo invalido.");

  const first=dateUTC(startDate);
  const last=dateUTC(endDate,true);

  const campaign=db(`
    SELECT HEX(name)
    FROM disparo_campaigns
    WHERE HEX(id)='${campaignId.toUpperCase()}'
      AND archived_at IS NULL
    LIMIT 1
  `);
  if(!campaign.length)
    throw new Error("Campanha nao encontrada.");

  const name=dec(campaign[0][0]);

  const rows=db(`
    SELECT
      HEX(LOWER(TRIM(r.recipient_email))),
      DATE_FORMAT(
        MIN(e.occurred_at),'%Y-%m-%d %H:%i:%s'
      )
    FROM disparo_email_events e
    JOIN disparo_email_attempts a
      ON BINARY a.id=BINARY e.attempt_id
    JOIN disparo_campaign_recipients r
      ON BINARY r.attempt_id=BINARY a.id
     AND BINARY r.campaign_id=BINARY a.campaign_id
    WHERE e.event_type='open'
      AND a.status='accepted'
      AND a.send_kind='campaign'
      AND r.delivery_status='accepted'
      AND r.sent_at IS NOT NULL
      AND HEX(r.campaign_id)='${campaignId.toUpperCase()}'
      AND e.occurred_at >= '${first}'
      AND e.occurred_at < '${last}'
    GROUP BY LOWER(TRIM(r.recipient_email))
    ORDER BY MIN(e.occurred_at) DESC
    LIMIT 301
  `);

  if(rows.length>300)
    throw new Error(
      "Mais de 300 destinatarios encontrados. " +
      "Reduza o periodo para gerar um PDF completo."
    );

  const pdf=await PDFDocument.create();
  pdf.setTitle("Relatorio de Aberturas - "+name);
  pdf.setCreator("Disparo Digitale");

  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const W=1190.55,H=841.89;
  const widths=[145,150,205,125,130,210,165];
  const headers=[
    "Nome fantasia","Razao social","E-mail",
    "CNPJ","Telefone","Website","Abertura"
  ];

  let page:any;
  let y=0;
  let number=0;

  function write(str:string,x:number,top:number,
                 size=8,heavy=false,color=rgb(.12,.17,.25)) {
    page.drawText(text(str),{
      x,y:top,size,font:heavy?bold:font,color
    });
  }

  function startPage() {
    page=pdf.addPage([W,H]);
    number++;
    write("DIGITALE TEXTIL",28,H-38,12,true);
    write("RELATORIO DE ABERTURAS",28,H-59,17,true);
    write("Campanha: "+name,28,H-79,10);
    write("Periodo: "+startDate+" a "+endDate,28,H-96,9);
    write("Destinatarios unicos: "+rows.length,28,H-112,9);
    y=H-150;
    page.drawRectangle({
      x:25,y:y-10,width:1140,height:27,
      color:rgb(.92,.94,.97)
    });
    let x=30;
    headers.forEach((h,i)=>{
      write(h,x,y,8,true);
      x+=widths[i];
    });
    y-=28;
  }

  function wrap(value:string,width:number) {
    const raw=text(value||"Nao informado");
    const out:string[]=[];
    const max=width-9;
    let line="";
    for(const ch of raw){
      if(font.widthOfTextAtSize(line+ch,8)>max && line){
        out.push(line);
        line="";
      }
      line+=ch;
    }
    out.push(line);
    return out;
  }

  startPage();

  for(const r of rows){
    const email=dec(r[0]);
    const details=await getDisparoCompanyDetailsDB(email);
    const dt=new Date((r[1]||"").replace(" ","T")+"Z");
    const opened=Number.isNaN(dt.getTime())?(r[1]||""):
      dt.toLocaleString("pt-BR",{
        timeZone:"America/Sao_Paulo"
      });

    const values=[
      details.tradeName,
      details.legalName,
      email,
      details.cnpj,
      details.phone,
      details.website,
      opened
    ].map(v=>v||"Nao informado");

    const cells=values.map((v,i)=>wrap(v,widths[i]));
    const maxLines=Math.max(...cells.map(c=>c.length));
    const height=Math.max(30,maxLines*11+12);

    if(y-height<38)startPage();

    if(number%2===0){
      // Mantem a tabela clean em todas as paginas.
    }

    page.drawRectangle({
      x:25,y:y-height+8,width:1140,height,
      color:rgb(.985,.99,1)
    });

    let x=30;
    cells.forEach((lines,i)=>{
      lines.forEach((line,j)=>{
        write(line,x,y-j*11,8);
      });
      x+=widths[i];
    });

    y-=height+4;
  }

  if(!rows.length){
    write("Nenhuma abertura no periodo selecionado.",30,y-10,10);
  }

  const bytes=await pdf.save();

  return {
    filename:"disparo-aberturas-"+startDate+"-"+endDate+".pdf",
    content:Buffer.from(bytes).toString("base64"),
    total:rows.length
  };
}
