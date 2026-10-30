import { createServerFn } from "@tanstack/react-start";

export const getDisparoPerformance = createServerFn({
  method: "GET"
})
.inputValidator((data: { days: number; list: string }) => data)
.handler(async ({ data }) => {
  const { getDisparoPerformanceDB } =
    await import("./disparo-performance.server");

  return getDisparoPerformanceDB(data);
});
