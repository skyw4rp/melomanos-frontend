import { chromium } from "@playwright/test";
import { prepareE2eSellerAccount } from "./helpers/e2e-seller-setup";
import { ensureTestUsers } from "./helpers/setup-users";

const API_BASE = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const WEB_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

async function assertReachable(url: string, label: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) {
    throw new Error(`${label} returned ${res.status} at ${url}`);
  }
}

/**
 * Fail-closed proof that the *browser* (not just this Node process) actually
 * resolves API calls to E2E_API_URL. This is the check that would have caught
 * the incident where a compiled-in fallback silently sent browser traffic to
 * the default backend regardless of E2E_API_URL/NEXT_PUBLIC_API_URL being set
 * in the shell. Do not remove: environment variables existing in the shell
 * are not proof the browser bundle actually reads them.
 */
async function assertBrowserTargetsE2eBackend(): Promise<void> {
  const expectedOrigin = new URL(API_BASE).origin;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    let observedOrigin: string | null = null;
    page.on("request", (req) => {
      if (observedOrigin) return;
      const url = req.url();
      if (url.includes("/listings")) {
        observedOrigin = new URL(url).origin;
      }
    });
    await page.goto(WEB_BASE, { waitUntil: "networkidle", timeout: 15_000 });
    if (observedOrigin !== expectedOrigin) {
      throw new Error(
        `Browser-visible API base is ${observedOrigin ?? "unknown (no /listings request observed)"}, ` +
          `expected ${expectedOrigin}. The frontend under test is not actually pointed at the ` +
          `isolated E2E backend (check NEXT_PUBLIC_API_URL was set when the frontend was started) ` +
          `- refusing to run destructive E2E against a target that could be the normal dev backend.`,
      );
    }
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(): Promise<void> {
  try {
    await assertReachable(`${API_BASE}/listings?limit=1`, "Backend");
    await assertReachable(WEB_BASE, "Frontend");
    await assertBrowserTargetsE2eBackend();
    await ensureTestUsers();
    await prepareE2eSellerAccount();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `E2E prerequisites failed: ${message}\n` +
        `Start backend (http://127.0.0.1:8000) and frontend (http://localhost:3000), ` +
        `then run: npm run test:e2e`,
    );
  }
}
