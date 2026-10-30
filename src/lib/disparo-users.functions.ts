import { createServerFn } from "@tanstack/react-start";
import {
  createDisparoUserInDB,
  listDisparoUsersInDB
} from "./disparo-users.server";

export const createDisparoUser = createServerFn({
  method: "POST"
})
  .inputValidator((data: {
    email: string;
    password: string;
    role: string;
  }) => ({
    email: String(data?.email ?? ""),
    password: String(data?.password ?? ""),
    role: String(data?.role ?? "")
  }))
  .handler(async ({ data }) => createDisparoUserInDB(data));

export const listDisparoUsers = createServerFn({
  method: "GET"
})
  .handler(async () => listDisparoUsersInDB());


import { updateDisparoUserInDB, deleteDisparoUserInDB } from "./disparo-users.server";

export const updateDisparoUser = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; name: string; email: string; role: string; active: boolean }) => ({
    id: String(data?.id ?? ""), name: String(data?.name ?? ""),
    email: String(data?.email ?? ""), role: String(data?.role ?? ""), active: data?.active === true,
  }))
  .handler(async ({ data }) => updateDisparoUserInDB(data));

export const deleteDisparoUser = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => deleteDisparoUserInDB(data.id));
