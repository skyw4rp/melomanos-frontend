import {
  formatListingLimit,
  formatRemainingSlots,
  formatSellUsageText,
  isListingLimitReached,
  SUBSCRIPTION_PRICING_LINES,
  subscriptionPlanLabel,
} from "@/lib/subscription";
import type { SubscriptionStatus } from "@/types";

interface SubscriptionCardProps {
  subscription: SubscriptionStatus;
  variant: "profile" | "sell";
}

const statCellClass =
  "rounded-xl border border-border bg-surface-muted/40 p-4 shadow-sm";

export default function SubscriptionCard({
  subscription,
  variant,
}: SubscriptionCardProps) {
  const planLabel = subscriptionPlanLabel(subscription.plan_type);
  const atLimit = isListingLimitReached(subscription);

  if (variant === "profile") {
    return (
      <section
        data-testid="profile-subscription-card"
        className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Tu plan
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Plan y publicaciones</p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={statCellClass}>
            <dt className="text-xs font-medium text-muted-foreground">Plan actual</dt>
            <dd
              data-testid="profile-subscription-plan"
              className="mt-2 text-xl font-bold text-foreground"
            >
              {planLabel}
            </dd>
          </div>
          <div className={statCellClass}>
            <dt className="text-xs font-medium text-muted-foreground">
              Publicaciones activas
            </dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-foreground">
              {subscription.active_listings}
            </dd>
          </div>
          <div className={statCellClass}>
            <dt className="text-xs font-medium text-muted-foreground">Límite</dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-foreground">
              {formatListingLimit(subscription.listing_limit)}
            </dd>
          </div>
          <div className={statCellClass}>
            <dt className="text-xs font-medium text-muted-foreground">
              Cupos restantes
            </dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-foreground">
              {formatRemainingSlots(subscription.remaining_slots)}
            </dd>
          </div>
        </dl>

        <ul className="mt-6 space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
          {SUBSCRIPTION_PRICING_LINES.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      data-testid="sell-subscription-card"
      className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Tu plan
      </p>
      <p
        data-testid="sell-subscription-usage"
        className="mt-2 text-lg font-semibold text-foreground"
      >
        {formatSellUsageText(subscription)}
      </p>
      <p className="mt-1 text-sm text-accent">{planLabel}</p>

      {atLimit && (
        <div
          data-testid="sell-limit-reached"
          className="mt-4 rounded-xl border border-amber-600/25 bg-amber-600/10 px-4 py-4"
        >
          <p className="text-sm font-medium text-amber-900">
            Has alcanzado el límite de publicaciones de tu plan.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              data-testid="sell-upgrade-pack"
              className="btn-ghost bg-surface text-sm"
            >
              Comprar Pack +3 — $990
            </button>
            <button
              type="button"
              data-testid="sell-upgrade-pro"
              className="btn-primary text-sm"
            >
              Actualizar a PRO — $4.990/mes
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
