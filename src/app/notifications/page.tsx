"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationItem, { NotificationEmptyState } from "@/components/NotificationItem";
import {
  getNotifications,
  getMe,
  getToken,
  markNotificationRead,
  setStoredUser,
} from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { dispatchNotificationsUpdated } from "@/lib/notifications";
import type { Notification, User } from "@/types";

export default function NotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications({ limit: 50 });
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch (err) {
      if (handleAuthRedirect(err, router, pathname)) return;
      setError("No se pudieron cargar las notificaciones.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }

    getMe()
      .then((me) => {
        setStoredUser(me);
        setUser(me);
        return loadNotifications();
      })
      .catch((err) => {
        if (handleAuthRedirect(err, router, pathname)) return;
        setError("Sesión no válida.");
      });
  }, [loadNotifications, router, pathname]);

  async function handleMarkRead(notificationId: number) {
    setMarkingId(notificationId);
    try {
      const updated = await markNotificationRead(notificationId);
      setItems((prev) =>
        prev.map((n) => (n.id === notificationId ? updated : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      dispatchNotificationsUpdated();
    } catch {
      setError("No se pudo marcar como leída.");
    } finally {
      setMarkingId(null);
    }
  }

  if (!user && !error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-center text-zinc-400">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
        {unreadCount > 0 && (
          <p className="mt-1 text-sm text-zinc-400">
            {unreadCount} sin leer
          </p>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        {loading ? (
          <p className="py-12 text-center text-zinc-400">Cargando…</p>
        ) : items.length === 0 ? (
          <NotificationEmptyState />
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
    </main>
  );
}
