"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getNotifications,
  getToken,
  getUnreadNotificationCount,
  markNotificationRead,
} from "@/lib/api";
import {
  dispatchNotificationsUpdated,
  formatUnreadBadge,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications";
import NotificationItem, {
  NotificationEmptyState,
  NotificationListFooter,
} from "@/components/NotificationItem";
import type { Notification } from "@/types";

export default function NotificationBell() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const refreshUnread = useCallback(() => {
    if (!getToken()) {
      setUnreadCount(0);
      return;
    }
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => setUnreadCount(0));
  }, []);

  const loadDropdown = useCallback(async () => {
    if (!getToken()) {
      setItems([]);
      return;
    }
    setLoadingList(true);
    try {
      const data = await getNotifications({ limit: 10 });
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch {
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, pathname]);

  useEffect(() => {
    function onUpdated() {
      refreshUnread();
      if (open) {
        loadDropdown();
      }
    }
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
  }, [open, refreshUnread, loadDropdown]);

  useEffect(() => {
    if (!open) return;
    loadDropdown();
  }, [open, loadDropdown]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function handleMarkRead(notificationId: number) {
    setMarkingId(notificationId);
    try {
      await markNotificationRead(notificationId);
      setItems((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      dispatchNotificationsUpdated();
    } catch {
      // keep UI stable on network errors
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="notifications-bell"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white sm:px-3"
      >
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="text-base leading-none">
            🔔
          </span>
          <span className="hidden sm:inline">Alertas</span>
          {unreadCount > 0 && (
            <span
              data-testid="notifications-unread-count"
              className="min-w-[1.25rem] rounded-full bg-violet-500/30 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-violet-100 ring-1 ring-violet-400/40"
            >
              {formatUnreadBadge(unreadCount)}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          data-testid="notifications-dropdown"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-white/10 bg-[#12101a] shadow-xl shadow-black/40"
        >
          <div className="border-b border-white/10 px-3 py-2.5">
            <h2 className="text-sm font-semibold text-white">Notificaciones</h2>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loadingList ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                Cargando…
              </p>
            ) : items.length === 0 ? (
              <NotificationEmptyState compact />
            ) : (
              items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  markingId={markingId}
                />
              ))
            )}
          </div>

          {items.length > 0 && <NotificationListFooter />}
        </div>
      )}
    </div>
  );
}
