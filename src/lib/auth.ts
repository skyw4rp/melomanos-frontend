import type { User } from "@/types";

export function getUserDisplayName(user: User): string {
  const name = user.name?.trim() || user.full_name?.trim();
  if (name) return name;
  return user.email;
}

export function formatProfileName(user: User): string {
  const raw = getUserDisplayName(user);
  const base = raw.includes("@") ? raw.split("@")[0] : raw;
  if (!base) return "Collector";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function getUserInitials(user: User): string {
  const name = formatProfileName(user);
  return name.charAt(0).toUpperCase();
}

export function getSessionBadgeText(user: User): string {
  const name = user.name?.trim() || user.full_name?.trim();
  if (name) return `Logged in as ${name}`;
  return `Sesión: ${user.email}`;
}

export function isOwnListing(
  listing: { seller_id?: number },
  user: User | null,
): boolean {
  if (!user || listing.seller_id == null) return false;
  return listing.seller_id === user.id;
}
