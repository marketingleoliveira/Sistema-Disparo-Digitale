
import { createServerFn } from "@tanstack/react-start";

export const listPdfCampaigns=createServerFn({method:"GET"})
  .handler(async()=>{
    const {listPdfCampaignsDB}=
      await import("./disparo-open-pdf.server");
    return listPdfCampaignsDB();
  });

export const exportOpenPdf=createServerFn({method:"POST"})
  .inputValidator((data:{
    campaignId:string;
    startDate:string;
    endDate:string;
  })=>data)
  .handler(async({data})=>{
    const {createOpenPdfDB}=
      await import("./disparo-open-pdf.server");
    return createOpenPdfDB(data);
  });
