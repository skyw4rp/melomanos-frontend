import { expect, type Page } from "@playwright/test";
import { expectOrderStatus } from "./order";

const PAYMENT_MODE_KEY = "melomanos_payment_mode";

/**
 * Confirms Compra Segura payment for the demo acceptance flow using
 * whichever demo persona is currently logged in on `page` — never a
 * hardcoded E2E account. Handles both backend payment modes:
 *  - `simulate` (default): one click on "Confirmar pago".
 *  - `webpay_placeholder`: switches this browser to the WebPay sandbox UI
 *    and approves the placeholder checkout, using the active session's own
 *    token (via the app's normal `createCheckoutSession` call).
 */
export async function confirmDemoOrderPayment(
  page: Page,
  orderId: number,
): Promise<void> {
  const simulateButton = page.getByTestId("order-confirm-payment");

  if (await simulateButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await simulateButton.click();
    try {
      await expectOrderStatus(page, "Preparando envío", 15_000);
      return;
    } catch {
      // simulate-payment returns 410 when the backend is configured for
      // webpay_placeholder — fall through to the WebPay sandbox path.
    }
  }

  await page.evaluate((key) => {
    localStorage.setItem(key, "webpay_placeholder");
  }, PAYMENT_MODE_KEY);
  await page.reload();
  await expect(page.getByTestId("order-detail-page")).toBeVisible({
    timeout: 15_000,
  });

  const webpayButton = page.getByTestId("order-checkout-webpay");
  await expect(webpayButton).toBeVisible({ timeout: 15_000 });
  await webpayButton.click();
  await page.waitForURL(/\/payments\/webpay\/placeholder\//, {
    timeout: 25_000,
  });
  await expect(
    page.getByRole("heading", { name: "WebPay Sandbox" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: "Approve payment" }).click();
  await page.waitForURL(new RegExp(`/orders/${orderId}(\\?|$)`), {
    timeout: 25_000,
  });
  await expectOrderStatus(page, "Preparando envío", 20_000);

  // Restore the default UI mode for the rest of the flow / a human reviewer.
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, PAYMENT_MODE_KEY);
}
