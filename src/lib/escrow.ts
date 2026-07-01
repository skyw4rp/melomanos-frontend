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
  pending: "bg-amber-600/10 text-amber-900 ring-amber-600/25",
  paid: "bg-accent/10 text-accent ring-accent/30",
  held: "bg-accent/10 text-accent ring-accent/30",
  released: "bg-success/10 text-success ring-success/25",
  refunded: "bg-destructive/10 text-destructive ring-destructive/30",
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
