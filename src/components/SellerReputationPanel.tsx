import TrustBadgePills from "@/components/TrustBadgePills";
import { formatAverageRating, trustLevelLabel } from "@/lib/reputation";
import type { SellerReputation } from "@/types";

interface SellerReputationPanelProps {
  reputation: SellerReputation | null;
  loading?: boolean;
  compact?: boolean;
  /** @deprecated Always renders on-system editorial styling; kept for call-site compatibility. */
  editorial?: boolean;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export default function SellerReputationPanel({
  reputation,
  loading = false,
  compact = false,
}: SellerReputationPanelProps) {
  if (loading) {
    return <p className="mt-4 text-sm text-muted-foreground">Cargando reputación…</p>;
  }

  if (!reputation) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">Reputación no disponible.</p>
    );
  }

  const trust = trustLevelLabel(reputation.trust_level);

  return (
    <div className={compact ? "mt-4 border-t border-border pt-4" : ""}>
      <p className="editorial-label">Reputación</p>
      <p className="badge-gold mt-2 inline-block">{trust}</p>

      <dl className="mt-4 space-y-0">
        <StatRow label="Calificación" value={formatAverageRating(reputation.average_rating)} />
        <StatRow label="Reviews" value={reputation.total_reviews} />
        <StatRow label="Ventas completadas" value={reputation.completed_sales} />
        <StatRow label="Intercambios protegidos" value={reputation.protected_trades} />
        {reputation.disputed_orders > 0 && (
          <StatRow label="Disputas" value={reputation.disputed_orders} />
        )}
      </dl>

      <TrustBadgePills badges={reputation.badges} />
    </div>
  );
}
