import Link from "next/link";
import {
  IconConfidenceStamp,
  IconEqualizer,
  IconLabel,
  IconMapPin,
  IconVinylMetric,
} from "@/components/icons/HomeIcons";

/** Presentational home marketing stats — curated numbers for editorial hero band (not API totals). */
const HOME_MARKETING_STATS = [
  { value: "2.384", label: "Vinilos", icon: IconVinylMetric },
  { value: "426", label: "Sellos", icon: IconLabel },
  { value: "182", label: "Artistas", icon: IconEqualizer },
  { value: "37", label: "Ciudades", icon: IconMapPin },
] as const;

function IconCheckBadge({ className }: { className?: string }) {
  return (
    <svg
      className={`inline-block h-4 w-4 shrink-0 ${className ?? ""}`}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M4.25 7l1.75 1.75 3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomeMetricsBand() {
  return (
    <section data-testid="home-metrics" className="mt-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-stretch lg:gap-5">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[var(--shadow-card)] lg:h-28">
          <div className="grid h-full grid-cols-2 divide-x divide-y divide-border/80 lg:grid-cols-4 lg:divide-y-0">
            {HOME_MARKETING_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex h-full items-center gap-2.5 px-4 py-4 sm:px-5 lg:py-0"
              >
                <stat.icon className="h-6 w-6 shrink-0 text-foreground" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside
          data-testid="home-confidence-card"
          className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-border/80 bg-surface px-4 py-4 shadow-[var(--shadow-card)] sm:gap-4 sm:px-5 lg:h-28"
        >
          <IconConfidenceStamp className="h-10 w-10 shrink-0 text-accent sm:h-11 sm:w-11" />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold leading-tight text-foreground">
              <span>Confianza Melómanos</span>
              <IconCheckBadge className="text-accent" />
            </h2>
            <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-[13px] sm:leading-relaxed">
              Tu pago queda retenido hasta que confirmes la recepción del vinilo.
              Si algo no está bien, te protegemos.
            </p>
            <Link
              href="#catalogo"
              className="mt-2 inline-flex text-xs font-semibold text-accent transition-colors duration-200 hover:text-foreground sm:text-[13px]"
            >
              Cómo funciona →
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
