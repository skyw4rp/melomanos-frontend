import { expect, test } from "@playwright/test";
import { loginDanielaViaUi } from "./helpers/demo-daniela-login";
import { DANIELA_DEMO_EMAIL, WEB_BASE_URL } from "./helpers/constants";

/**
 * Reproduces Ernesto's manual demo login flow:
 * http://localhost:3000/login -> Daniela credentials -> logged-in navbar.
 *
 * Uses the real running frontend + backend (no API shortcuts, no mocks).
 */
test.describe("Demo Daniela login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_BASE_URL);
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("melomanos_user");
    });
  });

  test("Daniela demo login via browser UI", async ({ page }) => {
    await loginDanielaViaUi(page);

    await expect(page.getByTestId("nav-login")).toHaveCount(0);
    await expect(page.getByTestId("nav-orders")).toBeVisible();
    await expect(page.getByTestId("nav-sell")).toBeVisible();

    await page.goto(`${WEB_BASE_URL}/profile`);
    await expect(page.getByText(DANIELA_DEMO_EMAIL)).toBeVisible({
      timeout: 15_000,
    });
  });
});
