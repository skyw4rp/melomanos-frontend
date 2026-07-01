import type { ListingsFilters } from "@/lib/api";

export type MarketplaceFilterForm = {
  search: string;
  city: string;
  genre: string;
  min_price: string;
  max_price: string;
  status: string;
};

/** Map UI filters to API params. Style/subgenre terms route through `search` (not `genre`). */
export function buildMarketplaceApiFilters(
  form: MarketplaceFilterForm,
): ListingsFilters {
  const searchParts = [form.search.trim(), form.genre.trim()].filter(Boolean);

  return {
    skip: 0,
    limit: 20,
    search: searchParts.length > 0 ? searchParts.join(" ") : undefined,
    city: form.city.trim() || undefined,
    min_price: form.min_price || undefined,
    max_price: form.max_price || undefined,
    status: form.status || undefined,
  };
}
