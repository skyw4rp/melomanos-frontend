import type { Notification } from "@/types";

export const NOTIFICATIONS_UPDATED_EVENT = "melomanos:notifications-updated";

export function dispatchNotificationsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export function isNotificationUnread(notification: Notification): boolean {
  return notification.read_at == null;
}

/** Cap badge display for large unread counts. */
export function formatUnreadBadge(count: number): string {
  if (count <= 0) return "0";
  if (count > 9) return "9+";
  return String(count);
}

export function resolveNotificationHref(notification: Notification): string | null {
  if (notification.entity_type === "message") return "/messages";
  if (notification.entity_type === "order" && notification.entity_id != null) {
    return `/orders/${notification.entity_id}`;
  }
  return null;
}
