import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { currentUser } from "./disparo-auth.server";

const exec = promisify(execFile);

const STATUS_FILE =
  "/var/lib/disparo-github-backup/status.json";

const REPOSITORY =
  "marketingleoliveira/Sistema-Disparo-Digitale";

type BackupRecord = {
  repository?: string;
  lastAttemptAt?: string | null;
  lastRunSuccessful?: boolean;
  lastSuccessAt?: string | null;
  commit?: string | null;
  error?: string | null;
};

async function timerActive(): Promise<boolean> {
  try {
    const { stdout } = await exec(
      "systemctl",
      ["is-active", "backup-disparo-github.timer"],
      { timeout: 5000 }
    );

    return stdout.trim() === "active";
  } catch {
    return false;
  }
}

export async function readDisparoBackupStatus() {
  const user = currentUser();

  if (
    !user ||
    ![
      "marketing@digitaletextil.com.br",
      "marketing2@digitaletextil.com.br",
    ].includes(user.email.trim().toLowerCase())
  ) {
    throw new Error("Acesso administrativo necessario");
  }

  const scheduleActive = await timerActive();

  try {
    const raw = await readFile(STATUS_FILE, "utf8");
    const data = JSON.parse(raw) as BackupRecord;

    if (data.repository !== REPOSITORY) {
      throw new Error("Repositorio inesperado");
    }

    const validCommit =
      typeof data.commit === "string" &&
      /^[a-f0-9]{40}$/i.test(data.commit);

    const validDate =
      typeof data.lastSuccessAt === "string" &&
      !Number.isNaN(Date.parse(data.lastSuccessAt));

    const confirmed = validCommit && validDate;

    let status:
      | "atualizado"
      | "falha"
      | "atrasado"
      | "agendamento_inativo";

    if (data.lastRunSuccessful === false) {
      status = "falha";
    } else if (!scheduleActive) {
      status = "agendamento_inativo";
    } else if (!confirmed) {
      status = "atrasado";
    } else {
      status = "atualizado";
    }

    return {
      status,
      lastConfirmedAt: confirmed
        ? data.lastSuccessAt!
        : null,
      lastConfirmedCommit: confirmed
        ? data.commit!.slice(0, 12)
        : null,
      lastCommitIsBackup: confirmed,
      scheduleActive,
    };

  } catch {
    return {
      status: "indisponivel" as const,
      lastConfirmedAt: null,
      lastConfirmedCommit: null,
      lastCommitIsBackup: false,
      scheduleActive,
    };
  }
}
