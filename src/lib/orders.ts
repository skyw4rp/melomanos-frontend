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
  created: "Creado",
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  pending_shipping: "Envío pendiente",
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

export function orderTimelineSteps(): { status: OrderStatus; label: string }[] {
  return [
    { status: "created", label: "Creado" },
    { status: "pending_payment", label: "Pago" },
    { status: "paid", label: "Pagado" },
    { status: "pending_shipping", label: "Preparar envío" },
    { status: "shipped", label: "Enviado" },
    { status: "delivered", label: "Entregado" },
    { status: "completed", label: "Completado" },
  ];
}

export function timelineStepIndex(status: OrderStatus): number {
  if (status === "disputed" || status === "cancelled") return -1;
  const steps = orderTimelineSteps();
  const idx = steps.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}
