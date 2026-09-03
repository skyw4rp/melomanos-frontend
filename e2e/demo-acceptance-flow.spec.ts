import { expect, test } from "@playwright/test";
import {
  enterDemoAs,
  fetchDemoStatus,
  resetDemoViaApi,
  switchDemoIdentity,
} from "./helpers/demo-flow";
import {
  captureCheckpoint,
  createDemoRunDirectory,
  DESKTOP_VIEWPORT,
  MOBILE_VIEWPORT,
  pointLatestAtRun,
  writeManifest,
  type DemoRunManifest,
} from "./helpers/demo-flow-screenshots";
import { confirmDemoOrderPayment } from "./helpers/demo-payment";
import { expectOrderStatus, orderIdFromUrl } from "./helpers/order";
import { API_BASE, WEB_BASE_URL } from "./helpers/constants";
import { ensureTestUsers } from "./helpers/setup-users";
import { prepareE2eSellerAccount } from "./helpers/e2e-seller-setup";

/**
 * Canonical Melómanos Market acceptance flow (see workspace docs for the
 * demo scenario). Reproduces, end to end, the minimal path that proves the
 * MVP marketplace works: browse -> select -> buy -> ship -> receive ->
 * review -> revisit from the orders surface — entirely through `/demo`
 * (no manual login, no manual seed data), switching between the two seeded
 * demo identities (Comprador Demo / Vendedor Demo) via the persistent demo
 * bar instead of logging in and out.
 *
 * Requires the backend running with demo mode enabled
 * (MELOMANOS_DEMO_MODE=1 or APP_ENV=local/development/preview/test) — see
 * backend/README_DEMO_DATA.md. Skips (does not fail) when demo mode is off,
 * so this file is safe to leave in the default `npm run test:e2e` run.
 */

test.describe.configure({ mode: "serial", timeout: 180_000 });

let runDir = "";
let manifest: DemoRunManifest;
let step = 0;
let demoModeAvailable = true;

test.beforeAll(async () => {
  try {
    await fetchDemoStatus();
  } catch {
    demoModeAvailable = false;
    return;
  }

  await resetDemoViaApi();
  // `demo/reset` also clears the shared buyer@example.com / seller@example.com
  // E2E fixture accounts (they're demo-marked too — see backend/app/demo/markers.py),
  // including the pro-plan/no-listings setup global-setup.ts did for them.
  // Restore both so other spec files in the same suite run keep working
  // regardless of file execution order.
  await ensureTestUsers();
  await prepareE2eSellerAccount();

  runDir = createDemoRunDirectory();
  manifest = {
    timestamp: runDir.split(/[/\\]/).pop() ?? "unknown",
    baseURL: WEB_BASE_URL,
    apiBase: API_BASE,
    captures: [],
  };
});

test.afterAll(() => {
  if (runDir && manifest) {
    writeManifest(runDir, manifest);
    pointLatestAtRun(runDir);
  }
});

async function shoot(
  page: import("@playwright/test").Page,
  name: string,
  viewport: "desktop" | "mobile" = "desktop",
) {
  step += 1;
  const file = await captureCheckpoint(page, runDir, step, name, viewport);
  manifest.captures.push({ step, name, viewport, file });
}

test("demo acceptance flow: browse, buy, ship, receive, review", async ({
  page,
}) => {
  test.skip(!demoModeAvailable, "Demo mode not enabled on backend under test");

  // 0. Enter demo mode as the buyer — no credentials typed.
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.goto("/demo");
  await expect(page.getByTestId("demo-entry-page")).toBeVisible();
  await shoot(page, "demo-entry");

  await enterDemoAs(page, "buyer");

  // 1. HOME
  await expect(
    page.getByRole("heading", { name: /donde los vinilos cambian de manos/i }),
  ).toBeVisible();
  await shoot(page, "home");

  // 2. EXPLORAR MARKETPLACE
  await page.getByTestId("nav-marketplace").click();
  await expect(page).toHaveURL(/\/explorar/);
  await expect(page.getByTestId("marketplace-filters")).toBeVisible();
  await shoot(page, "explorar");

  // 3. BUSCAR / FILTRAR — "Lumen Arc" + status=available deterministically
  // resolves to a single seeded listing owned by the Vendedor Demo persona
  // (demo_seller_01), still available (not consumed by seeded orders) —
  // see backend/app/demo/catalog.py + personas.py for why this is stable
  // across reset --factory / seed --size medium runs.
  await page.locator("#search").fill("Lumen Arc");
  await page.locator("#status").selectOption("available");
  await page.getByTestId("marketplace-filters").getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByTestId("listing-card")).toHaveCount(1, { timeout: 15_000 });
  await shoot(page, "listing-results");

  // 4. SELECCIONAR UNA PUBLICACIÓN
  const firstCard = page.getByTestId("listing-card").first();
  await firstCard.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/listings\/\d+/, { timeout: 15_000 });
  const listingId = Number(page.url().match(/\/listings\/(\d+)/)?.[1]);
  expect(listingId).toBeGreaterThan(0);

  // 5. VER DETALLE DEL VINILO
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // 6. VER INFORMACIÓN RELEVANTE DEL VENDEDOR
  await expect(page.getByTestId("listing-seller-card")).toBeVisible({
    timeout: 15_000,
  });
  await shoot(page, "listing-detail");

  // 6b. Protected buyer-seller messaging (implemented MVP feature).
  await page.getByTestId("listing-message-toggle").click();
  await expect(page.getByTestId("message-form")).toBeVisible();
  await page
    .getByTestId("message-form-textarea")
    .fill("¿La funda está en buen estado y hace despacho a regiones?");
  await page.getByTestId("message-form-submit").click();
  await expect(page.getByTestId("message-form-success")).toBeVisible({
    timeout: 15_000,
  });
  await shoot(page, "message-sent");

  // 7. REALIZAR LA PRINCIPAL ACCIÓN DE COMPRA (Compra Segura)
  await page.getByRole("button", { name: /^comprar$/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shoot(page, "purchase-confirm-dialog");
  await page.getByRole("button", { name: /^confirmar compra$/i }).click();
  await page.waitForURL(/\/orders\/\d+/, { timeout: 20_000 });
  const orderId = orderIdFromUrl(page.url());

  await confirmDemoOrderPayment(page, orderId);

  // 8. VER CONFIRMACIÓN / ESTADO RESULTANTE
  await expect(page.getByText(new RegExp(`pedido #${orderId}`, "i"))).toBeVisible();
  await expect(page.getByTestId("order-escrow-card")).toContainText(
    /fondos retenidos/i,
    { timeout: 15_000 },
  );
  await shoot(page, "order-payment-held");

  // 9. REVISAR LA OPERACIÓN DESDE LA SUPERFICIE CORRESPONDIENTE (buyer)
  await page.goto("/orders");
  await expect(page.getByTestId("orders-page")).toBeVisible();
  await page.getByTestId("orders-tab-purchases").click();
  const purchaseRow = page
    .getByTestId("order-card")
    .filter({ hasText: `#${orderId}` });
  await expect(purchaseRow).toBeVisible({ timeout: 15_000 });
  await shoot(page, "orders-buyer-view");
  await purchaseRow.click();
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));

  // --- Change Demo User (no manual re-login) — continue as the seller ---
  await switchDemoIdentity(page);
  await expect(page.getByTestId("demo-bar-identity")).toContainText(/vendedor/i);

  await page.goto("/orders");
  await page.getByTestId("orders-tab-sales").click();
  const saleRow = page.getByTestId("order-card").filter({ hasText: `#${orderId}` });
  await expect(saleRow).toBeVisible({ timeout: 15_000 });
  await shoot(page, "orders-seller-view");
  await saleRow.click();
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
  await expect(page.getByTestId("order-shipping-form")).toBeVisible({
    timeout: 15_000,
  });

  await page.getByTestId("order-shipping-carrier").fill("Chilexpress");
  await page.getByTestId("order-shipping-tracking").fill("DEMOFLOW123");
  await page.getByTestId("order-confirm-shipping").click();
  // Generous timeout: this write-then-refetch step has been observed timing
  // out at 20s only when run deep inside the full sequential suite (backend
  // under sustained load from many prior tests) — not standalone, and not a
  // logic issue in the app (see PROJECT_STATUS.md VERIFICATION-DEBT-E2E).
  await expectOrderStatus(page, "Enviado", 40_000);
  await shoot(page, "order-shipped");

  // --- Back to the buyer to close the escrow loop ---
  await switchDemoIdentity(page);
  await expect(page.getByTestId("demo-bar-identity")).toContainText(/comprador/i);

  await page.goto(`/orders/${orderId}`);
  await page.getByTestId("order-confirm-reception").click();
  await expectOrderStatus(page, "Completado", 40_000);
  await expect(page.getByTestId("order-escrow-card")).toContainText(
    /fondos liberados/i,
    { timeout: 20_000 },
  );
  await shoot(page, "order-completed");

  await expect(page.getByTestId("order-review-form")).toBeVisible();
  await page.getByTestId("order-review-star-5").click();
  await page
    .getByTestId("order-review-comment")
    .fill("Excelente vendedor, vinilo tal como se describió.");
  await page.getByTestId("order-review-submit").click();
  await expect(page.getByTestId("order-review-success")).toBeVisible({
    timeout: 20_000,
  });
  await shoot(page, "order-review-submitted");

  // 10. Final revisit from the orders surface — completed + reviewed.
  await page.goto("/orders");
  await page.getByTestId("orders-tab-purchases").click();
  await expect(
    page.getByTestId("order-card").filter({ hasText: `#${orderId}` }),
  ).toBeVisible({ timeout: 15_000 });
  await shoot(page, "orders-final-review");

  // --- Mobile baseline for the Professional Visual Overhaul ---
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto("/");
  await shoot(page, "home", "mobile");

  await page.goto("/explorar");
  await expect(page.getByTestId("listing-card").first()).toBeVisible({
    timeout: 15_000,
  });
  await shoot(page, "explorar", "mobile");

  await page.goto(`/listings/${listingId}`);
  await expect(page.getByTestId("listing-seller-card")).toBeVisible({
    timeout: 15_000,
  });
  await shoot(page, "listing-detail", "mobile");

  await page.goto(`/orders/${orderId}`);
  await expect(page.getByTestId("order-detail-status-badge")).toBeVisible({
    timeout: 15_000,
  });
  await shoot(page, "order-detail", "mobile");

  // --- Exit demo cleanly ---
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await page.getByTestId("demo-bar-exit").click();
  await expect(page.getByTestId("demo-bar")).toHaveCount(0);
  await expect(page.getByTestId("nav-login")).toBeVisible();
});
