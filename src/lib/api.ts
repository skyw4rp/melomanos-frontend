import type {
  Listing,
  ListingsResponse,
  LoginResponse,
  MessageCreate,
} from "@/types";

export const API_BASE = "http://127.0.0.1:8000";

const TOKEN_KEY = "access_token";

export interface ListingsFilters {
  skip?: number;
  limit?: number;
  search?: string;
  city?: string;
  genre?: string;
  min_price?: string | number;
  max_price?: string | number;
  status?: string;
}

export function buildListingsQuery(filters: ListingsFilters = {}): string {
  const params = new URLSearchParams();
  params.set("skip", String(filters.skip ?? 0));
  params.set("limit", String(filters.limit ?? 20));

  const keys: (keyof ListingsFilters)[] = [
    "search",
    "city",
    "genre",
    "min_price",
    "max_price",
    "status",
  ];

  for (const key of keys) {
    const value = filters[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value).trim());
    }
  }

  return params.toString();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams({
    username: email,
    password,
    grant_type: "password",
  });

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  return handleResponse<LoginResponse>(res);
}

export async function getListings(
  filters: ListingsFilters = {},
): Promise<ListingsResponse> {
  const query = buildListingsQuery(filters);
  const res = await fetch(`${API_BASE}/listings?${query}`, {
    cache: "no-store",
  });
  return handleResponse<ListingsResponse>(res);
}

export async function getListing(id: number | string): Promise<Listing> {
  const res = await fetch(`${API_BASE}/listings/${id}`, { cache: "no-store" });
  return handleResponse<Listing>(res);
}

export async function getMyFavorites(): Promise<Listing[]> {
  const res = await fetch(`${API_BASE}/favorites/me`, {
    headers: {
      ...authHeaders(),
    },
    cache: "no-store",
  });
  return handleResponse<Listing[]>(res);
}

export async function addFavorite(listingId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ listing_id: listingId }),
  });
  return handleResponse<void>(res);
}

export async function sendMessage(data: MessageCreate): Promise<void> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleResponse<void>(res);
}

export async function reserveListing(listingId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/listings/${listingId}/reserve`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
  });
  return handleResponse<void>(res);
}
