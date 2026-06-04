import type { SubscriptionStatus } from "@/types";

export const SUBSCRIPTION_PRICING_LINES = [
  "Gratis: 2 publicaciones",
  "Pack: +3 publicaciones por $990",
  "PRO: publicaciones ilimitadas por $4.990/mes",
] as const;

export function subscriptionPlanLabel(planType: string): string {
  switch (planType) {
    case "pack":
      return "Pack +3";
    case "pro":
      return "PRO";
    default:
      return "Gratis";
  }
}

export function isProSubscription(subscription: SubscriptionStatus): boolean {
  return subscription.plan_type === "pro";
}

export function isListingLimitReached(subscription: SubscriptionStatus): boolean {
  return subscription.remaining_slots === 0;
}

export function formatListingLimit(limit: number | null): string {
  if (limit == null) return "Ilimitado";
  return String(limit);
}

export function formatRemainingSlots(slots: number | null): string {
  if (slots == null) return "Ilimitados";
  return String(slots);
}

export function formatSellUsageText(subscription: SubscriptionStatus): string {
  if (isProSubscription(subscription)) {
    return "Publicaciones ilimitadas";
  }
  const limit = subscription.listing_limit ?? "—";
  return `${subscription.active_listings} / ${limit} publicaciones usadas`;
}
