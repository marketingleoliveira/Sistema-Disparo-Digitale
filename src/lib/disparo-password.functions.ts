import { createServerFn } from "@tanstack/react-start";
import { changeOwnPassword } from "./disparo-password.server";

export const changeDisparoPassword = createServerFn({
  method: "POST"
})
  .inputValidator((data: {
    currentPassword: string;
    newPassword: string;
    confirmation: string;
  }) => ({
    currentPassword: String(data?.currentPassword ?? ""),
    newPassword: String(data?.newPassword ?? ""),
    confirmation: String(data?.confirmation ?? "")
  }))
  .handler(async ({ data }) => {
    return changeOwnPassword(
      data.currentPassword,
      data.newPassword,
      data.confirmation
    );
  });
