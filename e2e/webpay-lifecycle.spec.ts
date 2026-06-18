import { expect, test } from "@playwright/test";
import { loginAsBuyer, loginAsSeller, logoutViaStorage } from "./helpers/auth";
import { confirmOrderPaymentForE2e, retryWebPayCheckoutAfterCancel } from "./helpers/payment";
import { createListingViaUi } from "./helpers/listing";
import {
  expectOrderStatus,
  openSellingOrderFromList,
  orderIdFromUrl,
} from "./helpers/order";
import {
  completeWebPayPlaceholderPayment,
  enableWebPayCheckoutMode,
  getOrderApi,
  probeBackendWebPayPlaceholderReady,
} from "./helpers/webpay-checkout";
import { loginForApi } from "./helpers/auth-api";
import { BUYER_EMAIL } from "./helpers/constants";

test.describe("WebPay placeholder full lifecycle (Phase 6)", () => {
  test.beforeAll(async () => {
    const ready = await probeBackendWebPayPlaceholderReady();
    if (!ready) {
      throw new Error(
        "WebPay placeholder E2E requires backend PAYMENT_PROVIDER_MODE=webpay_placeholder " +
          "and WEBPAY_CALLBACK_SECRET. Restart backend with e2e-webpay.env or set env vars.",
      );
    }
  });

  test("buyer pays via placeholder sandbox through order completion and review", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const stamp = Date.now();
    const listingTitle = `E2E WebPay Lifecycle ${stamp}`;
    const reviewComment =
      "Excelente vendedor, pago WebPay placeholder y envío impecable.";

    await enableWebPayCheckoutMode(page);

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

    const orderId = orderIdFromUrl(page.url());
    const buyerToken = await loginForApi(BUYER_EMAIL);

    const session = await completeWebPayPlaceholderPayment(page, orderId);
    expect(session.provider).toBe("webpay_placeholder");
    expect(session.checkout_session_id).toBeGreaterThan(0);

    await expect(page.getByTestId("order-checkout-notice")).toContainText(
      "Payment submitted successfully.",
      { timeout: 15_000 },
    );
    await expect(page.getByTestId("order-escrow-card")).toContainText(
      /Fondos retenidos/i,
      { timeout: 15_000 },
    );

    await logoutViaStorage(page);
    await loginAsSeller(page);
    await openSellingOrderFromList(page, orderId);

    await expect(page.getByTestId("order-shipping-form")).toBeVisible();
    await page.getByTestId("order-shipping-carrier").fill("Chilexpress");
    await page.getByTestId("order-shipping-tracking").fill("WEBPAY123456");
    await page
      .getByTestId("order-shipping-url")
      .fill("https://www.chilexpress.cl");
    await page
      .getByTestId("order-shipping-notes")
      .fill("Enviado tras pago WebPay placeholder");
    await page.getByTestId("order-confirm-shipping").click();
    await expectOrderStatus(page, "Enviado");

    await logoutViaStorage(page);
    await loginAsBuyer(page);
    await page.goto(`/orders/${orderId}`);
    await page.getByTestId("order-confirm-reception").click();
    await expectOrderStatus(page, "Completado");
    await expect(page.getByTestId("order-escrow-card")).toContainText(
      /Fondos liberados/i,
      { timeout: 15_000 },
    );

    await expect(page.getByTestId("order-review-form")).toBeVisible();
    await page.getByTestId("order-review-star-5").click();
    await page.getByTestId("order-review-comment").fill(reviewComment);
    await page.getByTestId("order-review-submit").click();

    await expect(page.getByTestId("order-review-success")).toContainText(
      /Review enviada\. Gracias por fortalecer la comunidad Melómanos\./i,
      { timeout: 20_000 },
    );

    const completedOrder = await getOrderApi(orderId, buyerToken);
    expect(completedOrder.status).toBe("completed");
    expect(completedOrder.payment_status).toBe("released");
  });

  test("cancelled checkout can be retried and then completes payment", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await enableWebPayCheckoutMode(page);

    const stamp = Date.now();
    await logoutViaStorage(page);
    await loginAsSeller(page);
    const listingId = await createListingViaUi(page, {
      title: `E2E WebPay Cancel ${stamp}`,
      listingType: "new",
      recordCondition: "NM",
      coverCondition: "NM",
    });

    await logoutViaStorage(page);
    await loginAsBuyer(page);
    await page.goto(`/listings/${listingId}`);
    await page.getByRole("button", { name: /^comprar$/i }).click();
    await page.waitForURL(/\/orders\/\d+/, { timeout: 25_000 });

    const orderId = orderIdFromUrl(page.url());
    await retryWebPayCheckoutAfterCancel(page, orderId);
    await expect(page.getByTestId("order-escrow-card")).toContainText(
      /Fondos retenidos/i,
      { timeout: 15_000 },
    );
  });
});

test.describe("Dual-mode payment helper", () => {
  test("confirmOrderPaymentForE2e works with current backend payment mode", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const stamp = Date.now();
    await logoutViaStorage(page);
    await loginAsSeller(page);
    const listingId = await createListingViaUi(page, {
      title: `E2E Payment Helper ${stamp}`,
      listingType: "new",
      recordCondition: "NM",
      coverCondition: "NM",
    });

    await logoutViaStorage(page);
    await loginAsBuyer(page);
    await page.goto(`/listings/${listingId}`);
    await page.getByRole("button", { name: /^comprar$/i }).click();
    await page.waitForURL(/\/orders\/\d+/, { timeout: 25_000 });

    const orderId = orderIdFromUrl(page.url());
    await confirmOrderPaymentForE2e(page, orderId);
    await expect(page.getByTestId("order-escrow-card")).toContainText(
      /Fondos retenidos/i,
      { timeout: 15_000 },
    );
  });
});
