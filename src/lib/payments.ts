import { API_BASE, isSessionExpiredError, SESSION_EXPIRED_MESSAGE } from "@/lib/api";
import { normalizeOrderStatus } from "@/lib/orders";
import type { Order } from "@/types";

export type PaymentProviderMode = "simulate" | "webpay_placeholder";

const PAYMENT_MODE_STORAGE_KEY = "melomanos_payment_mode";

export function getPaymentProviderMode(): PaymentProviderMode {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(PAYMENT_MODE_STORAGE_KEY);
    if (stored === "webpay_placeholder" || stored === "simulate") {
      return stored;
    }
  }

  const envMode = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_MODE;
  if (envMode === "webpay_placeholder") {
    return "webpay_placeholder";
  }

  return "simulate";
}

export function usesWebPayCheckout(
  mode: PaymentProviderMode = getPaymentProviderMode(),
): boolean {
  return mode === "webpay_placeholder";
}

export function normalizePaymentStatus(status?: string | null): string {
  return (status ?? "pending").toLowerCase();
}

export function orderCanStartWebPayCheckout(order: Order): boolean {
  return (
    normalizeOrderStatus(order.status) === "created" &&
    normalizePaymentStatus(order.payment_status) === "pending"
  );
}

export function buildCheckoutReturnUrl(
  orderId: number,
  outcome: "success" | "cancelled",
): string {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(`/orders/${orderId}`, window.location.origin);
  url.searchParams.set("checkout", outcome);
  return url.toString();
}

export function resolveCheckoutRedirectUrl(checkoutUrl: string): string {
  if (checkoutUrl.startsWith("http://") || checkoutUrl.startsWith("https://")) {
    return checkoutUrl;
  }

  const path = checkoutUrl.startsWith("/") ? checkoutUrl : `/${checkoutUrl}`;
  return `${API_BASE}${path}`;
}

export function formatCheckoutError(err: unknown): string {
  if (isSessionExpiredError(err)) {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (err instanceof TypeError) {
    return "Network error. Please try again.";
  }

  if (err instanceof Error) {
    if (err.message.toLowerCase().includes("failed to fetch")) {
      return "Network error. Please try again.";
    }
    return err.message;
  }

  return "Checkout failed. Please try again.";
}
