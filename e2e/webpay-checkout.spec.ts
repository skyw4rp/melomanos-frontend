import { expect, test } from "@playwright/test";
import { loginAsBuyer, loginAsSeller, logoutViaStorage } from "./helpers/auth";
import { openSellingOrderFromList } from "./helpers/order";
import {
  createPendingOrderAsBuyer,
  enableWebPayCheckoutMode,
} from "./helpers/webpay-checkout";

test.describe("WebPay checkout (Phase 5)", () => {
  test("shows Pay with WebPay for buyer on created pending order", async ({
    page,
  }) => {
    await enableWebPayCheckoutMode(page);
    await createPendingOrderAsBuyer(page);

    await expect(page.getByTestId("order-checkout-webpay")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("order-confirm-payment")).toHaveCount(0);
  });

  test("hides Pay with WebPay for seller", async ({ page }) => {
    await enableWebPayCheckoutMode(page);
    const orderId = await createPendingOrderAsBuyer(page);

    await logoutViaStorage(page);
    await loginAsSeller(page);
    await openSellingOrderFromList(page, orderId);

    await expect(page.getByTestId("order-checkout-webpay")).toHaveCount(0);
  });

  test("checkout redirects to backend checkout URL", async ({ page }) => {
    test.setTimeout(90_000);

    await enableWebPayCheckoutMode(page);
    await createPendingOrderAsBuyer(page);

    await page.getByTestId("order-checkout-webpay").click();
    await page.waitForURL(/127\.0\.0\.1:8000\/payments\/(simulate|webpay)\//, {
      timeout: 20_000,
    });
  });

  test("displays success message on checkout=success return", async ({
    page,
  }) => {
    await enableWebPayCheckoutMode(page);
    const orderId = await createPendingOrderAsBuyer(page);

    await page.goto(`/orders/${orderId}?checkout=success`);

    await expect(page.getByTestId("order-checkout-notice")).toContainText(
      "Payment submitted successfully.",
      { timeout: 15_000 },
    );
    await expect(page).toHaveURL(`/orders/${orderId}`);
  });

  test("displays cancelled message on checkout=cancelled return", async ({
    page,
  }) => {
    await enableWebPayCheckoutMode(page);
    const orderId = await createPendingOrderAsBuyer(page);

    await page.goto(`/orders/${orderId}?checkout=cancelled`);

    await expect(page.getByTestId("order-checkout-notice")).toContainText(
      "Checkout cancelled.",
      { timeout: 15_000 },
    );
    await expect(page).toHaveURL(`/orders/${orderId}`);
  });

  test("displays checkout error for invalid order state", async ({ page }) => {
    await enableWebPayCheckoutMode(page);
    const orderId = await createPendingOrderAsBuyer(page);

    await page.route(`**/orders/${orderId}/checkout`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "Order must be in created status to start checkout",
        }),
      });
    });

    await page.getByTestId("order-checkout-webpay").click();

    await expect(page.locator("aside").getByText(/created status/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("displays unauthorized error when checkout returns 403", async ({
    page,
  }) => {
    await enableWebPayCheckoutMode(page);
    const orderId = await createPendingOrderAsBuyer(page);

    await page.route(`**/orders/${orderId}/checkout`, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Only the buyer can start checkout" }),
      });
    });

    await page.getByTestId("order-checkout-webpay").click();

    await expect(
      page.locator("aside").getByText(/Only the buyer can start checkout/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays network error when checkout request fails", async ({
    page,
  }) => {
    await enableWebPayCheckoutMode(page);
    const orderId = await createPendingOrderAsBuyer(page);

    await page.route(`**/orders/${orderId}/checkout`, async (route) => {
      await route.abort("failed");
    });

    await page.getByTestId("order-checkout-webpay").click();

    await expect(
      page.locator("aside").getByText(/Network error/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
