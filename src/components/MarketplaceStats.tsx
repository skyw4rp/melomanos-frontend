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
      label: "Listings",
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
      className={`grid grid-cols-3 gap-2 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-[#120a1f] to-fuchsia-950/30 ${compact ? "p-2.5" : "p-3 sm:gap-3 sm:p-4"}`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="border-r border-white/5 px-1 text-center last:border-r-0 sm:px-2"
        >
          <p
            className={`font-black tabular-nums text-white ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}
          >
            {item.value}
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-violet-300/90 sm:text-[10px]">
            {item.label}
          </p>
          <p className="mt-0.5 hidden text-[9px] text-zinc-500 sm:block">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
