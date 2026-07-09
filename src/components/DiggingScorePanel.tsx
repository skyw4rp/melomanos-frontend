import {
  formatDiggingScore,
  getDiggingLevelLabel,
  getDiggingProgress,
  getNextLevel,
} from "@/lib/digging-score";
import type { DiggingScore } from "@/types";

interface DiggingScorePanelProps {
  diggingScore: DiggingScore | null;
  compact?: boolean;
  showFallback?: boolean;
  /** @deprecated Always renders on-system editorial styling; kept for call-site compatibility. */
  editorial?: boolean;
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      data-testid="digging-score-progress"
      className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function DiggingScorePanel({
  diggingScore,
  compact = false,
  showFallback = false,
}: DiggingScorePanelProps) {
  if (!diggingScore) {
    if (!showFallback) return null;
    return (
      <section
        data-testid="digging-score-panel"
        className={
          compact
            ? "mt-4 border-t border-border pt-4"
            : "mt-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
        }
      >
        <p className="text-sm font-semibold text-foreground">
          {compact ? "Reputación Melómanos" : "Digging Score"}
        </p>
        <p
          data-testid="digging-score-fallback"
          className="mt-3 text-sm text-muted-foreground"
        >
          {compact
            ? "Cuando completes ventas o compras, tu reputación aparecerá aquí."
            : "Cuando completes ventas o compras, tu Digging Score aparecerá aquí."}
        </p>
      </section>
    );
  }

  const levelLabel = getDiggingLevelLabel(diggingScore.level);
  const progress = getDiggingProgress(diggingScore.score);
  const next = getNextLevel(diggingScore.score);
  const breakdown = diggingScore.breakdown;

  if (compact) {
    return (
      <div
        data-testid="digging-score-panel"
        className="mt-4 border-t border-border pt-4"
      >
        <p className="editorial-label">Reputación Melómanos</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            data-testid="digging-score-value"
            className="text-2xl font-bold tabular-nums text-foreground"
          >
            {formatDiggingScore(diggingScore.score)}
          </span>
          <span data-testid="digging-score-level" className="badge-gold">
            {levelLabel}
          </span>
        </div>
        <ProgressBar percent={progress.percent} />
        {next && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Siguiente: {next.label} ({next.threshold} pts)
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      data-testid="digging-score-panel"
      className="mt-5 rounded-2xl border border-border/80 bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
    >
      <p className="editorial-label text-accent">Progreso digger</p>
      <p className="mt-1 text-sm font-semibold text-foreground">Digging Score</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu avance como digger en Melómanos — distinto de tu reputación de vendedor.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <p
          data-testid="digging-score-value"
          className="text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl"
        >
          {formatDiggingScore(diggingScore.score)}
        </p>
        <p
          data-testid="digging-score-level"
          className="mb-1 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent ring-1 ring-accent/30"
        >
          {levelLabel}
        </p>
      </div>

      <ProgressBar percent={progress.percent} />
      {next ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {progress.percent}% hacia {next.label} ({next.threshold} pts)
        </p>
      ) : (
        <p className="mt-2 text-xs text-success">
          Nivel máximo alcanzado — Elite Melómano
        </p>
      )}

      <details className="mt-5 rounded-xl border border-border bg-surface-muted/20">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          Desglose del score
        </summary>
        <dl className="space-y-0 border-t border-border px-4 pb-2">
          <BreakdownRow label="Ventas completadas" value={breakdown.completed_sales} />
          <BreakdownRow label="Compras completadas" value={breakdown.completed_purchases} />
          <BreakdownRow label="Reseñas recibidas" value={breakdown.reviews_received} />
          <BreakdownRow label="Reseñas escritas" value={breakdown.reviews_written} />
          <BreakdownRow label="Publicaciones activas" value={breakdown.active_listings} />
          <BreakdownRow
            label="Intercambios protegidos"
            value={breakdown.protected_trades}
          />
          <BreakdownRow label="Disputas" value={breakdown.disputes} />
        </dl>
      </details>
    </section>
  );
}
