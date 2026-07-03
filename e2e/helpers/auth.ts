import { expect, type Page } from "@playwright/test";
import { BUYER_EMAIL, E2E_PASSWORD, SELLER_EMAIL } from "./constants";

export async function loginAsBuyer(page: Page): Promise<void> {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
}

export async function loginAsSeller(page: Page): Promise<void> {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
}

export async function openAccountMenu(page: Page): Promise<void> {
  const trigger = page.getByTestId("nav-account-menu");
  await expect(trigger).toBeVisible({ timeout: 20_000 });
  const dropdown = page.getByTestId("nav-account-dropdown");
  if (!(await dropdown.isVisible())) {
    await trigger.click();
  }
  await expect(dropdown).toBeVisible({ timeout: 10_000 });
}

export async function expectLoggedInAccountNav(page: Page): Promise<void> {
  await openAccountMenu(page);
  await expect(page.getByTestId("nav-orders")).toBeVisible();
  await expect(page.getByTestId("nav-sell")).toBeVisible();
}

export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();

  const accountMenu = page.getByTestId("nav-account-menu");
  const formError = page.locator("form [role='alert']");

  try {
    await expect(accountMenu).toBeVisible({ timeout: 20_000 });
    await expectLoggedInAccountNav(page);
  } catch {
    if (await formError.isVisible()) {
      const message = (await formError.textContent())?.trim() || "Login failed";
      throw new Error(message);
    }
    throw new Error("Login did not complete — account menu not visible");
  }
}

export async function logoutViaStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("melomanos_user");
  });
}
