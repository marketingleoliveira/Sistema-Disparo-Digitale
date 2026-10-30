import { createServerFn } from "@tanstack/react-start";

export const listPortalIaLeads = createServerFn({
  method: "GET"
}).handler(async () => {
  const { listPortalIaLeadsDB } =
    await import("./portal-ia-leads.server");

  return listPortalIaLeadsDB();
});
