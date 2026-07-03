import { resolveTrustBadges } from "@/lib/trust-badges";

interface TrustBadgePillsProps {
  badges?: string[] | null;
  /** @deprecated Always renders on-system editorial styling; kept for call-site compatibility. */
  editorial?: boolean;
}

export default function TrustBadgePills({ badges }: TrustBadgePillsProps) {
  const resolved = resolveTrustBadges(badges);
  if (resolved.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Insignias
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {resolved.map((badge) => (
          <li key={badge.key}>
            <span
              title={badge.description}
              className="badge-muted normal-case tracking-normal"
            >
              {badge.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
