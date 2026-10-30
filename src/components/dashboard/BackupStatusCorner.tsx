import * as React from "react";
import { getDisparoBackupStatus } from
  "@/lib/disparo-backup-status.functions";

type BackupData = Awaited<ReturnType<typeof getDisparoBackupStatus>>;

const statusLabels: Record<string, string> = {
  atualizado: "Atualizado",
  falha: "Falha",
  atrasado: "Atrasado",
  agendamento_inativo: "Inativo",
  indisponivel: "Indisponível",
};

export function BackupStatusCorner() {
  const [data, setData] = React.useState<BackupData | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const refresh = () => {
      getDisparoBackupStatus()
        .then((result) => {
          if (mounted) setData(result);
        })
        .catch(() => {
          if (mounted) {
            setData({
              status: "indisponivel",
              lastConfirmedAt: null,
              lastConfirmedCommit: null,
              lastCommitIsBackup: false,
              scheduleActive: false,
            });
          }
        });
    };

    refresh();
    const interval = setInterval(refresh, 120000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const status = data?.status ?? "indisponivel";
  const ok = status === "atualizado";

  const date = data?.lastConfirmedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(data.lastConfirmedAt))
    : "Não confirmado";

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-40
                 w-[225px] max-w-[calc(100vw-40px)]
                 rounded-xl border border-border bg-background/95
                 px-3 py-2.5 shadow-md backdrop-blur-sm"
      aria-label="Status do backup automático"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          Backup automático
        </span>
        <span
          className={
            "text-[10px] font-semibold " +
            (ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400")
          }
        >
          {statusLabels[status] ?? "Indisponível"}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Último envio: {date}
      </p>
    </div>
  );
}
