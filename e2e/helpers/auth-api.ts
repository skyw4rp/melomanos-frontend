import { API_BASE, E2E_PASSWORD } from "./constants";

export async function loginForApi(email: string): Promise<string> {
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
    throw new Error(`API login failed for ${email} (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}
