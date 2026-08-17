import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const checkSchema = z.object({
  domain: z.string().min(3).max(253),
  token: z.string().min(1).max(200),
  dkimSelector: z.string().min(1).max(63),
  spfInclude: z.string().min(1).max(400),
});

export const checkDomainDns = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkSchema.parse(data))
  .handler(async ({ data }) => {
    const { runDomainChecks } = await import("./domain/verify.server");
    return runDomainChecks(data);
  });