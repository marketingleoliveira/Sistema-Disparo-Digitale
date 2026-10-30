import { createServerFn } from "@tanstack/react-start";

export const listDisparoAutomations = createServerFn({
  method: "GET",
}).handler(async () => {
  const { listDisparoAutomationsDB } =
    await import("./disparo-automations.server");

  return listDisparoAutomationsDB();
});

export const saveDisparoAutomationDraft = createServerFn({
  method: "POST",
})
.inputValidator((input: {
  id: string;
  configuration: unknown;
}) => {
  if (
    !input ||
    typeof input.id !== "string" ||
    ![
      "digitale-newsletter",
      "digitale-clientes",
      "digitale-interesse",
    ].includes(input.id)
  ) {
    throw new Error("Identificador de automacao invalido.");
  }

  if (
    !input.configuration ||
    typeof input.configuration !== "object" ||
    Array.isArray(input.configuration)
  ) {
    throw new Error("Configuracao de rascunho invalida.");
  }

  return input;
})
.handler(async ({ data }) => {
  const { saveDisparoAutomationDraftDB } =
    await import("./disparo-automations.server");

  return saveDisparoAutomationDraftDB(data);
});
