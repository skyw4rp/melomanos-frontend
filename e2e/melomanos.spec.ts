import { expect, test } from "@playwright/test";
import {
  login,
  loginAsBuyer,
  loginAsSeller,
  logoutViaStorage,
} from "./helpers/auth";
import { findBuyableListingId } from "./helpers/api";
import { BUYER_EMAIL, E2E_PASSWORD, SELLER_EMAIL } from "./helpers/constants";
import { createListingViaUi, fillSellListingForm } from "./helpers/listing";
import {
  expectOrderStatus,
  openSellingOrderFromList,
  orderIdFromUrl,
} from "./helpers/order";

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
  const title = `E2E Press ${stamp}`;
  await login(page, SELLER_EMAIL, E2E_PASSWORD);

  e2eListingId = await createListingViaUi(page, {
    title,
    listingType: "new",
    recordCondition: "NM",
    coverCondition: "NM",
  });

  await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
});

test("used listing requires video URL", async ({ page }) => {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/sell");
  await expect(
    page.getByRole("heading", { name: /sell vinyl/i }),
  ).toBeVisible();

  await fillSellListingForm(page, {
    title: `E2E Used ${Date.now()}`,
    listingType: "used",
    recordCondition: "VG+",
    coverCondition: "VG+",
  });

  await page.getByTestId("sell-submit").click();
  await expect(page.getByTestId("sell-video-error")).toContainText(
    /Video URL is required for used listings/i,
  );
  await expect(page).toHaveURL(/\/sell$/);
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

test("listing message blocks contact leak and allows collector questions", async ({
  page,
}) => {
  const listingId = e2eListingId ?? (await findBuyableListingId());
  test.skip(!listingId, "No listing available for messaging E2E");

  await loginAsBuyer(page);
  await page.goto(`/listings/${listingId}`);
  await page.getByTestId("listing-message-toggle").click();
  await expect(page.getByTestId("message-form")).toBeVisible();

  await page.getByTestId("message-form-textarea").fill("wsp +56912345678");
  await page.getByTestId("message-form-submit").click();

  const warning = page.getByTestId("message-blocked-warning");
  await expect(warning).toBeVisible({ timeout: 15_000 });
  await expect(warning).toContainText("Mensaje bloqueado por seguridad");
  await expect(warning).toContainText(
    /mantén la compra y comunicación dentro de Melómanos/i,
  );

  const allowedMessage = "¿Tiene insert y la funda está VG+ real?";
  await page.getByTestId("message-form-textarea").fill(allowedMessage);
  await page.getByTestId("message-form-submit").click();

  await expect(page.getByTestId("message-form-success")).toContainText(
    /Mensaje enviado/i,
    { timeout: 15_000 },
  );
});

test("messages page loads", async ({ page }) => {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto("/messages");
  await expect(
    page.getByRole("heading", { name: "Messages", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Inbox")).toBeVisible();
});

test("full order lifecycle with tracking and review", async ({ page }) => {
  test.setTimeout(120_000);

  const stamp = Date.now();
  const listingTitle = `E2E Lifecycle ${stamp}`;
  const reviewComment =
    "Excelente vendedor, envío rápido y vinilo en buen estado.";

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
  await expect(page.getByText(new RegExp(`order #${orderId}`, "i"))).toBeVisible();

  await page.getByTestId("order-confirm-payment").click();
  await expectOrderStatus(page, "Pendiente de envío");

  await logoutViaStorage(page);
  await loginAsSeller(page);
  await openSellingOrderFromList(page, orderId);

  await expect(page.getByTestId("order-shipping-form")).toBeVisible();
  await page.getByTestId("order-shipping-carrier").fill("Chilexpress");
  await page.getByTestId("order-shipping-tracking").fill("TEST123456");
  await page
    .getByTestId("order-shipping-url")
    .fill("https://www.chilexpress.cl");
  await page
    .getByTestId("order-shipping-notes")
    .fill("Enviado desde Santiago");
  await page.getByTestId("order-confirm-shipping").click();
  await expectOrderStatus(page, "Enviado");

  await expect(page.getByTestId("order-tracking-section")).toBeVisible();
  await expect(page.getByTestId("order-tracking-number")).toHaveText(
    "TEST123456",
  );
  await expect(page.getByText("Chilexpress")).toBeVisible();
  await expect(page.getByText("Enviado desde Santiago")).toBeVisible();

  await logoutViaStorage(page);
  await loginAsBuyer(page);
  await page.goto(`/orders/${orderId}`);
  await page.getByTestId("order-confirm-reception").click();
  await expectOrderStatus(page, "Completado");

  await expect(page.getByTestId("order-review-form")).toBeVisible();
  await page.getByTestId("order-review-star-5").click();
  await page.getByTestId("order-review-comment").fill(reviewComment);
  await page.getByTestId("order-review-submit").click();

  await expect(page.getByTestId("order-review-success")).toContainText(
    /Review enviada\. Gracias por fortalecer la comunidad Melómanos\./i,
    { timeout: 20_000 },
  );
});
