import { dispatchAuthChange } from "@/lib/auth-events";
import { normalizePreferredCouriers } from "@/lib/shipping-profile";
import { normalizeReputationBadges } from "@/lib/trust-badges";
import type {
  AdminDispute,
  AdminOrderListResponse,
  AdminSummary,
  AdminUserListResponse,
  Conversation,
  DiggingScore,
  DisputeEvidence,
  DisputeEvidenceCreate,
  DisputeResolution,
  FavoriteWithListing,
  OrderDispute,
  Listing,
  ListingCreate,
  ListingsResponse,
  LoginResponse,
  Message,
  MessageCreate,
  MessageReplyCreate,
  CheckoutSession,
  Order,
  OrderShippingUpdate,
  Review,
  ReviewCreate,
  SellerReputation,
  SellerShippingProfile,
  SellerShippingProfileUpdate,
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

function normalizeShippingProfile(data: SellerShippingProfile): SellerShippingProfile {
  return {
    origin_city: data.origin_city ?? null,
    dispatch_time_hours: data.dispatch_time_hours ?? null,
    preferred_couriers: normalizePreferredCouriers(data.preferred_couriers),
    shipping_notes: data.shipping_notes ?? null,
  };
}

export async function getMyShippingProfile(): Promise<SellerShippingProfile> {
  const res = await authFetch(`${API_BASE}/users/me/shipping-profile`, {
    cache: "no-store",
  });
  return normalizeShippingProfile(await handleResponse<SellerShippingProfile>(res));
}

export async function updateMyShippingProfile(
  payload: SellerShippingProfileUpdate,
): Promise<SellerShippingProfile> {
  const res = await authFetch(`${API_BASE}/users/me/shipping-profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin_city: payload.origin_city?.trim() || null,
      dispatch_time_hours:
        payload.dispatch_time_hours != null &&
        !Number.isNaN(payload.dispatch_time_hours)
          ? payload.dispatch_time_hours
          : null,
      preferred_couriers: payload.preferred_couriers ?? [],
      shipping_notes: payload.shipping_notes?.trim() || null,
    }),
  });
  return normalizeShippingProfile(await handleResponse<SellerShippingProfile>(res));
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

export async function createCheckoutSession(
  orderId: number,
  options?: { returnUrl?: string; cancelUrl?: string },
): Promise<CheckoutSession> {
  const body: { return_url?: string; cancel_url?: string } = {};
  if (options?.returnUrl) {
    body.return_url = options.returnUrl;
  }
  if (options?.cancelUrl) {
    body.cancel_url = options.cancelUrl;
  }

  const res = await authFetch(`${API_BASE}/orders/${orderId}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<CheckoutSession>(res);
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

export async function openOrderDispute(
  orderId: number,
  reason: string,
): Promise<OrderDispute> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason.trim() }),
  });
  return handleResponse<OrderDispute>(res);
}

export async function getOrderDispute(
  orderId: number,
): Promise<OrderDispute | null> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/dispute`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return handleResponse<OrderDispute>(res);
}

export async function addDisputeEvidence(
  disputeId: number,
  payload: DisputeEvidenceCreate,
): Promise<DisputeEvidence> {
  const res = await authFetch(`${API_BASE}/disputes/${disputeId}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_url: payload.file_url.trim(),
      evidence_type: payload.evidence_type,
      comment: payload.comment?.trim() || null,
    }),
  });
  return handleResponse<DisputeEvidence>(res);
}

export async function getDisputeEvidence(
  disputeId: number,
): Promise<DisputeEvidence[]> {
  const res = await authFetch(`${API_BASE}/disputes/${disputeId}/evidence`, {
    cache: "no-store",
  });
  const data = await handleResponse<DisputeEvidence[]>(res);
  return Array.isArray(data) ? data : [];
}

const DISPUTE_ADMIN_ERROR =
  "No autorizado o acción inválida.";

async function patchDisputeAdmin(
  disputeId: number,
  adminKey: string,
  action: "under-review" | "resolve-buyer" | "resolve-seller",
): Promise<DisputeResolution> {
  const res = await authFetch(`${API_BASE}/disputes/${disputeId}/${action}`, {
    method: "PATCH",
    headers: { "x-admin-key": adminKey.trim() },
  });
  if (!res.ok) {
    throw new Error(DISPUTE_ADMIN_ERROR);
  }
  return handleResponse<DisputeResolution>(res);
}

export async function markDisputeUnderReview(
  disputeId: number,
  adminKey: string,
): Promise<DisputeResolution> {
  return patchDisputeAdmin(disputeId, adminKey, "under-review");
}

export async function resolveDisputeForBuyer(
  disputeId: number,
  adminKey: string,
): Promise<DisputeResolution> {
  return patchDisputeAdmin(disputeId, adminKey, "resolve-buyer");
}

export async function resolveDisputeForSeller(
  disputeId: number,
  adminKey: string,
): Promise<DisputeResolution> {
  return patchDisputeAdmin(disputeId, adminKey, "resolve-seller");
}

export async function getSellerReputation(userId: number): Promise<SellerReputation> {
  const res = await fetch(`${API_BASE}/users/${userId}/reputation`, {
    cache: "no-store",
  });
  const data = await handleResponse<SellerReputation>(res);
  return { ...data, badges: normalizeReputationBadges(data.badges) };
}

export async function getDiggingScore(userId: number): Promise<DiggingScore> {
  const res = await fetch(`${API_BASE}/users/${userId}/digging-score`, {
    cache: "no-store",
  });
  const data = await handleResponse<DiggingScore>(res);
  return {
    user_id: data.user_id,
    score: data.score ?? 0,
    level: data.level ?? "Nuevo Melómano",
    breakdown: {
      completed_sales: data.breakdown?.completed_sales ?? 0,
      completed_purchases: data.breakdown?.completed_purchases ?? 0,
      reviews_received: data.breakdown?.reviews_received ?? 0,
      reviews_written: data.breakdown?.reviews_written ?? 0,
      active_listings: data.breakdown?.active_listings ?? 0,
      protected_trades: data.breakdown?.protected_trades ?? 0,
      disputes: data.breakdown?.disputes ?? 0,
    },
  };
}

export const ADMIN_UNAUTHORIZED_MESSAGE =
  "No autorizado. Revisa la clave admin.";

async function adminFetch(path: string, adminKey: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: { "x-admin-key": adminKey.trim() },
  });
}

async function handleAdminResponse<T>(res: Response): Promise<T> {
  if (res.status === 403) {
    throw new Error(ADMIN_UNAUTHORIZED_MESSAGE);
  }
  return handleResponse<T>(res);
}

export async function getAdminSummary(adminKey: string): Promise<AdminSummary> {
  const res = await adminFetch("/admin/summary", adminKey);
  return handleAdminResponse<AdminSummary>(res);
}

export async function getAdminDisputes(adminKey: string): Promise<AdminDispute[]> {
  const res = await adminFetch("/admin/disputes", adminKey);
  return handleAdminResponse<AdminDispute[]>(res);
}

export async function getAdminOrders(
  adminKey: string,
  params: { skip?: number; limit?: number; status?: string } = {},
): Promise<AdminOrderListResponse> {
  const search = new URLSearchParams();
  if (params.skip != null) search.set("skip", String(params.skip));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.status?.trim()) search.set("status", params.status.trim());
  const query = search.toString();
  const path = query ? `/admin/orders?${query}` : "/admin/orders";
  const res = await adminFetch(path, adminKey);
  return handleAdminResponse<AdminOrderListResponse>(res);
}

export async function getAdminUsers(
  adminKey: string,
  params: { skip?: number; limit?: number } = {},
): Promise<AdminUserListResponse> {
  const search = new URLSearchParams();
  if (params.skip != null) search.set("skip", String(params.skip));
  if (params.limit != null) search.set("limit", String(params.limit));
  const query = search.toString();
  const path = query ? `/admin/users?${query}` : "/admin/users";
  const res = await adminFetch(path, adminKey);
  return handleAdminResponse<AdminUserListResponse>(res);
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
