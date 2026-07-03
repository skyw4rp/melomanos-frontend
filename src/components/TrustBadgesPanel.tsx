import { resolveTrustBadges } from "@/lib/trust-badges";

interface TrustBadgesPanelProps {
  badges?: string[] | null;
  /** @deprecated Always renders on-system editorial styling; kept for call-site compatibility. */
  editorial?: boolean;
}

export default function TrustBadgesPanel({ badges }: TrustBadgesPanelProps) {
  const resolved = resolveTrustBadges(badges);

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Insignias de confianza
      </p>

      {resolved.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Aún no tienes reseñas destacadas. Completa ventas y reseñas para desbloquear
          insignias.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {resolved.map((badge) => (
            <li
              key={badge.key}
              className="rounded-full border border-border bg-surface-muted/50 px-3 py-1.5 text-xs font-medium text-foreground"
              title={badge.description}
            >
              {badge.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
