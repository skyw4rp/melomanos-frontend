import type { Order, OrderStatus } from "@/types";

export const ORDER_STATUSES: OrderStatus[] = [
  "created",
  "pending_payment",
  "paid",
  "pending_shipping",
  "shipped",
  "delivered",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Compra iniciada",
  pending_payment: "Pago pendiente",
  paid: "Pago protegido",
  pending_shipping: "Preparando envío",
  shipped: "Enviado",
  delivered: "Entregado",
  completed: "Completado",
  disputed: "En disputa",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  created: "bg-surface-muted text-muted-foreground ring-border",
  pending_payment: "bg-amber-600/10 text-amber-900 ring-amber-600/25",
  paid: "bg-accent/10 text-accent ring-accent/30",
  pending_shipping: "bg-accent/10 text-accent ring-accent/30",
  shipped: "bg-surface-muted text-foreground ring-border",
  delivered: "bg-success/10 text-success ring-success/25",
  completed: "bg-success/10 text-success ring-success/25",
  disputed: "bg-destructive/10 text-destructive ring-destructive/30",
  refunded: "bg-muted-foreground/10 text-muted-foreground ring-border",
  cancelled: "bg-muted-foreground/10 text-muted-foreground ring-border",
};

const STATUS_FLOW: OrderStatus[] = [
  "created",
  "pending_payment",
  "paid",
  "pending_shipping",
  "shipped",
  "delivered",
  "completed",
];

export interface OrderTimelinePhase {
  key: string;
  title: string;
  hint: string;
  statuses: OrderStatus[];
}

export function normalizeOrderStatus(status?: string | null): OrderStatus {
  const value = (status ?? "created").toLowerCase() as OrderStatus;
  return ORDER_STATUSES.includes(value) ? value : "created";
}

export function orderStatusLabel(status?: string | null): string {
  return STATUS_LABELS[normalizeOrderStatus(status)];
}

export function orderStatusBadgeClass(status?: string | null): string {
  return STATUS_STYLES[normalizeOrderStatus(status)];
}

export function orderListingTitle(order: Order): string {
  return (
    order.listing_title?.trim() ||
    (order.listing_id ? `Publicación #${order.listing_id}` : `Pedido #${order.id}`)
  );
}

export function orderTotalClp(order: Order): number {
  return (order.listing_price_clp ?? 0) + (order.shipping_price_clp ?? 0);
}

export function isOrderBuyer(order: Order, userId: number): boolean {
  return order.buyer_id === userId;
}

export function isOrderSeller(order: Order, userId: number): boolean {
  return order.seller_id === userId;
}

export function orderHasTracking(order: Order): boolean {
  return Boolean(order.carrier?.trim() && order.tracking_number?.trim());
}

export function orderTimelinePhases(): OrderTimelinePhase[] {
  return [
    {
      key: "created",
      title: "Compra iniciada",
      hint: "Pedido creado",
      statuses: ["created"],
    },
    {
      key: "payment",
      title: "Pago y preparación",
      hint: "Pago pendiente · pago confirmado · pendiente de envío",
      statuses: ["pending_payment", "paid", "pending_shipping"],
    },
    {
      key: "shipped",
      title: "Enviado",
      hint: "Vinilo en camino",
      statuses: ["shipped"],
    },
    {
      key: "delivery",
      title: "Entrega",
      hint: "Entregado · completado",
      statuses: ["delivered", "completed"],
    },
  ];
}

export type TimelinePhaseState = "done" | "current" | "upcoming";

export function timelinePhaseState(
  phase: OrderTimelinePhase,
  status: OrderStatus,
): TimelinePhaseState {
  const statusIdx = STATUS_FLOW.indexOf(status);
  if (statusIdx < 0) return "upcoming";

  const indices = phase.statuses
    .map((s) => STATUS_FLOW.indexOf(s))
    .filter((i) => i >= 0);
  if (indices.length === 0) return "upcoming";

  const min = Math.min(...indices);
  const max = Math.max(...indices);

  if (statusIdx > max) return "done";
  if (statusIdx >= min && statusIdx <= max) return "current";
  return "upcoming";
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "disputed" || status === "cancelled" || status === "refunded";
}

export function orderNeedsPayment(status: OrderStatus): boolean {
  return status === "created" || status === "pending_payment";
}
