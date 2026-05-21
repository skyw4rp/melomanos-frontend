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
  "cancelled",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Compra iniciada",
  pending_payment: "Pago pendiente",
  paid: "Pago confirmado",
  pending_shipping: "Pendiente de envío",
  shipped: "Enviado",
  delivered: "Entregado",
  completed: "Completado",
  disputed: "En disputa",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  created: "bg-zinc-500/20 text-zinc-200 ring-zinc-500/30",
  pending_payment: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
  paid: "bg-violet-500/20 text-violet-200 ring-violet-400/30",
  pending_shipping: "bg-violet-500/20 text-violet-200 ring-violet-400/30",
  shipped: "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-400/30",
  delivered: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  completed: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  disputed: "bg-red-500/20 text-red-200 ring-red-500/40",
  cancelled: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
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
    (order.listing_id ? `Listing #${order.listing_id}` : `Order #${order.id}`)
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
  return Boolean(
    order.carrier?.trim() || order.tracking_number?.trim() || order.tracking_url?.trim(),
  );
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
  return status === "disputed" || status === "cancelled";
}

export function orderNeedsPayment(status: OrderStatus): boolean {
  return status === "created" || status === "pending_payment";
}
