import { expect, test } from "@playwright/test";
import { API_BASE } from "./helpers/constants";
import {
  createListingWithCoverViaApi,
  mockDemoCoverAssets,
  mockListingWithCover,
} from "./helpers/listing-cover";

const MOCK_LISTING = mockListingWithCover(99_901);

test.beforeEach(async ({ page }) => {
  await mockDemoCoverAssets(page);
});

test("listing grid shows cover image when cover_image_url is present", async ({
  page,
}) => {
  await page.route(/\/listings(\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 1, items: [MOCK_LISTING] }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /greyscale transit ep/i })).toBeVisible({
    timeout: 15_000,
  });
  const img = page.getByTestId("listing-cover-image").first();
  await expect(img).toBeVisible({ timeout: 15_000 });
  await expect(img).toHaveAttribute("src", MOCK_LISTING.cover_image_url);
  await expect(img).toHaveAttribute(
    "alt",
    "Cover art for Greyscale Transit EP by Lumen Arc",
  );
});

test("listing grid falls back to placeholder without cover_image_url", async ({
  page,
}) => {
  const listingWithoutCover = mockListingWithCover(99_902, {
    cover_image_url: null,
  });

  await page.route(/\/listings(\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 1, items: [listingWithoutCover] }),
    });
  });

  await page.goto("/");
  await expect(page.getByTestId("listing-cover-placeholder").first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("listing-cover-image")).toHaveCount(0);
});

test("listing detail shows cover image when cover_image_url is present", async ({
  page,
}) => {
  const listingId = await createListingWithCoverViaApi();

  await page.goto(`/listings/${listingId}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/E2E Cover/, {
    timeout: 15_000,
  });
  const img = page.getByTestId("listing-cover-image");
  await expect(img).toBeVisible({ timeout: 15_000 });
  await expect(img).toHaveAttribute("src", new RegExp(`${API_BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/static/demo/covers/`));
});
