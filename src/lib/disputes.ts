import type { DisputeEvidenceType, OrderDispute } from "@/types";

export function disputeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Abierta",
    under_review: "En revisión",
    resolved_buyer: "Resuelta (comprador)",
    resolved_seller: "Resuelta (vendedor)",
  };
  return labels[status] ?? status;
}

export function evidenceTypeLabel(type: string): string {
  return type === "video" ? "Video" : "Foto";
}

export function evidenceTypeFromSelect(value: string): DisputeEvidenceType {
  return value === "video" ? "video" : "photo";
}

export function disputeOpenedByLabel(
  dispute: OrderDispute,
  buyerId: number,
  sellerId: number,
): string {
  if (dispute.opened_by_user_id === buyerId) return "Comprador";
  if (dispute.opened_by_user_id === sellerId) return "Vendedor";
  return "Participante";
}

export function canOpenOrderDispute(orderStatus: string): boolean {
  return ["shipped", "delivered", "paid", "pending_shipping"].includes(
    orderStatus,
  );
}
