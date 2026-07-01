import { expect, type Page } from "@playwright/test";
import {
  attachBrowserDiagnostics,
  formatBrowserDiagnostics,
} from "./failure-diagnostics";
import {
  DANIELA_DEMO_EMAIL,
  DANIELA_DEMO_PASSWORD,
  WEB_BASE_URL,
} from "./constants";

const API_CONNECTION_ERROR = /No se pudo conectar con la API/i;

export async function loginDanielaViaUi(page: Page): Promise<void> {
  const diagnostics = attachBrowserDiagnostics(page);

  try {
    await page.goto(`${WEB_BASE_URL}/login`);
    await expect(page).toHaveURL(/\/login/);

    await page.getByTestId("login-email").fill(DANIELA_DEMO_EMAIL);
    await page.getByTestId("login-password").fill(DANIELA_DEMO_PASSWORD);
    await page.getByTestId("login-submit").click();

    const successMessage = page.getByTestId("login-success");
    const formError = page.locator("form [role='alert']");

    await expect(successMessage.or(formError)).toBeVisible({ timeout: 20_000 });

    if (await formError.isVisible()) {
      const message = (await formError.textContent())?.trim() || "Login failed";
      if (API_CONNECTION_ERROR.test(message)) {
        throw new Error(`API unreachable in browser UI: ${message}`);
      }
      throw new Error(message);
    }

    await expect(successMessage).toBeVisible();

    await expect(page.getByTestId("nav-orders")).toBeVisible({
      timeout: 20_000,
    });

    const token = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(token).toBeTruthy();

    const storedUser = await page.evaluate(() =>
      localStorage.getItem("melomanos_user"),
    );
    expect(storedUser).toBeTruthy();
    expect(storedUser).toContain(DANIELA_DEMO_EMAIL);
  } catch (err) {
    const detail = formatBrowserDiagnostics(
      diagnostics.consoleErrors,
      diagnostics.failedRequests,
    );
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${message}\n\n${detail}`);
  } finally {
    diagnostics.dispose();
  }
}
