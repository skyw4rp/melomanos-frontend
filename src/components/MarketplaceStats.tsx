import type { MarketplaceStats } from "@/lib/marketplace-stats";

interface MarketplaceStatsProps {
  stats: MarketplaceStats;
  compact?: boolean;
}

export default function MarketplaceStatsRow({
  stats,
  compact,
}: MarketplaceStatsProps) {
  const items = [
    {
      label: "Publicaciones",
      value: stats.totalListings,
      hint: "en catálogo",
    },
    {
      label: "Ciudades",
      value: stats.uniqueCities,
      hint: "en selección",
    },
    {
      label: "Artistas",
      value: stats.uniqueArtists,
      hint: "en selección",
    },
  ];

  return (
    <div
      data-testid="marketplace-stats"
      className={`rounded-2xl border border-border bg-surface px-2 py-3 sm:px-4 ${compact ? "" : "py-4"}`}
    >
      <div className="grid grid-cols-3 divide-x divide-border">
        {items.map((item) => (
          <div key={item.label} className="px-3 text-center sm:px-4">
            <p
              className={`font-bold tabular-nums text-foreground ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}
            >
              {item.value}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">
              {item.label}
            </p>
            <p className="mt-0.5 hidden text-[10px] text-muted-foreground/80 sm:block">
              {item.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
