export function formatPriceCLP(amount?: number | null): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function normalizeListingStatus(status?: string | null): string {
  return (status ?? "available").toLowerCase();
}

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

export function statusLabel(status?: string | null): string {
  const normalized = normalizeListingStatus(status);
  return STATUS_LABELS[normalized] ?? normalized.replace(/_/g, " ");
}

export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function formatMessageTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
