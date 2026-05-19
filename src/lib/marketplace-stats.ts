import type { Listing } from "@/types";

export interface MarketplaceStats {
  totalListings: number;
  uniqueCities: number;
  uniqueArtists: number;
}

export function computeMarketplaceStats(
  items: Listing[],
  total: number,
): MarketplaceStats {
  const cities = new Set(items.map((l) => l.city.trim().toLowerCase()).filter(Boolean));
  const artists = new Set(items.map((l) => l.artist.trim().toLowerCase()).filter(Boolean));

  return {
    totalListings: total,
    uniqueCities: cities.size,
    uniqueArtists: artists.size,
  };
}
