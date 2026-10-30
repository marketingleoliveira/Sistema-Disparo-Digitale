import { createServerFn } from "@tanstack/react-start";

type Input = {
  period: "geral" | "d7" | "d30" | "d90" | "m12";
};

export const exportCampaignRankingPdf =
  createServerFn({ method: "POST" })
    .validator((data: Input) => data)
    .handler(async ({ data }) => {
      const { createCampaignRankingPdfDB } =
        await import("./disparo-campaign-ranking-pdf.server");

      return createCampaignRankingPdfDB(data.period);
    });
