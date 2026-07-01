import { describe, expect, it } from "vitest";
import { buildMarketplaceApiFilters } from "./marketplace-filters";

describe("buildMarketplaceApiFilters", () => {
  it("maps style/subgenre input through search, not genre", () => {
    expect(
      buildMarketplaceApiFilters({
        search: "",
        city: "",
        genre: "minimal",
        min_price: "",
        max_price: "",
        status: "",
      }),
    ).toEqual({
      skip: 0,
      limit: 20,
      search: "minimal",
      city: undefined,
      min_price: undefined,
      max_price: undefined,
      status: undefined,
    });
  });

  it("combines búsqueda and estilo into one search param", () => {
    expect(
      buildMarketplaceApiFilters({
        search: "lumen",
        city: "",
        genre: "techno",
        min_price: "",
        max_price: "",
        status: "",
      }).search,
    ).toBe("lumen techno");
  });
});
