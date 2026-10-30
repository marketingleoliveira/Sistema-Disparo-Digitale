import { createServerFn } from "@tanstack/react-start";

export const getDisparoFolders = createServerFn({
  method: "GET"
}).handler(async () => {
  const { listDisparoFoldersDB } =
    await import("./disparo-lists.server");

  return listDisparoFoldersDB();
});

export const createDisparoFolder = createServerFn({
  method: "POST"
})
.inputValidator(
  (data: { name: string; description: string }) => data
)
.handler(async ({ data }) => {
  const { createDisparoFolderDB } =
    await import("./disparo-lists.server");

  return createDisparoFolderDB(data.name, data.description);
});

export const deleteDisparoFolder = createServerFn({
  method: "POST"
})
.inputValidator((data: { id: string }) => data)
.handler(async ({ data }) => {
  const { deleteDisparoFolderDB } =
    await import("./disparo-lists.server");

  return deleteDisparoFolderDB(data.id);
});
