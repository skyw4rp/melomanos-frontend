import { expect, type Page } from "@playwright/test";

export function orderIdFromUrl(url: string): number {
  const match = url.match(/\/orders\/(\d+)/);
  expect(match).not.toBeNull();
  return Number(match![1]);
}

export async function expectOrderStatus(
  page: Page,
  label: string,
  timeout = 20_000,
): Promise<void> {
  await expect(page.getByTestId("order-status")).toContainText(label, { timeout });
}

/**
 * Open an order by id (direct navigation — deterministic for E2E).
 * Optionally wait until the seller shipping form is visible (pending_shipping only).
 */
export async function openSellingOrderFromList(
  page: Page,
  orderId: number,
  options?: { waitForShippingForm?: boolean },
): Promise<void> {
  await page.goto(`/orders/${orderId}`);
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}(\\?.*)?$`));
  await expect(page.getByTestId("order-status")).toBeVisible({ timeout: 20_000 });
  if (options?.waitForShippingForm) {
    await expect(page.getByTestId("order-shipping-form")).toBeVisible({
      timeout: 20_000,
    });
  }
}
