
import { createServerFn } from "@tanstack/react-start";

export const getIaProspectingOpenReport =
  createServerFn({ method: "POST" })
    .inputValidator((input: { listId: string }) => input)
    .handler(async ({ data }) => {
      const { getIaProspectingOpenReportDB } =
        await import("./disparo-open-report.server");

      const baseOpenReport = await getIaProspectingOpenReportDB(data.listId);

      const { enrichOpenReportWithIaCnpj } = await import("./disparo-ia-cnpj.server");

      return await enrichOpenReportWithIaCnpj(baseOpenReport);
    });


export const getIaProspectingOpenCount =
  createServerFn({method:"GET"})
    .handler(async()=>{
      const {getIaProspectingOpenCountDB}=
        await import("./disparo-open-report.server");
      return getIaProspectingOpenCountDB();
    });
