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
            unread ? "font-semibold text-white" : "font-medium text-zinc-300"
          }`}
        >
          {notification.title}
        </p>
        {unread && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400"
            aria-hidden
          />
        )}
      </div>
      {notification.body && (
        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{notification.body}</p>
      )}
      {timeLabel && (
        <p className="mt-1.5 font-mono text-[10px] text-zinc-500">{timeLabel}</p>
      )}
    </>
  );

  return (
    <div
      data-testid="notification-item"
      className={`border-b border-white/5 px-3 py-3 last:border-b-0 ${
        unread ? "bg-violet-950/20" : "bg-transparent"
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
            className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-violet-400/40 hover:text-white disabled:opacity-50"
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
  return (
    <p
      className={`text-center text-zinc-400 ${compact ? "px-4 py-8 text-sm" : "py-12 text-base"}`}
    >
      No tienes notificaciones.
    </p>
  );
}

export function NotificationListFooter() {
  return (
    <div className="border-t border-white/10 px-3 py-2 text-center">
      <Link
        href="/notifications"
        className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
      >
        Ver todas
      </Link>
    </div>
  );
}
