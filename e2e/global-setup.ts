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

export default async function globalSetup(): Promise<void> {
  try {
    await assertReachable(`${API_BASE}/listings?limit=1`, "Backend");
    await assertReachable(WEB_BASE, "Frontend");
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
