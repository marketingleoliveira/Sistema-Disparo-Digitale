
import { PDFDocument } from "pdf-lib";
import {
  createOpenPdfDB,
  listPdfCampaignsDB
} from "./disparo-open-pdf.server";

type Request = {
  campaignIds: string[];
  startDate: string;
  endDate: string;
};

export async function createMultiOpenPdfDB(input:Request) {
  if(!Array.isArray(input.campaignIds))
    throw new Error("Campanhas invalidas.");

  const ids=[...new Set(input.campaignIds)];

  if(ids.length<1 || ids.length>5)
    throw new Error("Selecione entre 1 e 5 campanhas.");

  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
     !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate) ||
     input.startDate>input.endDate)
    throw new Error("Periodo invalido.");

  // A listagem valida as permissoes atuais.
  const available=listPdfCampaignsDB();
  const valid=new Set(available.map(c=>c.id));

  if(ids.some(id=>!valid.has(id)))
    throw new Error("Campanha nao encontrada ou indisponivel.");

  const merged=await PDFDocument.create();

  merged.setTitle(
    "Disparo Digitale - Relatorio de Multiplas Campanhas"
  );
  merged.setCreator("Disparo Digitale");

  let total=0;

  for(const campaignId of ids){
    // Reutiliza autenticacao, consulta, enriquecimento
    // comercial e geracao PDF ja existentes.
    const result=await createOpenPdfDB({
      campaignId,
      startDate:input.startDate,
      endDate:input.endDate
    });

    total+=result.total;

    // Limite global para evitar exportacoes excessivas.
    if(total>600)
      throw new Error(
        "Mais de 600 destinatarios no total. " +
        "Selecione menos campanhas ou reduza o periodo."
      );

    const source=await PDFDocument.load(
      Buffer.from(result.content,"base64")
    );

    // Cada campanha inicia em uma nova pagina,
    // mantendo seu proprio cabecalho e tabela.
    const pages=await merged.copyPages(
      source,source.getPageIndices()
    );

    for(const page of pages){
      merged.addPage(page);
    }
  }

  const bytes=await merged.save();

  return {
    filename:
      "disparo-multicampanhas-"+
      input.startDate+"-"+input.endDate+".pdf",
    content:Buffer.from(bytes).toString("base64"),
    campaigns:ids.length,
    total
  };
}
