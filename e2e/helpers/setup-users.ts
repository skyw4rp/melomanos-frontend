import { API_BASE, BUYER_EMAIL, E2E_PASSWORD, SELLER_EMAIL } from "./constants";

async function registerUser(
  email: string,
  name: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: E2E_PASSWORD,
      name,
      city: "Santiago",
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (res.ok) return;

  const text = await res.text();
  if (res.status === 400 && /already|exist|registered/i.test(text)) {
    return;
  }

  throw new Error(`Register ${email} failed (${res.status}): ${text}`);
}

async function verifyLogin(email: string): Promise<void> {
  const body = new URLSearchParams({
    username: email,
    password: E2E_PASSWORD,
    grant_type: "password",
  });

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login check for ${email} failed (${res.status}): ${text}`);
  }
}

/** Ensure E2E buyer/seller exist (idempotent). */
export async function ensureTestUsers(): Promise<void> {
  await registerUser(BUYER_EMAIL, "E2E Buyer");
  await registerUser(SELLER_EMAIL, "E2E Seller");
  await verifyLogin(BUYER_EMAIL);
  await verifyLogin(SELLER_EMAIL);
}
