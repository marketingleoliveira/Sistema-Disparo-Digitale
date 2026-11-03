// DIGITALE_COMPANY_DETAILS_MODAL_V1
import { createServerFn } from "@tanstack/react-start";

export const getDisparoCompanyDetails = createServerFn({method:"POST"})
  .inputValidator((data:{email:string;campaignId?:string})=>data)
  .handler(async({data})=>{
    const { getDisparoCompanyDetailsDB } = await import("./disparo-company-details.server");
    return getDisparoCompanyDetailsDB(data.email,data.campaignId);
  });
