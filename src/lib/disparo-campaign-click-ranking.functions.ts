import { createServerFn } from "@tanstack/react-start";

export const getCampaignClickRanking =
  createServerFn({ method: "GET" })
    .handler(async () => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");

      await requireDisparoUser();

      const { listCampaignClickRankingDB } =
        await import("./disparo-campaign-click-ranking.server");

      return listCampaignClickRankingDB();
    });
