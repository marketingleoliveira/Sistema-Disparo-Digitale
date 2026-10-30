import { createServerFn } from "@tanstack/react-start";

export const getClickEngagementRanking =
  createServerFn({ method: "GET" })
    .handler(async () => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");

      await requireDisparoUser();

      const { listClickEngagementRankingDB } =
        await import("./disparo-click-ranking.server");

      return listClickEngagementRankingDB();
    });
