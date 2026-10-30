import { createServerFn } from "@tanstack/react-start";

type Input = {
  campaignIds: string[];
  startDate: string;
  endDate: string;
};

export const exportMultiOpenCsv =
  createServerFn({ method: "POST" })
    .validator((data: Input) => data)
    .handler(async ({ data }) => {
      const { createMultiOpenCsvDB } =
        await import("./disparo-multi-open-csv.server");

      return createMultiOpenCsvDB(data);
    });
