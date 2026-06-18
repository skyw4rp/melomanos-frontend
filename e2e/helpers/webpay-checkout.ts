import { expect, type Page } from "@playwright/test";
import { loginAsBuyer, loginAsSeller, logoutViaStorage } from "./auth";
import { createListingViaUi } from "./listing";
import { orderIdFromUrl } from "./order";

export const WEBPAY_MODE_STORAGE_KEY = "melomanos_payment_mode";

export async function enableWebPayCheckoutMode(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "webpay_placeholder");
  }, WEBPAY_MODE_STORAGE_KEY);
}

export async function createPendingOrderAsBuyer(page: Page): Promise<number> {
  const stamp = Date.now();
  const listingTitle = `E2E WebPay ${stamp}`;

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
