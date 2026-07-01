"use client";

import Link from "next/link";
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
        <p className="text-center text-sm text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  return (
    <main
      data-testid="notifications-page"
      className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <Link
        href="/"
        className="text-sm font-medium text-muted-foreground transition hover:text-accent"
      >
        ← Volver al catálogo
      </Link>

      <header className="mb-6 mt-4">
        <p className="editorial-label text-accent">Actividad Melómanos</p>
        <h1
          data-testid="notifications-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground"
        >
          Notificaciones
        </h1>
        {unreadCount > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{unreadCount} sin leer</p>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="p-4">
            <NotificationEmptyState />
          </div>
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
