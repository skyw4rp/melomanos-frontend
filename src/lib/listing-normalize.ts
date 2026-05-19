import type { FavoriteWithListing, Listing } from "@/types";

/** Coerce partial API listing payloads into safe display values. */
export function normalizeListing(raw: Partial<Listing> & { id?: number }): Listing {
  return {
    id: raw.id ?? 0,
    title: raw.title ?? "Unknown",
    artist: raw.artist ?? "Unknown",
    price_clp: raw.price_clp ?? 0,
    city: raw.city ?? "Unknown",
    genre: raw.genre ?? "Unknown",
    status: raw.status,
    description: raw.description,
    created_at: raw.created_at,
    label: raw.label,
    subgenre: raw.subgenre,
    year: raw.year,
    condition_media: raw.condition_media,
    condition_sleeve: raw.condition_sleeve,
    seller_id: raw.seller_id,
    seller_name: raw.seller_name,
    seller_city: raw.seller_city,
  };
}

function hasNestedListingData(listing: Partial<Listing> | null | undefined): boolean {
  if (!listing || typeof listing !== "object") return false;
  return Boolean(
    listing.id ||
      listing.title ||
      listing.artist ||
      listing.price_clp != null ||
      listing.city ||
      listing.genre,
  );
}

/** Extract listing from a favorite row (nested `listing` object). */
export function listingFromFavorite(favorite: FavoriteWithListing): Listing | null {
  const nested = favorite.listing;
  if (!hasNestedListingData(nested)) return null;

  const listingId = nested?.id ?? favorite.listing_id;
  if (!listingId) return null;

  return normalizeListing({
    ...nested,
    id: listingId,
  });
}

export interface FavoriteListingEntry {
  favoriteId: number;
  listingId: number;
  listing: Listing | null;
}

export function mapFavoritesToEntries(
  favorites: FavoriteWithListing[],
): FavoriteListingEntry[] {
  return favorites.map((favorite) => ({
    favoriteId: favorite.id,
    listingId: favorite.listing_id,
    listing: listingFromFavorite(favorite),
  }));
}

/** Listings only — for profile stats/tabs that need Listing[]. */
export function listingsFromFavorites(favorites: FavoriteWithListing[]): Listing[] {
  return mapFavoritesToEntries(favorites)
    .map((entry) => entry.listing)
    .filter((listing): listing is Listing => listing !== null);
}
