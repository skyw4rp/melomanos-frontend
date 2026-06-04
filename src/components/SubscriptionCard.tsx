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
        className="mt-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#120a1f] to-fuchsia-950/20 p-6 sm:p-8"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
          Plan y publicaciones
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Plan actual
            </dt>
            <dd
              data-testid="profile-subscription-plan"
              className="mt-2 text-xl font-bold text-white"
            >
              {planLabel}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Publicaciones activas
            </dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-white">
              {subscription.active_listings}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Límite
            </dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-white">
              {formatListingLimit(subscription.listing_limit)}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Cupos restantes
            </dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-white">
              {formatRemainingSlots(subscription.remaining_slots)}
            </dd>
          </div>
        </dl>

        <ul className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm text-zinc-400">
          {SUBSCRIPTION_PRICING_LINES.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-violet-400">·</span>
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
      className="mb-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#120a1f] to-fuchsia-950/20 p-5 sm:p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Tu plan
      </p>
      <p
        data-testid="sell-subscription-usage"
        className="mt-2 text-lg font-semibold text-white"
      >
        {formatSellUsageText(subscription)}
      </p>
      <p className="mt-1 text-sm text-violet-200/80">{planLabel}</p>

      {atLimit && (
        <div
          data-testid="sell-limit-reached"
          className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-4"
        >
          <p className="text-sm font-medium text-amber-200">
            Has alcanzado el límite de publicaciones de tu plan.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              data-testid="sell-upgrade-pack"
              className="rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-fuchsia-400/50 hover:bg-violet-500/25"
            >
              Comprar Pack +3 — $990
            </button>
            <button
              type="button"
              data-testid="sell-upgrade-pro"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500"
            >
              Actualizar a PRO — $4.990/mes
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
