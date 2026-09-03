import { expect, type Page } from "@playwright/test";
import { API_BASE, WEB_BASE_URL } from "./constants";

export interface DemoPersona {
  role: "buyer" | "seller";
  label: string;
  email: string;
  password: string;
  name: string;
}

export interface DemoPersonas {
  buyer: DemoPersona;
  seller: DemoPersona;
}

export interface DemoStatus {
  demo_mode_enabled: boolean;
  seed_size: string;
  personas: DemoPersonas;
}

export async function fetchDemoStatus(): Promise<DemoStatus> {
  const res = await fetch(`${API_BASE}/demo/status`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Demo mode is not enabled on the backend under test (${res.status}). ` +
        `Set MELOMANOS_DEMO_MODE=1 (or APP_ENV=local) and restart the API.\n${text}`,
    );
  }
  return (await res.json()) as DemoStatus;
}

export async function resetDemoViaApi(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Demo reset failed (${res.status}): ${text}`);
  }
}

/** Enter demo mode from `/demo` as the given persona (buyer or seller). */
export async function enterDemoAs(
  page: Page,
  role: "buyer" | "seller",
): Promise<void> {
  await page.goto(`${WEB_BASE_URL}/demo`);
  await expect(page.getByTestId("demo-entry-page")).toBeVisible();

  const testId = role === "buyer" ? "demo-enter-buyer" : "demo-enter-seller";
  const button = page.getByTestId(testId);
  await expect(button).toBeVisible({ timeout: 15_000 });
  await button.click();

  await page.waitForURL(`${WEB_BASE_URL}/`, { timeout: 20_000 });
  await expect(page.getByTestId("demo-bar")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("demo-bar-identity")).toBeVisible();
}

/** Switch identity via the persistent demo bar (no re-login form). */
export async function switchDemoIdentity(page: Page): Promise<void> {
  const switchButton = page.getByTestId("demo-bar-switch");
  await expect(switchButton).toBeVisible({ timeout: 15_000 });
  await switchButton.click();
  await page.waitForURL(`${WEB_BASE_URL}/`, { timeout: 20_000 });
  await expect(page.getByTestId("demo-bar-identity")).toBeVisible();
}
