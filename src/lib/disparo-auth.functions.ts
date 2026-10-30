import { createServerFn } from "@tanstack/react-start";

export const loginDisparo = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => ({
    email: String(input?.email ?? ""),
    password: String(input?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    const { loginUser } = await import("./disparo-auth.server");
    return loginUser(data.email, data.password);
  });

export const getDisparoSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const { currentUser } = await import("./disparo-auth.server");
    return currentUser();
  });

export const logoutDisparo = createServerFn({ method: "POST" })
  .handler(async () => {
    const { logoutUser } = await import("./disparo-auth.server");
    logoutUser();
    return { success: true };
  });
