
// DIGITALE_CAMPAIGN_NOTIFICATIONS_V1
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Check, CalendarClock } from "lucide-react";
import {
  listCampaignNotifications,
  markCampaignNotificationRead,
  type CampaignNotification
} from "@/lib/disparo-notifications.functions";

function useNotifications() {
  const list = useServerFn(listCampaignNotifications);
  const mark = useServerFn(markCampaignNotificationRead);
  const [items, setItems] =
    React.useState<CampaignNotification[]>([]);

  const refresh = React.useCallback(async () => {
    try {
      const result = await list();
      setItems(result);
    } catch (error) {
      console.error("Falha ao atualizar notificações", error);
    }
  }, [list]);

  React.useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  const markRead = async (id: number) => {
    try {
      await mark({ data: { id } });
      await refresh();
    } catch (error) {
      console.error("Falha ao marcar como lida", error);
    }
  };

  return { items, markRead, refresh };
}

function timestamp(seconds: number) {
  if (!seconds) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(seconds * 1000));
}


// DIGITALE_DASHBOARD_NOTIFICATIONS_60MIN_V1
const NOTIFICATION_MAX_AGE_MS = 60 * 60 * 1000;

function notificationTimeMs(createdAt: number): number {
  // O servidor já fornece timestamp Unix em segundos.
  return createdAt * 1000;
}

export function CampaignNotificationsFeed() {
  const { items, markRead } = useNotifications();

  const recentItems = items.filter(item => {
    // Notificacoes lidas nao aparecem no Dashboard.
    if (item.read) return false;

    const createdAtMs = notificationTimeMs(item.createdAt);

    if (!Number.isFinite(createdAtMs)) return false;

    const ageMs = Date.now() - createdAtMs;

    return ageMs >= 0 && ageMs < NOTIFICATION_MAX_AGE_MS;
  });

  if (recentItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma notificação de campanha registrada.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {recentItems.slice(0, 12).map(item => (
        <div
          key={item.id}
          className="flex gap-3 rounded-xl border bg-secondary/20 p-4"
        >
          <Bell className="h-5 w-5 shrink-0 text-orange-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {timestamp(item.createdAt)}
            </p>
            {!item.read && (
              <button
                onClick={() => void markRead(item.id)}
                className="mt-2 text-xs font-medium text-orange-600"
              >
                Marcar como lida
              </button>
            )}
          </div>
          {!item.read && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-orange-500"
              title="Não lida"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CampaignNotificationBell() {
  const { items, markRead } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const unread = items.filter(x => !x.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notificações: ${unread} não lidas`}
        onClick={() => setOpen(v => !v)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-orange-500 px-1 text-[10px] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(90vw,360px)] max-h-96 overflow-y-auto rounded-xl border bg-background p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">Notificações</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar notificações"
              className="text-xs text-muted-foreground"
            >
              Fechar
            </button>
          </div>
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhuma notificação.
            </p>
          )}
          {items.slice(0, 15).map(item => (
            <div key={item.id} className="border-t py-3">
              <div className="flex items-start gap-2">
                {item.type === "scheduled" ? (
                  <CalendarClock className="h-4 w-4 shrink-0" />
                ) : (
                  <Bell className="h-4 w-4 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {timestamp(item.createdAt)}
                  </p>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-orange-600"
                    >
                      <Check className="h-3 w-3" />
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
