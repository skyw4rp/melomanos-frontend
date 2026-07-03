import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** Manual visual-polish screenshot capture only — not part of default `npm run test:e2e`. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /visual-polish-screenshots\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
