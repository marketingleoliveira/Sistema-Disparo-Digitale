import { createServerFn } from "@tanstack/react-start";

export const getDisparoBackupStatus = createServerFn({
  method: "GET",
}).handler(async () => {
  const { readDisparoBackupStatus } = await import(
    "./disparo-backup-status.server"
  );
  return readDisparoBackupStatus();
});
