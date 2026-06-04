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
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-zinc-200">{value}</dd>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      data-testid="digging-score-progress"
      className="mt-3 h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500"
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
            ? "mt-4 border-t border-white/10 pt-4"
            : "mt-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#120a1f] to-fuchsia-950/20 p-6 sm:p-8"
        }
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
          Digging Score
        </p>
        <p
          data-testid="digging-score-fallback"
          className="mt-3 text-sm text-zinc-400"
        >
          Digging Score próximamente
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
        className="mt-4 border-t border-white/10 pt-4"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
          Digging Score
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            data-testid="digging-score-value"
            className="text-2xl font-bold tabular-nums text-white"
          >
            {formatDiggingScore(diggingScore.score)}
          </span>
          <span
            data-testid="digging-score-level"
            className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fuchsia-200 ring-1 ring-fuchsia-400/30"
          >
            {levelLabel}
          </span>
        </div>
        <ProgressBar percent={progress.percent} />
        {next && (
          <p className="mt-2 text-[10px] text-zinc-500">
            Siguiente: {next.label} ({next.threshold} pts)
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      data-testid="digging-score-panel"
      className="mt-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-[#120a1f] to-fuchsia-950/20 p-6 sm:p-8"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Digging Score
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Tu identidad Melómanos según actividad verificada en el crate.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <p
          data-testid="digging-score-value"
          className="text-5xl font-bold tabular-nums tracking-tight text-white"
        >
          {formatDiggingScore(diggingScore.score)}
        </p>
        <p
          data-testid="digging-score-level"
          className="mb-1 inline-block rounded-full bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-violet-100 ring-1 ring-violet-400/40"
        >
          {levelLabel}
        </p>
      </div>

      <ProgressBar percent={progress.percent} />
      {next ? (
        <p className="mt-2 text-xs text-zinc-500">
          {progress.percent}% hacia {next.label} ({next.threshold} pts)
        </p>
      ) : (
        <p className="mt-2 text-xs text-emerald-300/80">
          Nivel máximo alcanzado — Elite Melómano
        </p>
      )}

      <dl className="mt-6 space-y-0 rounded-xl border border-white/10 bg-black/20 px-4">
        <BreakdownRow
          label="Ventas completadas"
          value={breakdown.completed_sales}
        />
        <BreakdownRow
          label="Compras completadas"
          value={breakdown.completed_purchases}
        />
        <BreakdownRow
          label="Reviews recibidas"
          value={breakdown.reviews_received}
        />
        <BreakdownRow
          label="Reviews escritas"
          value={breakdown.reviews_written}
        />
        <BreakdownRow
          label="Publicaciones activas"
          value={breakdown.active_listings}
        />
        <BreakdownRow
          label="Protected trades"
          value={breakdown.protected_trades}
        />
        <BreakdownRow label="Disputas" value={breakdown.disputes} />
      </dl>
    </section>
  );
}
