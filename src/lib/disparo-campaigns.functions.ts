import { createServerFn } from "@tanstack/react-start";
import type {
  CampaignWriteInput
} from "./disparo-campaigns.server";

export const listDisparoCampaigns = createServerFn({
  method: "GET"
}).handler(async () => {
  const { listDisparoCampaignsDB } =
    await import("./disparo-campaigns.server");

  return listDisparoCampaignsDB();
});

export const createDisparoCampaign = createServerFn({
  method: "POST"
})
.inputValidator((data: CampaignWriteInput) => data)
.handler(async ({ data }) => {
  const { createDisparoCampaignDB } =
    await import("./disparo-campaigns.server");

  return createDisparoCampaignDB(data);
});

export const deleteDisparoCampaign = createServerFn({
  method: "POST"
})
.inputValidator((data: { id: string }) => data)
.handler(async ({ data }) => {
  const { deleteDisparoCampaignDB } =
    await import("./disparo-campaigns.server");

  await deleteDisparoCampaignDB(data.id);

  return { ok: true };
});

// Acesso ao arquivo e mutacoes protegidas novamente no servidor.
export const listArchivedDisparoCampaigns = createServerFn({method:"GET"}).handler(async () => {
  const {listDisparoCampaignsDB} = await import("./disparo-campaigns.server");
  return listDisparoCampaignsDB(true);
});
export const setDisparoCampaignArchived = createServerFn({method:"POST"})
  .inputValidator((data:{id:string;restore:boolean}) => data)
  .handler(async ({data}) => {
    const {archiveDisparoCampaignDB} = await import("./disparo-campaigns.server");
    await archiveDisparoCampaignDB(data.id, data.restore);
    return {ok:true};
  });
