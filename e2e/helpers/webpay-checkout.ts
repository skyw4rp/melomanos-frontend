import { expect, type Page } from "@playwright/test";
import { authHeaders, loginForApi } from "./auth-api";
import { API_BASE, BUYER_EMAIL, SELLER_EMAIL } from "./constants";
import { fetchListings } from "./api";
import { expectOrderStatus } from "./order";

export const WEBPAY_MODE_STORAGE_KEY = "melomanos_payment_mode";
export const E2E_WEBPAY_CALLBACK_SECRET =
  process.env.E2E_WEBPAY_CALLBACK_SECRET ?? "e2e-webpay-callback-secret";

export interface CheckoutSessionApi {
  order_id: number;
  checkout_session_id: number;
  provider: string;
  status: string;
  amount_clp: number;
  currency: string;
  checkout_url?: string | null;
  expires_at?: string | null;
}

export interface OrderApi {
  id: number;
  status: string;
  payment_status?: string;
  buyer_id: number;
  seller_id: number;
}

export async function enableWebPayCheckoutMode(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "webpay_placeholder");
  }, WEBPAY_MODE_STORAGE_KEY);
}

export async function enableWebPayCheckoutModeOnPage(page: Page): Promise<void> {
  await page.evaluate((key) => {
    localStorage.setItem(key, "webpay_placeholder");
  }, WEBPAY_MODE_STORAGE_KEY);
  await page.reload();
}

export async function disableWebPayCheckoutModeOnPage(page: Page): Promise<void> {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, WEBPAY_MODE_STORAGE_KEY);
  await page.reload();
}

export function resolveBackendCheckoutUrl(checkoutUrl: string): string {
  if (checkoutUrl.startsWith("http://") || checkoutUrl.startsWith("https://")) {
    return checkoutUrl;
  }
  const path = checkoutUrl.startsWith("/") ? checkoutUrl : `/${checkoutUrl}`;
  return `${API_BASE}${path}`;
}

export async function createCheckoutSessionApi(
  orderId: number,
  token: string,
): Promise<CheckoutSessionApi> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/checkout`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Checkout API failed (${res.status}): ${text}`);
  }

  return (await res.json()) as CheckoutSessionApi;
}

export async function getOrderApi(
  orderId: number,
  token: string,
): Promise<OrderApi> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Order API failed (${res.status}): ${text}`);
  }

  return (await res.json()) as OrderApi;
}

export async function assertOrderPaymentHeld(
  orderId: number,
  token: string,
): Promise<OrderApi> {
  const order = await getOrderApi(orderId, token);
  expect(order.payment_status).toBe("held");
  expect(order.status).toBe("pending_shipping");
  return order;
}

export async function assertCheckoutSessionNoLongerStartable(
  orderId: number,
  token: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/checkout`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(10_000),
  });

  expect(res.status).toBe(400);
  const body = (await res.json()) as { detail?: string };
  expect(body.detail ?? "").toMatch(
    /created status|payment_status is pending/i,
  );
}

export async function approvePlaceholderCheckoutViaPage(
  page: Page,
): Promise<void> {
  await expect(
    page.getByRole("heading", { name: "WebPay Sandbox" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: "Approve payment" }).click();
  await page.waitForURL(/\/orders\/\d+/, { timeout: 25_000 });
}

export async function startWebPayCheckoutFromOrderPage(
  page: Page,
): Promise<CheckoutSessionApi | null> {
  const orderMatch = page.url().match(/\/orders\/(\d+)/);
  expect(orderMatch).not.toBeNull();
  const orderId = Number(orderMatch![1]);

  const buyerToken = await loginForApi(BUYER_EMAIL);
  const sessionBefore = await createCheckoutSessionApi(orderId, buyerToken);
  expect(sessionBefore.checkout_session_id).toBeGreaterThan(0);
  expect(sessionBefore.status).toBe("pending");

  await page.getByTestId("order-checkout-webpay").click();
  await page.waitForURL(/\/payments\/(webpay\/placeholder|simulate\/checkout)\//, {
    timeout: 25_000,
  });

  const checkoutUrl = page.url();
  if (checkoutUrl.includes("/payments/webpay/placeholder/")) {
    await approvePlaceholderCheckoutViaPage(page);
    return sessionBefore;
  }

  await page.goBack();
  await disableWebPayCheckoutModeOnPage(page);
  await page.getByTestId("order-confirm-payment").click();
  return null;
}

export async function createPendingOrderAsBuyer(page: Page): Promise<number> {
  const stamp = Date.now();
  const listingTitle = `E2E WebPay ${stamp}`;

  const { loginAsBuyer, loginAsSeller, logoutViaStorage } = await import("./auth");
  const { createListingViaUi } = await import("./listing");
  const { orderIdFromUrl } = await import("./order");

  await logoutViaStorage(page);
  await loginAsSeller(page);
  const listingId = await createListingViaUi(page, {
    title: listingTitle,
    listingType: "new",
    recordCondition: "NM",
    coverCondition: "NM",
  });

  await logoutViaStorage(page);
  await loginAsBuyer(page);
  await page.goto(`/listings/${listingId}`);
  await page.getByRole("button", { name: /^comprar$/i }).click();
  await page.waitForURL(/\/orders\/\d+/, { timeout: 25_000 });

  return orderIdFromUrl(page.url());
}

export async function completeWebPayPlaceholderPayment(
  page: Page,
  orderId: number,
): Promise<CheckoutSessionApi> {
  const buyerToken = await loginForApi(BUYER_EMAIL);

  await enableWebPayCheckoutModeOnPage(page);
  await expect(page.getByTestId("order-checkout-webpay")).toBeVisible({
    timeout: 15_000,
  });

  const session = await createCheckoutSessionApi(orderId, buyerToken);
  expect(session.provider).toBe("webpay_placeholder");
  expect(session.checkout_url).toBeTruthy();

  await page.getByTestId("order-checkout-webpay").click();
  await page.waitForURL(/\/payments\/webpay\/placeholder\//, {
    timeout: 25_000,
  });

  await approvePlaceholderCheckoutViaPage(page);
  await expectOrderStatus(page, "Preparando envío", 20_000);

  await assertOrderPaymentHeld(orderId, buyerToken);
  await assertCheckoutSessionNoLongerStartable(orderId, buyerToken);

  return session;
}

export async function probeBackendWebPayPlaceholderReady(): Promise<boolean> {
  try {
    const completeRes = await fetch(
      `${API_BASE}/payments/webpay/placeholder/wp_e2e_probe/complete?outcome=approved`,
      { redirect: "manual", signal: AbortSignal.timeout(5_000) },
    );
    if (completeRes.status === 503) {
      return false;
    }

    const sellerToken = await loginForApi(SELLER_EMAIL);
    const buyerToken = await loginForApi(BUYER_EMAIL);
    const stamp = Date.now();

    const listingRes = await fetch(`${API_BASE}/listings`, {
      method: "POST",
      headers: {
        ...authHeaders(sellerToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `E2E WebPay Probe ${stamp}`,
        artist: "Probe Artist",
        price_clp: 15000,
        record_condition: "NM",
        cover_condition: "NM",
        listing_type: "new",
      }),
      signal: AbortSignal.timeout(15_000),
    });

    let listingId: number | null = null;
    if (listingRes.ok) {
      listingId = ((await listingRes.json()) as { id: number }).id;
    } else {
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: authHeaders(buyerToken),
        signal: AbortSignal.timeout(10_000),
      });
      if (!meRes.ok) {
        return false;
      }
      const buyerId = ((await meRes.json()) as { id: number }).id;
      const listings = await fetchListings(50);
      const listing = listings.find((row) => {
        const status = (row.status ?? "available").toLowerCase();
        return (
          row.seller_id !== buyerId &&
          status !== "sold" &&
          status !== "reserved"
        );
      });
      listingId = listing?.id ?? null;
    }

    if (listingId == null) {
      return false;
    }

    const orderRes = await fetch(`${API_BASE}/orders/from-listing/${listingId}`, {
      method: "POST",
      headers: authHeaders(buyerToken),
      signal: AbortSignal.timeout(15_000),
    });
    if (!orderRes.ok) {
      return false;
    }
    const orderId = ((await orderRes.json()) as { id: number }).id;

    const session = await createCheckoutSessionApi(orderId, buyerToken);
    return session.provider === "webpay_placeholder";
  } catch {
    return false;
  }
}
