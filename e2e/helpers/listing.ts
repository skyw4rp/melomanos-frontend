import { expect, type Page } from "@playwright/test";

export interface CreateListingOptions {
  title: string;
  artist?: string;
  genre?: string;
  price?: string;
  city?: string;
}

/** Creates a listing via /sell and returns the new listing id from the redirect URL. */
export async function createListingViaUi(
  page: Page,
  options: CreateListingOptions,
): Promise<number> {
  const {
    title,
    artist = "E2E Artist",
    genre = "Electronic",
    price = "19990",
    city = "Santiago",
  } = options;

  await page.goto("/sell");
  await expect(
    page.getByRole("heading", { name: /sell vinyl/i }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: /title/i }).fill(title);
  await page.getByRole("textbox", { name: /artist/i }).fill(artist);
  await page.locator("#genre").fill(genre);
  await page.getByRole("spinbutton", { name: /price/i }).fill(price);
  await page.getByRole("textbox", { name: /city/i }).fill(city);

  await page.getByRole("button", { name: /publish to crate/i }).click();
  await page.waitForURL(/\/listings\/\d+/, { timeout: 25_000 });

  const match = page.url().match(/\/listings\/(\d+)/);
  expect(match).not.toBeNull();
  return Number(match![1]);
}
