import { createServerFn } from "@tanstack/react-start";

export const uploadDisparoAutomationPdf = createServerFn({
  method: "POST",
})
  .inputValidator((data: {
    automationId: string;
    slotId: string;
    fileName: string;
    pdfBase64: string;
  }) => {
    if (!data || typeof data !== "object") {
      throw new Error("Upload invalido.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { saveAutomationPdf } =
      await import("./disparo-automation-pdfs.server");

    return saveAutomationPdf(data);
  });

export const listDisparoAutomationPdfs = createServerFn({
  method: "GET",
})
  .inputValidator((data: { automationId: string }) => {
    if (!data || typeof data.automationId !== "string") {
      throw new Error("Automacao invalida.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { listAutomationPdfs } =
      await import("./disparo-automation-pdfs.server");

    return listAutomationPdfs(data.automationId);
  });

export const downloadDisparoAutomationPdf = createServerFn({
  method: "POST",
})
  .inputValidator((data: {
    automationId: string;
    slotId: string;
  }) => {
    if (!data || typeof data !== "object") {
      throw new Error("Arquivo invalido.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { getAutomationPdf } =
      await import("./disparo-automation-pdfs.server");

    return getAutomationPdf(data);
  });
