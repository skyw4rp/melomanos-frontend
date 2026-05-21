export interface TrustBadgeInfo {
  key: string;
  label: string;
  description: string;
}

const TRUST_BADGES: Record<string, { label: string; description: string }> = {
  new_collector: {
    label: "Nuevo coleccionista",
    description: "Primeras ventas en Melómanos",
  },
  trusted_collector: {
    label: "Coleccionista confiable",
    description: "Buenas calificaciones y ventas completadas",
  },
  elite_digger: {
    label: "Elite Digger",
    description: "Historial destacado en la comunidad",
  },
  protected_seller: {
    label: "Vendedor protegido",
    description: "Varias transacciones protegidas completadas",
  },
  no_disputes: {
    label: "Sin disputas",
    description: "Ventas completadas sin reclamos",
  },
  top_rated: {
    label: "Top rated",
    description: "Calificación sobresaliente",
  },
  experienced_seller: {
    label: "Vendedor experimentado",
    description: "Alto volumen de ventas completadas",
  },
};

export function normalizeReputationBadges(badges?: string[] | null): string[] {
  return Array.isArray(badges) ? badges : [];
}

export function resolveTrustBadge(key: string): TrustBadgeInfo | null {
  const normalized = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const info = TRUST_BADGES[normalized];
  if (!info) return null;
  return { key: normalized, ...info };
}

export function resolveTrustBadges(badges?: string[] | null): TrustBadgeInfo[] {
  const seen = new Set<string>();
  const resolved: TrustBadgeInfo[] = [];

  for (const raw of normalizeReputationBadges(badges)) {
    const badge = resolveTrustBadge(raw);
    if (!badge || seen.has(badge.key)) continue;
    seen.add(badge.key);
    resolved.push(badge);
  }

  return resolved;
}
