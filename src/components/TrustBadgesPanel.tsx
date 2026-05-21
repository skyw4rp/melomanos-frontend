import { resolveTrustBadges } from "@/lib/trust-badges";

interface TrustBadgesPanelProps {
  badges?: string[] | null;
}

export default function TrustBadgesPanel({ badges }: TrustBadgesPanelProps) {
  const resolved = resolveTrustBadges(badges);

  return (
    <section className="mt-8 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-[#120a1f] to-fuchsia-950/15 p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
        Trust badges
      </p>

      {resolved.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Aún no tienes insignias. Completa ventas y reviews para desbloquearlas.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {resolved.map((badge) => (
            <li
              key={badge.key}
              className="rounded-xl border border-fuchsia-500/20 bg-gradient-to-br from-violet-950/50 to-black/30 p-4"
            >
              <p className="text-sm font-semibold text-white">{badge.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {badge.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
