import { dispatchAuthChange } from "@/lib/auth-events";
import { normalizeReputationBadges } from "@/lib/trust-badges";
import type {
  Conversation,
  FavoriteWithListing,
  Listing,
  ListingCreate,
  ListingsResponse,
  LoginResponse,
  Message,
  MessageCreate,
  MessageReplyCreate,
  Order,
  OrderShippingUpdate,
  Review,
  ReviewCreate,
  SellerReputation,
  SubscriptionStatus,
  User,
} from "@/types";

export const API_BASE = "http://127.0.0.1:8000";

const TOKEN_KEY = "access_token";
const USER_KEY = "melomanos_user";

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

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function clearAuth(): void {
  clearToken();
  clearStoredUser();
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export function logout(): void {
  clearAuth();
  dispatchAuthChange();
}

export const SESSION_EXPIRED_MESSAGE = "Session expired. Please login again.";

export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof Error && err.message === SESSION_EXPIRED_MESSAGE;
}

function handleUnauthorized(): never {
  logout();
  throw new Error(SESSION_EXPIRED_MESSAGE);
}

async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const hadToken = Boolean(token);
  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && hadToken) {
    handleUnauthorized();
  }

  return res;
}

export function extractItems<T>(
  response: T[] | { items?: T[] } | unknown,
): T[] {
  if (Array.isArray(response)) return response;
  if (
    response &&
    typeof response === "object" &&
    Array.isArray((response as { items?: T[] }).items)
  ) {
    return (response as { items: T[] }).items;
  }
  return [];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text || `Request failed (${res.status})`;
    try {
      const json = JSON.parse(text) as { detail?: string | { msg?: string }[] };
      if (typeof json.detail === "string") {
        message = json.detail;
      } else if (Array.isArray(json.detail) && json.detail[0]?.msg) {
        message = json.detail[0].msg;
      }
    } catch {
      // keep raw message
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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

export async function getMe(): Promise<User> {
  const res = await authFetch(`${API_BASE}/auth/me`, { cache: "no-store" });
  return handleResponse<User>(res);
}

export async function getMySubscription(): Promise<SubscriptionStatus> {
  const res = await authFetch(`${API_BASE}/users/me/subscription`, {
    cache: "no-store",
  });
  return handleResponse<SubscriptionStatus>(res);
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

export async function createListing(data: ListingCreate): Promise<Listing> {
  const res = await authFetch(`${API_BASE}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Listing>(res);
}

export async function getMyFavorites(): Promise<FavoriteWithListing[]> {
  const res = await authFetch(`${API_BASE}/favorites/me`, { cache: "no-store" });
  const data = await handleResponse<FavoriteWithListing[] | { items?: FavoriteWithListing[] }>(
    res,
  );
  return extractItems(data);
}

export async function getMySales(): Promise<Listing[]> {
  const res = await authFetch(`${API_BASE}/users/me/sales`, { cache: "no-store" });
  const data = await handleResponse<Listing[] | { items?: Listing[] }>(res);
  return extractItems(data);
}

export async function getMyPurchases(): Promise<Listing[]> {
  const res = await authFetch(`${API_BASE}/users/me/purchases`, { cache: "no-store" });
  const data = await handleResponse<Listing[] | { items?: Listing[] }>(res);
  return extractItems(data);
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await authFetch(`${API_BASE}/messages/conversations`, {
    cache: "no-store",
  });
  const data = await handleResponse<Conversation[] | { items?: Conversation[] }>(
    res,
  );
  return extractItems(data);
}

export async function getMessagesForListing(listingId: number): Promise<Message[]> {
  const res = await authFetch(`${API_BASE}/messages/listing/${listingId}`, {
    cache: "no-store",
  });
  const data = await handleResponse<Message[] | { items?: Message[] }>(res);
  return extractItems(data);
}

export async function markMessageRead(messageId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/messages/${messageId}/read`, {
    method: "PATCH",
  });
  return handleResponse<void>(res);
}

export async function markMessageUnread(messageId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/messages/${messageId}/unread`, {
    method: "PATCH",
  });
  return handleResponse<void>(res);
}

export async function deleteMessage(messageId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/messages/${messageId}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

/** Reply inside an existing conversation (not for starting a new thread). */
export async function replyToMessage(data: MessageReplyCreate): Promise<void> {
  const res = await authFetch(`${API_BASE}/messages/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<void>(res);
}

export async function addFavorite(listingId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/favorites/${listingId}`, {
    method: "POST",
  });
  return handleResponse<void>(res);
}

export async function removeFavorite(listingId: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/favorites/${listingId}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

export async function sendMessage(data: MessageCreate): Promise<void> {
  const res = await authFetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<void>(res);
}

export async function createOrderFromListing(listingId: number): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/from-listing/${listingId}`, {
    method: "POST",
  });
  return handleResponse<Order>(res);
}

export async function getBuyingOrders(): Promise<Order[]> {
  const res = await authFetch(`${API_BASE}/orders/me/buying`, { cache: "no-store" });
  const data = await handleResponse<Order[] | { items?: Order[] }>(res);
  return extractItems(data);
}

export async function getSellingOrders(): Promise<Order[]> {
  const res = await authFetch(`${API_BASE}/orders/me/selling`, { cache: "no-store" });
  const data = await handleResponse<Order[] | { items?: Order[] }>(res);
  return extractItems(data);
}

export async function getOrder(orderId: number): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}`, { cache: "no-store" });
  return handleResponse<Order>(res);
}

export async function simulatePayment(orderId: number): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/simulate-payment`, {
    method: "PATCH",
  });
  return handleResponse<Order>(res);
}

export async function updateShipping(
  orderId: number,
  data: OrderShippingUpdate,
): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/shipping`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Order>(res);
}

export async function completeOrder(orderId: number): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/complete`, {
    method: "PATCH",
  });
  return handleResponse<Order>(res);
}

export async function openDispute(orderId: number): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/dispute`, {
    method: "PATCH",
  });
  return handleResponse<Order>(res);
}

export async function getSellerReputation(userId: number): Promise<SellerReputation> {
  const res = await fetch(`${API_BASE}/users/${userId}/reputation`, {
    cache: "no-store",
  });
  const data = await handleResponse<SellerReputation>(res);
  return { ...data, badges: normalizeReputationBadges(data.badges) };
}

export async function createReview(payload: ReviewCreate): Promise<Review> {
  const res = await authFetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listing_id: payload.listing_id,
      rating: payload.rating,
      comment: payload.comment?.trim() || null,
    }),
  });
  return handleResponse<Review>(res);
}
