import { createServerFn } from "@tanstack/react-start";

export const listApprovedLeads = createServerFn({
  method: "GET"
}).handler(async () => {
  const { listApprovedLeadsDB } =
    await import("./approved-leads.server");

  return listApprovedLeadsDB();
});
