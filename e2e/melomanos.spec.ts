import { expect, test } from "@playwright/test";
import {
  login,
  loginAsBuyer,
  loginAsSeller,
  logoutViaStorage,
} from "./helpers/auth";
import { findBuyableListingId } from "./helpers/api";
import { BUYER_EMAIL, E2E_PASSWORD, SELLER_EMAIL } from "./helpers/constants";
import {
  createListingViaUi,
  fillSellListingForm,
} from "./helpers/listing";
import {
  expectOrderStatus,
  openSellingOrderFromList,
  orderIdFromUrl,
} from "./helpers/order";
import { confirmOrderPaymentForE2e } from "./helpers/payment";

test.describe.configure({ mode: "serial" });

let e2eListingId: number | null = null;

test("homepage loads marketplace", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /el lugar donde la música vive/i }),
  ).toBeVisible();
  await expect(page.getByTestId("home-hero")).toBeVisible();
  await expect(page.getByTestId("hero-cover-frame")).toBeVisible();
  await expect(page.getByTestId("trust-strip")).toBeVisible();
  await expect(page.getByTestId("marketplace-filters")).toBeVisible();
  await expect(page.getByText("Refinar búsqueda")).toBeVisible();
});

test("admin panel loads summary and tables", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: /admin panel/i }),
  ).toBeVisible();
  await page.getByTestId("admin-key-input").fill("test-admin-key");
  await page.getByTestId("admin-load-data").click();
  await expect(page.getByTestId("admin-summary-section")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("admin-summary-users_count")).toBeVisible();
  await expect(page.getByTestId("admin-disputes-section")).toBeVisible();
  await expect(page.getByTestId("admin-orders-section")).toBeVisible();
  await expect(page.getByTestId("admin-users-section")).toBeVisible();
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
  await expect(page.getByTestId("nav-orders")).toBeVisible();
  await expect(page.getByTestId("nav-sell")).toBeVisible();
});

test("after login profile loads", async ({ page }) => {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto("/profile");
  await expect(page.getByText(BUYER_EMAIL)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("profile-name")).toBeVisible();
  await expect(
    page.getByTestId("profile-header").getByText("Coleccionista", { exact: true }),
  ).toBeVisible();
});

test("sell vinyl page creates listing", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Press ${stamp}`;
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/sell");
  await expect(page.getByTestId("sell-page-title")).toHaveText("Publicar vinilo");
  await expect(page.getByTestId("sell-subscription-card")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("sell-limit-reached")).toHaveCount(0);

  await fillSellListingForm(page, {
    title,
    listingType: "new",
    recordCondition: "NM",
    coverCondition: "NM",
  });
  await page.getByTestId("sell-submit").click();
  await page.waitForURL(/\/listings\/\d+/, { timeout: 25_000 });

  const match = page.url().match(/\/listings\/(\d+)/);
  expect(match).not.toBeNull();
  e2eListingId = Number(match![1]);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
});

test("used listing requires video URL", async ({ page }) => {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/sell");
  await expect(page.getByTestId("sell-page-title")).toHaveText("Publicar vinilo");
  await expect(page.getByTestId("sell-subscription-card")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("sell-limit-reached")).toHaveCount(0);

  await fillSellListingForm(page, {
    title: `E2E Used ${Date.now()}`,
    listingType: "used",
    recordCondition: "VG+",
    coverCondition: "VG+",
  });

  await page.getByTestId("sell-submit").click();
  await expect(page.getByTestId("sell-video-error")).toContainText(
    /URL de video es obligatoria para vinilos usados/i,
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
  await expect(page.getByText(/pedido #/i)).toBeVisible();
});

test("orders page shows buying and selling tabs", async ({ page }) => {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
  await page.goto("/orders");
  await expect(page.getByTestId("orders-page")).toBeVisible();
  await expect(page.getByTestId("orders-page-title")).toHaveText(
    "Compras y ventas",
  );
  await expect(page.getByTestId("orders-tab-purchases")).toBeVisible();
  await expect(page.getByTestId("orders-tab-sales")).toBeVisible();

  await page.getByTestId("orders-tab-sales").click();
  await expect(page.getByTestId("orders-list-section")).toBeVisible();
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
  await expect(page.getByTestId("favorites-page-title")).toHaveText("Tus favoritos");
  await expect(page.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
});

test("profile shows subscription card", async ({ page }) => {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/profile");
  await expect(page.getByTestId("profile-subscription-card")).toBeVisible({
    timeout: 15_000,
  });
  const subscriptionCard = page.getByTestId("profile-subscription-card");
  await expect(page.getByTestId("profile-subscription-plan")).toHaveText("PRO");
  await expect(subscriptionCard.getByText("Plan actual")).toBeVisible();
  await expect(subscriptionCard.getByText("Publicaciones activas")).toBeVisible();
  await expect(subscriptionCard.getByText(/PRO: publicaciones ilimitadas/i)).toBeVisible();
});

test("profile shows Digging Score", async ({ page }) => {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/profile");
  const panel = page.getByTestId("digging-score-panel");
  await expect(panel).toBeVisible({ timeout: 15_000 });
  const hasScore = await page.getByTestId("digging-score-value").isVisible();
  const hasFallback = await page.getByTestId("digging-score-fallback").isVisible();
  expect(hasScore || hasFallback).toBe(true);
  if (hasScore) {
    await expect(page.getByTestId("digging-score-level")).toBeVisible();
    await expect(page.getByTestId("digging-score-progress")).toBeVisible();
  }
});

test("listing detail seller card shows Digging Score", async ({ page }) => {
  const listingId = e2eListingId ?? (await findBuyableListingId());
  test.skip(!listingId, "No listing available for Digging Score E2E");

  await page.goto(`/listings/${listingId}`);
  const panel = page.getByTestId("digging-score-panel");
  await expect(panel).toBeVisible({ timeout: 15_000 });
  const hasScore = await page.getByTestId("digging-score-value").isVisible();
  const hasLevel = await page.getByTestId("digging-score-level").isVisible();
  expect(hasScore || hasLevel).toBe(true);
});

test("seller can update shipping profile", async ({ page }) => {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/profile");
  await expect(page.getByTestId("shipping-profile-section")).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId("shipping-profile-origin-city").fill("Santiago");
  await page.getByTestId("shipping-profile-dispatch-hours").fill("24");
  await page.getByTestId("shipping-profile-courier-Chilexpress").check();
  await page.getByTestId("shipping-profile-courier-Starken").check();
  await page.getByTestId("shipping-profile-notes").fill(
    "Despacho de lunes a viernes",
  );

  await page.getByTestId("shipping-profile-save").click();
  await expect(page.getByTestId("shipping-profile-success")).toContainText(
    "Perfil de despacho actualizado.",
    { timeout: 15_000 },
  );
});

test("sell page shows subscription usage", async ({ page }) => {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
  await page.goto("/sell");
  await expect(page.getByTestId("sell-subscription-card")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("sell-subscription-usage")).toContainText(
    /Publicaciones ilimitadas/i,
  );
  await expect(
    page.getByTestId("sell-subscription-card").getByText("Tu plan", { exact: true }),
  ).toBeVisible();
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
  await expect(page.getByTestId("messages-page")).toBeVisible();
  await expect(page.getByTestId("messages-page-title")).toHaveText("Mensajes");
  await expect(page.getByTestId("messages-list").getByText("Conversaciones")).toBeVisible();
});

test("buyer can open dispute and add evidence", async ({ page }) => {
  test.setTimeout(120_000);

  const stamp = Date.now();
  const listingTitle = `E2E Dispute ${stamp}`;
  const disputeReason = "El vinilo llegó con una raya visible";

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
  await confirmOrderPaymentForE2e(page, orderId);
  await expectOrderStatus(page, "Preparando envío");

  await logoutViaStorage(page);
  await loginAsSeller(page);
  await openSellingOrderFromList(page, orderId, { waitForShippingForm: true });
  await page.getByTestId("order-shipping-carrier").fill("Chilexpress");
  await page.getByTestId("order-shipping-tracking").fill("DISPUTE123");
  await page.getByTestId("order-confirm-shipping").click();
  await expectOrderStatus(page, "Enviado");

  await logoutViaStorage(page);
  await loginAsBuyer(page);
  await page.goto(`/orders/${orderId}`);
  await expect(page.getByTestId("order-dispute-section")).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId("order-dispute-open-toggle").click();
  await page.getByTestId("order-dispute-reason").fill(disputeReason);
  await page.getByTestId("order-dispute-submit").click();

  await expect(page.getByTestId("order-dispute-card")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("order-dispute-reason-display")).toContainText(
    disputeReason,
  );
  await expect(page.getByTestId("order-dispute-funds-held")).toContainText(
    /fondos permanecen retenidos/i,
  );
  await expectOrderStatus(page, "En disputa");

  await page
    .getByTestId("order-dispute-evidence-url")
    .fill("https://example.com/evidence.jpg");
  await page.getByTestId("order-dispute-evidence-type").selectOption("photo");
  await page
    .getByTestId("order-dispute-evidence-comment")
    .fill("Raya visible en lado A");
  await page.getByTestId("order-dispute-evidence-submit").click();

  await expect(
    page.getByRole("link", { name: /evidence\.jpg/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Raya visible en lado A")).toBeVisible();
});

test("admin can resolve dispute for buyer", async ({ page }) => {
  test.setTimeout(120_000);

  const stamp = Date.now();
  const listingTitle = `E2E Admin Dispute ${stamp}`;
  const disputeReason = "El vinilo llegó con una raya visible";

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
  await confirmOrderPaymentForE2e(page, orderId);
  await expectOrderStatus(page, "Preparando envío");

  await logoutViaStorage(page);
  await loginAsSeller(page);
  await openSellingOrderFromList(page, orderId, { waitForShippingForm: true });
  await page.getByTestId("order-shipping-carrier").fill("Chilexpress");
  await page.getByTestId("order-shipping-tracking").fill("ADMINDISPUTE1");
  await page.getByTestId("order-confirm-shipping").click();
  await expectOrderStatus(page, "Enviado");

  await logoutViaStorage(page);
  await loginAsBuyer(page);
  await page.goto(`/orders/${orderId}`);
  await page.getByTestId("order-dispute-open-toggle").click();
  await page.getByTestId("order-dispute-reason").fill(disputeReason);
  await page.getByTestId("order-dispute-submit").click();
  await expect(page.getByTestId("order-dispute-card")).toBeVisible({
    timeout: 15_000,
  });

  await page
    .getByTestId("order-dispute-evidence-url")
    .fill("https://example.com/evidence.jpg");
  await page.getByTestId("order-dispute-evidence-type").selectOption("photo");
  await page
    .getByTestId("order-dispute-evidence-comment")
    .fill("Raya visible en lado A");
  await page.getByTestId("order-dispute-evidence-submit").click();

  await page.getByTestId("order-dispute-admin-key").fill("test-admin-key");
  await page.getByTestId("order-dispute-admin-under-review").click();
  await expect(page.getByTestId("order-dispute-admin-success")).toContainText(
    /en revisión/i,
    { timeout: 15_000 },
  );

  await page.getByTestId("order-dispute-admin-resolve-buyer").click();
  await expect(page.getByTestId("order-dispute-admin-success")).toContainText(
    /comprador/i,
    { timeout: 15_000 },
  );

  await expect(page.getByTestId("order-dispute-status")).toHaveAttribute(
    "data-dispute-status",
    "resolved_buyer",
  );
  await expectOrderStatus(page, "Reembolsado");
  await expect(page.getByTestId("order-escrow-card")).toContainText(
    /Reembolsado/i,
    { timeout: 15_000 },
  );
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
  await expect(page.getByText(new RegExp(`pedido #${orderId}`, "i"))).toBeVisible();

  await confirmOrderPaymentForE2e(page, orderId);
  await expectOrderStatus(page, "Preparando envío");
  await expect(page.getByTestId("order-escrow-card")).toContainText(
    /Fondos retenidos/i,
    { timeout: 15_000 },
  );

  await logoutViaStorage(page);
  await loginAsSeller(page);
  await openSellingOrderFromList(page, orderId, { waitForShippingForm: true });

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

  await expect(page.getByTestId("order-detail-tracking")).toBeVisible();
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
});
