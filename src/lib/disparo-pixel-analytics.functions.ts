import { createServerFn } from "@tanstack/react-start";

export const getPixelTrackingSummary = createServerFn({method: "GET"})
  .handler(async () => {
    const { getPixelTrackingSummaryDB } =
      await import("./disparo-pixel-analytics.server");
    return getPixelTrackingSummaryDB();
  });
