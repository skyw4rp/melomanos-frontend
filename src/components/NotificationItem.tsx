"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMessageTime } from "@/lib/format";
import {
  isNotificationUnread,
  resolveNotificationHref,
} from "@/lib/notifications";
import type { Notification } from "@/types";

type NotificationItemProps = {
  notification: Notification;
  onMarkRead: (id: number) => void;
  markingId: number | null;
};

export default function NotificationItem({
  notification,
  onMarkRead,
  markingId,
}: NotificationItemProps) {
  const router = useRouter();
  const unread = isNotificationUnread(notification);
  const href = resolveNotificationHref(notification);
  const timeLabel = formatMessageTime(notification.created_at);

  function handleNavigate() {
    if (!href) return;
    if (unread) {
      onMarkRead(notification.id);
    }
    router.push(href);
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-sm leading-snug ${
            unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
          }`}
        >
          {notification.title}
        </p>
        {unread && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent ring-2 ring-accent/20"
            aria-hidden
          />
        )}
      </div>
      {notification.body && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {notification.body}
        </p>
      )}
      {timeLabel && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">{timeLabel}</p>
      )}
    </>
  );

  return (
    <div
      data-testid="notification-item"
      className={`border-b border-border px-3 py-3 last:border-b-0 ${
        unread ? "bg-accent/5" : "bg-transparent"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {href ? (
            <button
              type="button"
              onClick={handleNavigate}
              className="w-full text-left transition hover:opacity-90"
            >
              {content}
            </button>
          ) : (
            <div>{content}</div>
          )}
        </div>
        {unread && (
          <button
            type="button"
            data-testid="notification-mark-read"
            disabled={markingId === notification.id}
            onClick={() => onMarkRead(notification.id)}
            className="btn-ghost shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-[10px] font-medium text-muted-foreground transition-ui hover:border-accent/40 hover:text-accent disabled:opacity-50"
            title="Marcar como leída"
          >
            Leída
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationEmptyState({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        data-testid="notifications-empty-state"
        className="px-4 py-8 text-center"
      >
        <p className="text-sm font-semibold text-foreground">No tienes notificaciones</p>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Cuando haya actividad en tus compras, ventas o mensajes, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="notifications-empty-state"
      className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-6 py-12 text-center"
    >
      <p className="text-base font-semibold text-foreground">No tienes notificaciones</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Cuando haya actividad en tus compras, ventas o mensajes, aparecerá aquí.
      </p>
    </div>
  );
}

export function NotificationListFooter() {
  return (
    <div className="border-t border-border bg-surface-muted/30 px-3 py-2.5 text-center">
      <Link
        href="/notifications"
        data-testid="notifications-view-all"
        className="text-xs font-semibold text-accent transition hover:text-foreground hover:underline"
      >
        Ver todas
      </Link>
    </div>
  );
}
