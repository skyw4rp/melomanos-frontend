import { expect, type Page } from "@playwright/test";

export interface FillSellListingOptions {
  title: string;
  artist?: string;
  label?: string;
  genre?: string;
  subgenre?: string;
  year?: string;
  price?: string;
  city?: string;
  description?: string;
  listingType?: "new" | "used";
  recordCondition?: string;
  coverCondition?: string;
  videoUrl?: string;
}

export interface CreateListingOptions extends FillSellListingOptions {}

/** Fills the sell form using stable data-testid selectors. */
export async function fillSellListingForm(
  page: Page,
  options: FillSellListingOptions,
): Promise<void> {
  const {
    title,
    artist = "E2E Artist",
    label = "E2E Records",
    genre = "Electronic",
    subgenre = "Techno",
    year = "1998",
    price = "19990",
    city = "Santiago",
    description = "E2E collector notes for automated tests.",
    listingType = "new",
    recordCondition = "NM",
    coverCondition = "NM",
    videoUrl,
  } = options;

  await page.getByTestId("sell-title").fill(title);
  await page.getByTestId("sell-artist").fill(artist);
  await page.getByTestId("sell-label").fill(label);
  await page.getByTestId("sell-genre").fill(genre);
  await page.getByTestId("sell-subgenre").fill(subgenre);
  await page.getByTestId("sell-year").fill(year);
  await page.getByTestId("sell-price").fill(price);
  await page.getByTestId("sell-city").fill(city);
  await page.getByTestId("sell-description").fill(description);

  await page.getByTestId("sell-listing-type").selectOption(listingType);
  await page.getByTestId("sell-record-condition").selectOption(recordCondition);
  await page.getByTestId("sell-cover-condition").selectOption(coverCondition);

  if (listingType === "used" && videoUrl) {
    await page.getByTestId("sell-video-url").fill(videoUrl);
  }
}

/** Creates a listing via /sell and returns the new listing id from the redirect URL. */
export async function createListingViaUi(
  page: Page,
  options: CreateListingOptions,
): Promise<number> {
  await page.goto("/sell");
  await expect(
    page.getByRole("heading", { name: /sell vinyl/i }),
  ).toBeVisible();

  await fillSellListingForm(page, options);
  await page.getByTestId("sell-submit").click();
  await page.waitForURL(/\/listings\/\d+/, { timeout: 25_000 });

  const match = page.url().match(/\/listings\/(\d+)/);
  expect(match).not.toBeNull();
  return Number(match![1]);
}
