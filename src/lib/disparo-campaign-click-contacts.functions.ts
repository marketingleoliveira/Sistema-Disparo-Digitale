import { createServerFn } from "@tanstack/react-start";

type Input = {
  campaignId: string;
  period: "geral" | "d7" | "d30" | "d90" | "m12";
};

export const getCampaignClickContacts =
  createServerFn({ method: "GET" })
    .inputValidator((data: Input) => data)
    .handler(async ({ data }) => {
      const { requireDisparoUser } =
        await import("./disparo-auth.server");

      const user = await requireDisparoUser();

      const canSeeCnpj = [
        "Desenvolvedor",
        "Diretoria",
        "Gerência"
      ].includes(user.role);

      const { listCampaignClickContactsDB } =
        await import("./disparo-campaign-click-contacts.server");

      return listCampaignClickContactsDB(
        data.campaignId,
        data.period,
        canSeeCnpj
      );
    });
