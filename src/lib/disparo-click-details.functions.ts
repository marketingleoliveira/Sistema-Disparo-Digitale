import { createServerFn } from "@tanstack/react-start";

export const getClickContactDetails =
  createServerFn({ method: "GET" })
    .inputValidator((input: {
      email: string;
      offset: number;
    }) => {
      const email = String(input?.email ?? "")
        .trim()
        .toLowerCase();

      const offset = Number(input?.offset ?? 0);

      if (
        email.length > 320 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !Number.isSafeInteger(offset) ||
        offset < 0
      ) {
        throw new Error("Consulta invalida.");
      }

      return {email, offset};
    })
    .handler(async ({data}) => {
      const {requireDisparoUser} =
        await import("./disparo-auth.server");

      await requireDisparoUser();

      const {getClickDetailsDB} =
        await import("./disparo-click-details.server");

      try {
        return getClickDetailsDB(data.email, data.offset);
      } catch (error) {
        console.error(
          "[DIGITALE_CLICK_DETAILS_ERROR]",
          error instanceof Error ? error.message : String(error)
        );
        throw new Error("Falha ao consultar historico de cliques.");
      }
    });
