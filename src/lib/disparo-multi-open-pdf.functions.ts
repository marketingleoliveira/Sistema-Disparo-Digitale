
import { createServerFn } from "@tanstack/react-start";

export const exportMultiOpenPdf =
  createServerFn({method:"POST"})
    .inputValidator((data:{
      campaignIds:string[];
      startDate:string;
      endDate:string;
    })=>data)
    .handler(async({data})=>{
      const {createMultiOpenPdfDB}=
        await import("./disparo-multi-open-pdf.server");
      return createMultiOpenPdfDB(data);
    });
