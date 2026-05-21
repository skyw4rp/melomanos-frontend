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

/** Opens a selling order from /orders → Ventas (cards use Listing #id, not title). */
export async function openSellingOrderFromList(
  page: Page,
  orderId: number,
): Promise<void> {
  await page.goto("/orders");
  await page.getByRole("button", { name: "Ventas" }).click();
  const orderLink = page.locator(`a[href="/orders/${orderId}"]`);
  await expect(orderLink).toBeVisible({ timeout: 20_000 });
  await orderLink.click();
  await expect(page).toHaveURL(`/orders/${orderId}`);
}
