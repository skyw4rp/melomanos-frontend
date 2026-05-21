import { expect, test } from "@playwright/test";
import { login, logoutViaStorage } from "./helpers/auth";
import { findBuyableListingId } from "./helpers/api";
import { BUYER_EMAIL, E2E_PASSWORD, SELLER_EMAIL } from "./helpers/constants";

test.describe.configure({ mode: "serial" });

let e2eListingId: number | null = null;

test("homepage loads marketplace", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /vinyl & electronic marketplace/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /filter crate/i })).toBeVisible();
});

test("protected pages redirect to login with next", async ({ page }) => {
  await logoutViaStorage(page);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);

  await page.goto("/favorites");
  await expect(page).toHaveURL(/\/login\?next=%2Ffavorites/);

  await page.goto("/messages");
  await expect(page).toHaveURL(/\/login\?next=%2Fmessages/);

  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Forders/);

  await page.goto("/sell");
  await expect(page).toHaveURL(/\/login\?next=%2Fsell/);
});

test("login works", async ({ page }) => {
  await logoutViaStorage(page);
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
  await expect(page.getByRole("link", { name: /sell vinyl/i })).toBeVisible();
});

test("after login profile loads", async ({ page }) => {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto("/profile");
  await expect(page.getByText(BUYER_EMAIL)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("main").getByText("Collector")).toBeVisible();
});

test("sell vinyl page creates listing", async ({ page }) => {
  const stamp = Date.now();
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/sell");
  await expect(
    page.getByRole("heading", { name: /sell vinyl/i }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: /title/i }).fill(`E2E Press ${stamp}`);
  await page.getByRole("textbox", { name: /artist/i }).fill("E2E Artist");
  await page.locator("#genre").fill("Electronic");
  await page.getByRole("spinbutton", { name: /price/i }).fill("19990");
  await page.getByRole("textbox", { name: /city/i }).fill("Santiago");

  await page.getByRole("button", { name: /publish to crate/i }).click();
  await page.waitForURL(/\/listings\/\d+/, { timeout: 25_000 });

  const match = page.url().match(/\/listings\/(\d+)/);
  expect(match).not.toBeNull();
  e2eListingId = Number(match![1]);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    `E2E Press ${stamp}`,
  );
});

test("listing detail buy button creates order", async ({ page }) => {
  const listingId = e2eListingId ?? (await findBuyableListingId());
  test.skip(!listingId, "No buyable listing available for E2E");

  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto(`/listings/${listingId}`);
  await page.getByRole("button", { name: /^comprar$/i }).click();
  await page.waitForURL(/\/orders\/\d+/, { timeout: 20_000 });
  await expect(page.getByText(/order #/i)).toBeVisible();
});

test("orders page shows buying and selling tabs", async ({ page }) => {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto("/orders");
  await expect(
    page.getByRole("heading", { name: "Orders", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Compras" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ventas" })).toBeVisible();

  await page.getByRole("button", { name: "Ventas" }).click();
  await expect(page.locator("section")).toBeVisible();
});

test("favorites flow", async ({ page }) => {
  const listingId = e2eListingId ?? (await findBuyableListingId());
  test.skip(!listingId, "No listing available for favorites E2E");

  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto(`/listings/${listingId}`);

  const favButton = page
    .locator("div.grid.gap-2")
    .first()
    .getByRole("button", { name: /^favorito$/i });
  const favLabel = (await favButton.textContent()) ?? "";
  if (!favLabel.toLowerCase().includes("favoritos")) {
    await favButton.click();
    await expect(
      page.locator("div.grid.gap-2").first().getByRole("button", {
        name: /en favoritos/i,
      }),
    ).toBeVisible({ timeout: 10_000 });
  }

  await page.goto("/favorites");
  await expect(
    page.getByRole("heading", { name: /your favorites/i }),
  ).toBeVisible();
  await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
});

test("messages page loads", async ({ page }) => {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto("/messages");
  await expect(
    page.getByRole("heading", { name: "Messages", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Inbox")).toBeVisible();
});
