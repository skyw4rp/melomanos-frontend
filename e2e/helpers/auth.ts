import { expect, type Page } from "@playwright/test";
import { BUYER_EMAIL, E2E_PASSWORD, SELLER_EMAIL } from "./constants";

export async function loginAsBuyer(page: Page): Promise<void> {
  await login(page, BUYER_EMAIL, E2E_PASSWORD);
}

export async function loginAsSeller(page: Page): Promise<void> {
  await login(page, SELLER_EMAIL, E2E_PASSWORD);
}

export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  const ordersLink = page.getByRole("link", { name: "Orders" });
  const formError = page.locator("form [role='alert']");

  try {
    await expect(ordersLink).toBeVisible({ timeout: 20_000 });
  } catch {
    if (await formError.isVisible()) {
      const message = (await formError.textContent())?.trim() || "Login failed";
      throw new Error(message);
    }
    throw new Error("Login did not complete — Orders link not visible");
  }
}

export async function logoutViaStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("melomanos_user");
  });
}
