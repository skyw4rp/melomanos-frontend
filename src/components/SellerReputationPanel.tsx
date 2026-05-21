import { formatAverageRating, trustLevelLabel } from "@/lib/reputation";
import type { SellerReputation } from "@/types";

interface SellerReputationPanelProps {
  reputation: SellerReputation | null;
  loading?: boolean;
  compact?: boolean;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-zinc-200">{value}</dd>
    </div>
  );
}

export default function SellerReputationPanel({
  reputation,
  loading = false,
  compact = false,
}: SellerReputationPanelProps) {
  if (loading) {
    return (
      <p className="mt-4 text-sm text-zinc-500">Cargando reputación…</p>
    );
  }

  if (!reputation) {
    return (
      <p className="mt-4 text-sm text-zinc-500">Reputación no disponible.</p>
    );
  }

  const trust = trustLevelLabel(reputation.trust_level);

  return (
    <div className={compact ? "mt-4 border-t border-white/10 pt-4" : ""}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Reputación
      </p>
      <p className="mt-2 inline-block rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200 ring-1 ring-violet-400/30">
        {trust}
      </p>

      <dl className="mt-4 space-y-0">
        <StatRow label="Calificación" value={formatAverageRating(reputation.average_rating)} />
        <StatRow label="Reviews" value={reputation.total_reviews} />
        <StatRow label="Ventas completadas" value={reputation.completed_sales} />
        <StatRow label="Intercambios protegidos" value={reputation.protected_trades} />
        {reputation.disputed_orders > 0 && (
          <StatRow label="Disputas" value={reputation.disputed_orders} />
        )}
      </dl>
    </div>
  );
}
