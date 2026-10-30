import { createServerFn } from "@tanstack/react-start";

type Input = {
  campaignIds: string[];
  startDate: string;
  endDate: string;
};

export const exportMultiOpenXlsx =
  createServerFn({ method: "POST" })
    .validator((data: Input) => data)
    .handler(async ({ data }) => {
      const { createMultiOpenXlsxDB } =
        await import("./disparo-multi-open-xlsx.server");

      return createMultiOpenXlsxDB(data);
    });
