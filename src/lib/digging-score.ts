export const DIGGING_LEVEL_THRESHOLDS = [
  { min: 600, label: "Elite Melómano" },
  { min: 300, label: "Trusted Selector" },
  { min: 150, label: "Vinyl Digger" },
  { min: 50, label: "Crate Hunter" },
  { min: 0, label: "Nuevo Melómano" },
] as const;

const LEVEL_LABELS = new Set(
  DIGGING_LEVEL_THRESHOLDS.map((tier) => tier.label),
);

export function getDiggingLevelLabel(level: string): string {
  const trimmed = level.trim();
  if (LEVEL_LABELS.has(trimmed as (typeof DIGGING_LEVEL_THRESHOLDS)[number]["label"])) {
    return trimmed;
  }
  return trimmed || "Nuevo Melómano";
}

export function getCurrentLevelByScore(score: number) {
  for (const tier of DIGGING_LEVEL_THRESHOLDS) {
    if (score >= tier.min) return tier;
  }
  return DIGGING_LEVEL_THRESHOLDS[DIGGING_LEVEL_THRESHOLDS.length - 1];
}

export function getNextLevel(
  score: number,
): { label: string; threshold: number } | null {
  const ascending = [...DIGGING_LEVEL_THRESHOLDS].sort((a, b) => a.min - b.min);
  let currentIndex = 0;
  for (let i = ascending.length - 1; i >= 0; i--) {
    if (score >= ascending[i].min) {
      currentIndex = i;
      break;
    }
  }
  const next = ascending[currentIndex + 1];
  return next ? { label: next.label, threshold: next.min } : null;
}

export function getDiggingProgress(score: number): {
  percent: number;
  currentLabel: string;
  nextLabel: string | null;
  nextThreshold: number | null;
  currentMin: number;
} {
  const current = getCurrentLevelByScore(score);
  const next = getNextLevel(score);

  if (!next) {
    return {
      percent: 100,
      currentLabel: current.label,
      nextLabel: null,
      nextThreshold: null,
      currentMin: current.min,
    };
  }

  const range = next.threshold - current.min;
  const rawPercent =
    range > 0 ? ((score - current.min) / range) * 100 : 0;

  return {
    percent: Math.min(100, Math.max(0, Math.round(rawPercent))),
    currentLabel: current.label,
    nextLabel: next.label,
    nextThreshold: next.threshold,
    currentMin: current.min,
  };
}

export function formatDiggingScore(score: number): string {
  if (!Number.isFinite(score)) return "0";
  return new Intl.NumberFormat("es-CL").format(Math.max(0, Math.round(score)));
}
