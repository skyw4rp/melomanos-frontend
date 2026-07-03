import { expect, test } from "@playwright/test";
import {
  API_BASE,
  DANIELA_DEMO_EMAIL,
  WEB_BASE_URL,
} from "./helpers/constants";
import { loginDanielaViaUi } from "./helpers/demo-daniela-login";
import {
  captureFullPage,
  captureSurfaceBothViewports,
  createRunDirectory,
  discoverListingId,
  discoverOrderIdForEmail,
  gitInfo,
  type VisualPolishManifest,
  writeManifest,
  DESKTOP_VIEWPORT,
  MOBILE_VIEWPORT,
} from "./helpers/visual-polish-screenshots";

test.describe.configure({ mode: "serial", timeout: 600_000 });

let runDir = "";
let manifest: VisualPolishManifest;
let listingId: number | null = null;
let orderId: number | null = null;

test.beforeAll(async () => {
  runDir = createRunDirectory();
  listingId = await discoverListingId();
  orderId = await discoverOrderIdForEmail(DANIELA_DEMO_EMAIL);

  const git = gitInfo();
  manifest = {
    timestamp: runDir.split(/[/\\]/).pop() ?? "unknown",
    baseURL: WEB_BASE_URL,
    apiBase: API_BASE,
    gitBranch: git.gitBranch,
    gitSha: git.gitSha,
    viewports: {
      desktop: DESKTOP_VIEWPORT,
      mobile: MOBILE_VIEWPORT,
    },
    dynamicIds: {
      listingId: listingId ?? undefined,
      orderId: orderId ?? undefined,
    },
    captures: [],
    skipped: [],
    errors: [],
  };

  if (listingId == null) {
    manifest.skipped.push({
      route: "/listings/[id]",
      surface: "listing-detail",
      reason: "No demo listing found via API",
    });
  }

  if (orderId == null) {
    manifest.skipped.push({
      route: "/orders/[id]",
      surface: "order-detail",
      reason: "No buying/selling order found for Daniela demo user",
    });
  }
});

test.afterAll(async () => {
  if (runDir && manifest) {
    writeManifest(runDir, manifest);
  }
});

test("capture full-site visual polish screenshots", async ({ page }) => {
  // --- Public / logged-out (fresh browser context — no logout needed) ---
  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "home",
    surface: "home-logged-out",
    route: "/",
    auth: "logged-out",
    filenameStem: "logged-out",
  });

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "login",
    surface: "login",
    route: "/login",
    auth: "logged-out",
    filenameStem: "login",
  });

  if (listingId != null) {
    const listingRoute = `/listings/${listingId}`;
    await captureSurfaceBothViewports({
      page,
      runDir,
      manifest,
      subfolder: "listing-detail",
      surface: "listing-detail-logged-out",
      route: listingRoute,
      auth: "logged-out",
      filenameStem: "logged-out",
    });
  }

  // --- Authenticated (Daniela demo) ---
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await loginDanielaViaUi(page);

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "home",
    surface: "home-logged-in",
    route: "/",
    auth: "logged-in",
    filenameStem: "logged-in",
  });

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "sell",
    surface: "sell",
    route: "/sell",
    auth: "logged-in",
    filenameStem: "sell",
  });

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "favorites",
    surface: "favorites",
    route: "/favorites",
    auth: "logged-in",
    filenameStem: "favorites",
  });

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "orders",
    surface: "orders",
    route: "/orders",
    auth: "logged-in",
    filenameStem: "orders",
  });

  if (orderId != null) {
    const orderRoute = `/orders/${orderId}`;
    await captureSurfaceBothViewports({
      page,
      runDir,
      manifest,
      subfolder: "order-detail",
      surface: "order-detail",
      route: orderRoute,
      auth: "logged-in",
      filenameStem: "order-detail",
    });
  }

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "messages",
    surface: "messages",
    route: "/messages",
    auth: "logged-in",
    filenameStem: "messages",
  });

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "notifications",
    surface: "notifications-page",
    route: "/notifications",
    auth: "logged-in",
    filenameStem: "notifications-page",
  });

  await captureSurfaceBothViewports({
    page,
    runDir,
    manifest,
    subfolder: "profile",
    surface: "profile",
    route: "/profile",
    auth: "logged-in",
    filenameStem: "profile",
  });

  if (listingId != null) {
    const listingRoute = `/listings/${listingId}`;

    await captureSurfaceBothViewports({
      page,
      runDir,
      manifest,
      subfolder: "listing-detail",
      surface: "listing-detail-logged-in",
      route: listingRoute,
      auth: "logged-in",
      filenameStem: "logged-in",
    });

    for (const [viewportName, viewport] of [
      ["desktop", DESKTOP_VIEWPORT],
      ["mobile", MOBILE_VIEWPORT],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.goto(listingRoute);
      await page.getByTestId("listing-message-toggle").click();
      await expect(page.getByTestId("message-form")).toBeVisible({
        timeout: 15_000,
      });
      const file = await captureFullPage(
        page,
        runDir,
        "listing-detail",
        `message-form-expanded-${viewportName}-${viewport.width}.png`,
      );
      manifest.captures.push({
        route: listingRoute,
        surface: "listing-detail-message-form-expanded",
        auth: "logged-in",
        viewport: viewportName,
        file,
        status: "captured",
      });
    }
  }

  for (const [viewportName, viewport] of [
    ["desktop", DESKTOP_VIEWPORT],
    ["mobile", MOBILE_VIEWPORT],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByTestId("notifications-bell").click();
    await expect(page.getByTestId("notifications-dropdown")).toBeVisible({
      timeout: 15_000,
    });
    const file = await captureFullPage(
      page,
      runDir,
      "notifications",
      `notifications-dropdown-open-${viewportName}-${viewport.width}.png`,
    );
    manifest.captures.push({
      route: "/",
      surface: "notifications-dropdown-open",
      auth: "logged-in",
      viewport: viewportName,
      file,
      status: "captured",
    });
  }

  // --- Admin (optional / internal) ---
  try {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /admin panel/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("admin-key-input").fill("test-admin-key");
    await page.getByTestId("admin-load-data").click();
    await expect(page.getByTestId("admin-summary-section")).toBeVisible({
      timeout: 20_000,
    });

    const adminDesktop = await captureFullPage(
      page,
      runDir,
      "admin",
      "admin-loaded-desktop-1440.png",
    );
    manifest.captures.push({
      route: "/admin",
      surface: "admin-loaded",
      auth: "logged-in",
      viewport: "desktop",
      file: adminDesktop,
      status: "captured",
    });

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/admin");
    await page.getByTestId("admin-key-input").fill("test-admin-key");
    await page.getByTestId("admin-load-data").click();
    await expect(page.getByTestId("admin-summary-section")).toBeVisible({
      timeout: 20_000,
    });

    const adminMobile = await captureFullPage(
      page,
      runDir,
      "admin",
      "admin-loaded-mobile-390.png",
    );
    manifest.captures.push({
      route: "/admin",
      surface: "admin-loaded",
      auth: "logged-in",
      viewport: "mobile",
      file: adminMobile,
      status: "captured",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    manifest.errors.push({
      route: "/admin",
      surface: "admin-loaded",
      message,
    });
    manifest.skipped.push({
      route: "/admin",
      surface: "admin-loaded",
      reason: `Admin capture failed: ${message}`,
    });
  }

  writeManifest(runDir, manifest);
});
