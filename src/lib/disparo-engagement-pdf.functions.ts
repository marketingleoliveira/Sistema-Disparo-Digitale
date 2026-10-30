import { createServerFn } from "@tanstack/react-start";

export const exportEngagementPdf =
  createServerFn({ method: "POST" })
    .handler(async () => {
      const { createEngagementPdfDB } =
        await import("./disparo-engagement-pdf.server");

      return createEngagementPdfDB();
    });
