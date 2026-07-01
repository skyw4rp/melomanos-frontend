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

function IconCheckVerified({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function HomeMetricsBand() {
  return (
    <section data-testid="home-metrics" className="mt-12">
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,340px)] lg:gap-5">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 divide-x divide-y divide-border/80 lg:grid-cols-4 lg:divide-y-0">
            {HOME_MARKETING_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 px-4 py-5 sm:px-5 sm:py-6"
              >
                <stat.icon className="h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <p className="text-2xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-[1.65rem]">
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
          className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
        >
          <div className="flex gap-4">
            <IconConfidenceStamp className="h-[3.25rem] w-[3.25rem] shrink-0 text-accent" />
            <div>
              <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
                Confianza Melómanos
                <IconCheckVerified className="text-accent" />
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Tu pago queda retenido hasta que confirmes la recepción del vinilo.
                Si algo no está bien, te protegemos.
              </p>
            </div>
          </div>
          <Link
            href="#catalogo"
            className="mt-4 inline-flex text-[13px] font-semibold text-accent transition hover:text-foreground"
          >
            Cómo funciona →
          </Link>
        </aside>
      </div>
    </section>
  );
}
