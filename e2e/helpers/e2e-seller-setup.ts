import { execSync } from "node:child_process";
import path from "node:path";
import { API_BASE, SELLER_EMAIL } from "./constants";
import { authHeaders, loginForApi } from "./auth-api";

const BACKEND_ROOT =
  process.env.MELOMANOS_BACKEND_ROOT ??
  path.resolve(process.cwd(), "..", "backend");

interface MineListing {
  id: number;
  status?: string;
}

interface MineResponse {
  total: number;
  items: MineListing[];
}

interface SubscriptionResponse {
  plan_type: string;
  remaining_slots: number | null;
}

export function setSellerProPlanInDatabase(): void {
  const scriptPath = path.join(process.cwd(), "e2e", "scripts", "set_seller_pro.py");
  execSync(`py "${scriptPath}"`, {
    cwd: BACKEND_ROOT,
    env: {
      ...process.env,
      E2E_SELLER_EMAIL: SELLER_EMAIL,
      E2E_SELLER_PLAN: "pro",
    },
    stdio: "pipe",
    timeout: 20_000,
  });
}

async function fetchSubscription(token: string): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_BASE}/users/me/subscription`, {
    headers: authHeaders(token),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Subscription fetch failed (${res.status})`);
  }
  return res.json() as Promise<SubscriptionResponse>;
}

async function markSellerListingsSold(token: string): Promise<void> {
  const limit = 50;
  let skip = 0;
  let total = 0;

  do {
    const res = await fetch(
      `${API_BASE}/listings/mine?skip=${skip}&limit=${limit}`,
      {
        headers: authHeaders(token),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) {
      throw new Error(`Listings/mine failed (${res.status})`);
    }

    const data = (await res.json()) as MineResponse;
    total = data.total;
    const items = data.items ?? [];

    for (const listing of items) {
      const status = (listing.status ?? "available").toLowerCase();
      if (status === "sold") continue;

      const soldRes = await fetch(`${API_BASE}/listings/${listing.id}/sold`, {
        method: "PATCH",
        headers: authHeaders(token),
        signal: AbortSignal.timeout(10_000),
      });
      if (!soldRes.ok) {
        const text = await soldRes.text();
        throw new Error(
          `Mark listing ${listing.id} sold failed (${soldRes.status}): ${text}`,
        );
      }
    }

    skip += items.length;
  } while (skip < total);
}

/** Pro plan + no active listings so E2E can always publish via /sell. */
export async function prepareE2eSellerAccount(): Promise<void> {
  try {
    setSellerProPlanInDatabase();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[e2e] Could not set seller pro via DB (${message}); freeing listing slots via API.`,
    );
  }

  const token = await loginForApi(SELLER_EMAIL);
  await markSellerListingsSold(token);

  const sub = await fetchSubscription(token);
  if (sub.plan_type !== "pro" && sub.remaining_slots === 0) {
    throw new Error(
      "E2E seller still has no listing slots after setup. Set MELOMANOS_BACKEND_ROOT and DB, or free listings manually.",
    );
  }
}
