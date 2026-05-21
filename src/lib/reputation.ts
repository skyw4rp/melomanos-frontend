/** Maps API trust_level values to Spanish collector labels. */
const TRUST_LEVEL_LABELS: Record<string, string> = {
  new: "Nuevo coleccionista",
  new_collector: "Nuevo coleccionista",
  nuevo: "Nuevo coleccionista",
  nuevo_coleccionista: "Nuevo coleccionista",
  trusted: "Coleccionista confiable",
  reliable: "Coleccionista confiable",
  confiable: "Coleccionista confiable",
  coleccionista_confiable: "Coleccionista confiable",
  elite: "Elite Digger",
  elite_digger: "Elite Digger",
  digger: "Elite Digger",
  collector: "Collector",
};

export function trustLevelLabel(trustLevel: string | undefined | null): string {
  if (!trustLevel?.trim()) return "Collector";
  const key = trustLevel.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return TRUST_LEVEL_LABELS[key] ?? trustLevel.trim();
}

export function formatAverageRating(average: number | null | undefined): string {
  if (average == null || Number.isNaN(average)) return "Sin reviews";
  return `${average.toFixed(1)} ★`;
}
