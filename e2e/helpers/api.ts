import { API_BASE } from "./constants";

interface ListingRow {
  id: number;
  seller_id?: number;
  status?: string;
  title?: string;
}

export async function fetchListings(limit = 20): Promise<ListingRow[]> {
  const res = await fetch(`${API_BASE}/listings?limit=${limit}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Listings API failed: ${res.status}`);
  }
  const data = (await res.json()) as { items?: ListingRow[] } | ListingRow[];
  return Array.isArray(data) ? data : (data.items ?? []);
}

/** First available listing for the logged-in seller (from localStorage user). */
export async function findSellerAvailableListingId(
  sellerUserId: number,
): Promise<number | null> {
  const items = await fetchListings(50);
  const listing = items.find((row) => {
    const status = (row.status ?? "available").toLowerCase();
    return (
      row.seller_id === sellerUserId &&
      status !== "sold" &&
      status !== "reserved"
    );
  });
  return listing?.id ?? null;
}

/** First available listing owned by seller (not buyer). */
export async function findBuyableListingId(
  buyerUserId?: number,
): Promise<number | null> {
  const items = await fetchListings(40);
  const listing = items.find((row) => {
    const status = (row.status ?? "available").toLowerCase();
    if (status === "sold" || status === "reserved") return false;
    if (buyerUserId != null && row.seller_id === buyerUserId) return false;
    return true;
  });
  return listing?.id ?? null;
}
