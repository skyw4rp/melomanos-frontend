import { expect, type Page } from "@playwright/test";
import { loginForApi } from "./auth-api";
import { BUYER_EMAIL } from "./constants";
import { expectOrderStatus } from "./order";
import {
  assertOrderPaymentHeld,
  disableWebPayCheckoutModeOnPage,
  enableWebPayCheckoutModeOnPage,
  getOrderApi,
  startWebPayCheckoutFromOrderPage,
} from "./webpay-checkout";

/**
 * Confirms payment for E2E flows in either simulate or WebPay placeholder mode.
 */
export async function confirmOrderPaymentForE2e(
  page: Page,
  orderId: number,
): Promise<void> {
  const simulate = page.getByTestId("order-confirm-payment");
  if (await simulate.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await simulate.click();
    try {
      await expectOrderStatus(page, "Pendiente de envío", 15_000);
      return;
    } catch {
      // simulate-payment returns 410 when backend is in webpay_placeholder mode
    }
  }

  await enableWebPayCheckoutModeOnPage(page);
  await expect(page.getByTestId("order-checkout-webpay")).toBeVisible({
    timeout: 15_000,
  });

  const session = await startWebPayCheckoutFromOrderPage(page);
  await expectOrderStatus(page, "Pendiente de envío", 20_000);

  const buyerToken = await loginForApi(BUYER_EMAIL);
  await assertOrderPaymentHeld(orderId, buyerToken);

  if (session?.provider === "webpay_placeholder") {
    expect(session.checkout_session_id).toBeGreaterThan(0);
    expect(session.status).toBe("pending");
  } else {
    const order = await getOrderApi(orderId, buyerToken);
    expect(order.payment_status).toBe("held");
  }
}

export async function retryWebPayCheckoutAfterCancel(
  page: Page,
  orderId: number,
): Promise<void> {
  await enableWebPayCheckoutModeOnPage(page);
  await expect(page.getByTestId("order-checkout-webpay")).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId("order-checkout-webpay").click();
  await page.waitForURL(/\/payments\/webpay\/placeholder\//, {
    timeout: 25_000,
  });
  await page.getByRole("link", { name: "Fail payment" }).click();
  await page.waitForURL(new RegExp(`/orders/${orderId}`), { timeout: 25_000 });
  await expect(page.getByTestId("order-checkout-notice")).toContainText(
    "Checkout cancelled.",
    { timeout: 15_000 },
  );

  await disableWebPayCheckoutModeOnPage(page);
  await enableWebPayCheckoutModeOnPage(page);
  await expect(page.getByTestId("order-checkout-webpay")).toBeVisible({
    timeout: 15_000,
  });

  const buyerToken = await loginForApi(BUYER_EMAIL);
  const session = await startWebPayCheckoutFromOrderPage(page);
  expect(session?.provider).toBe("webpay_placeholder");
  await expectOrderStatus(page, "Pendiente de envío", 20_000);
  await assertOrderPaymentHeld(orderId, buyerToken);
}
