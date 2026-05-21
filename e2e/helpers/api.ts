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
