import { resolveTrustBadges } from "@/lib/trust-badges";

interface TrustBadgePillsProps {
  badges?: string[] | null;
}

export default function TrustBadgePills({ badges }: TrustBadgePillsProps) {
  const resolved = resolveTrustBadges(badges);
  if (resolved.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
        Insignias
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {resolved.map((badge) => (
          <li key={badge.key}>
            <span
              title={badge.description}
              className="inline-block rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200"
            >
              {badge.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
