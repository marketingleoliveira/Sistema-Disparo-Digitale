import { createServerFn } from "@tanstack/react-start";

export const getEmailAnalytics = createServerFn({
  method: "GET"
})
.inputValidator((input: {
  days: number;
  startDate?: string;
  endDate?: string;
}) => {
  const startDate = String(input?.startDate ?? "").trim();
  const endDate = String(input?.endDate ?? "").trim();

  if (Boolean(startDate) !== Boolean(endDate)) {
    throw new Error(
      "Informe a data inicial e a data final."
    );
  }

  return {
    days: [7, 30, 90].includes(Number(input?.days))
      ? Number(input.days)
      : 30,
    startDate,
    endDate
  };
})
.handler(async ({ data }) => {
  const { getEmailAnalyticsDB } =
    await import("./disparo-email-history.server");

  return getEmailAnalyticsDB(
    data.days,
    data.startDate && data.endDate
      ? {
          startDate: data.startDate,
          endDate: data.endDate
        }
      : undefined
  );
});
