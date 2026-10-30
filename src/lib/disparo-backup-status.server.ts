import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { currentUser } from "./disparo-auth.server";

const exec = promisify(execFile);
const PROJECT = "/var/www/TESTE_DISPARO/sistema-disparo";
const REPOSITORY =
  "https://github.com/marketingleoliveira/Sistema-Disparo-Digitale.git";

async function command(program: string, args: string[]) {
  const { stdout } = await exec(program, args, {
    timeout: 8000,
    maxBuffer: 30000,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
    },
  });
  return stdout.trim();
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

  const git = (...args: string[]) =>
    command("git", [
      "-c",
      `safe.directory=${PROJECT}`,
      "-C",
      PROJECT,
      ...args,
    ]);

  try {
    const [local, remoteText, date, message] = await Promise.all([
      git("rev-parse", "HEAD"),
      git("ls-remote", REPOSITORY, "refs/heads/main"),
      git("log", "-1", "--format=%cI"),
      git("log", "-1", "--format=%s"),
    ]);

    const remote = remoteText.split(/\s+/)[0] || "";
    const confirmed = Boolean(remote) && local === remote;

    let scheduleActive = false;
    let lastRunFailed = false;

    try {
      const state = await command(
        "systemctl",
        ["is-active", "backup-disparo-github.timer"],
      );
      scheduleActive = state === "active";
    } catch {
      scheduleActive = false;
    }

    try {
      const details = await command("systemctl", [
        "show",
        "backup-disparo-github.service",
        "--property=Result",
        "--property=ExecMainStartTimestamp",
      ]);

      const result = details.match(/^Result=(.+)$/m)?.[1];

      // 'success' ou sem execucao anterior nao indicam falha.
      lastRunFailed = Boolean(
        result && result !== "success",
      );
    } catch {
      // O status da rotina pode estar indisponivel.
    }

    const status = !confirmed
      ? "atrasado"
      : lastRunFailed
        ? "falha"
        : !scheduleActive
          ? "agendamento_inativo"
          : "atualizado";

    return {
      status,
      lastConfirmedCommit: confirmed ? local.slice(0, 12) : null,
      lastConfirmedAt: confirmed ? date : null,
      lastCommitIsBackup: message.startsWith("Backup automatico VPS"),
      scheduleActive,
    };
  } catch {
    return {
      status: "indisponivel",
      lastConfirmedCommit: null,
      lastConfirmedAt: null,
      lastCommitIsBackup: false,
      scheduleActive: false,
    };
  }
}
