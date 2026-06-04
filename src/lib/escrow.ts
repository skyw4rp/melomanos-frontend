import type { Order, PaymentStatus } from "@/types";

export const DEFAULT_PLATFORM_FEE_CLP = 990;

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pago pendiente",
  paid: "Pago recibido",
  held: "Fondos retenidos",
  released: "Fondos liberados",
  refunded: "Reembolsado",
};

const PAYMENT_STATUS_DESCRIPTIONS: Record<PaymentStatus, string> = {
  pending: "Confirma el pago para activar Compra Segura.",
  paid: "Pago registrado; los fondos se retienen en la plataforma.",
  held: "Melómanos mantiene los fondos retenidos hasta que confirmes la recepción.",
  released: "Fondos liberados al vendedor.",
  refunded: "Pago reembolsado.",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
  paid: "bg-violet-500/20 text-violet-200 ring-violet-400/30",
  held: "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-400/40",
  released: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/35",
  refunded: "bg-zinc-500/20 text-zinc-300 ring-zinc-500/35",
};

export function normalizePaymentStatus(status?: string | null): PaymentStatus {
  const value = (status ?? "pending").toLowerCase();
  if (
    value === "pending" ||
    value === "paid" ||
    value === "held" ||
    value === "released" ||
    value === "refunded"
  ) {
    return value;
  }
  return "pending";
}

export function paymentStatusLabel(status?: string | null): string {
  return PAYMENT_STATUS_LABELS[normalizePaymentStatus(status)];
}

export function paymentStatusDescription(status?: string | null): string {
  return PAYMENT_STATUS_DESCRIPTIONS[normalizePaymentStatus(status)];
}

export function paymentStatusBadgeClass(status?: string | null): string {
  return PAYMENT_STATUS_STYLES[normalizePaymentStatus(status)];
}

export function isFundsHeld(order: Order): boolean {
  const ps = normalizePaymentStatus(order.payment_status);
  return ps === "held" || ps === "paid";
}

export function isFundsReleased(order: Order): boolean {
  return normalizePaymentStatus(order.payment_status) === "released";
}

export function isRefunded(order: Order): boolean {
  return normalizePaymentStatus(order.payment_status) === "refunded";
}

export function orderPlatformFeeClp(order: Order): number {
  return order.platform_fee_clp ?? DEFAULT_PLATFORM_FEE_CLP;
}

export function orderAmountPaidClp(order: Order): number {
  if (order.amount_paid_clp != null) return order.amount_paid_clp;
  return order.listing_price_clp + orderPlatformFeeClp(order);
}

export function orderSellerAmountClp(order: Order): number {
  return order.seller_amount_clp ?? order.listing_price_clp;
}
