import type { SellerShippingProfile } from "@/types";

export const ALLOWED_COURIERS = [
  "Chilexpress",
  "Blue Express",
  "Starken",
  "CorreosChile",
] as const;

export type AllowedCourier = (typeof ALLOWED_COURIERS)[number];

export function normalizePreferredCouriers(couriers?: string[] | null): string[] {
  if (!Array.isArray(couriers)) return [];
  const allowed = new Set<string>(ALLOWED_COURIERS);
  return couriers.filter((c) => allowed.has(c));
}

/** Hint for seller order tracking form; null when profile is empty. */
export function formatShippingProfileHint(
  profile: SellerShippingProfile | null | undefined,
): string | null {
  if (!profile) return null;

  const parts: string[] = [];
  if (profile.origin_city?.trim()) {
    parts.push(`despacho desde ${profile.origin_city.trim()}`);
  }
  if (profile.dispatch_time_hours != null && profile.dispatch_time_hours > 0) {
    parts.push(`tiempo estimado ${profile.dispatch_time_hours} horas`);
  }

  if (parts.length === 0) return null;
  return `Tu perfil: ${parts.join(", ")}.`;
}
