import { describe, expect, it } from "vitest";
import { buildCoverAlt, resolveCoverImageUrl } from "@/lib/listing-cover";

describe("resolveCoverImageUrl", () => {
  const apiBase = "http://127.0.0.1:8000";

  it("returns null for empty values", () => {
    expect(resolveCoverImageUrl(null, apiBase)).toBeNull();
    expect(resolveCoverImageUrl("", apiBase)).toBeNull();
    expect(resolveCoverImageUrl("   ", apiBase)).toBeNull();
  });

  it("passes through absolute URLs", () => {
    const url = "https://cdn.example.com/cover.jpg";
    expect(resolveCoverImageUrl(url, apiBase)).toBe(url);
  });

  it("prefixes relative paths with the API base", () => {
    expect(resolveCoverImageUrl("/static/demo/covers/house_01.svg", apiBase)).toBe(
      "http://127.0.0.1:8000/static/demo/covers/house_01.svg",
    );
  });

  it("prefixes bare paths without a leading slash", () => {
    expect(resolveCoverImageUrl("static/demo/covers/house_01.svg", apiBase)).toBe(
      "http://127.0.0.1:8000/static/demo/covers/house_01.svg",
    );
  });
});

describe("buildCoverAlt", () => {
  it("includes artist and title when available", () => {
    expect(buildCoverAlt("Modular Dawn EP", "Lumen Arc")).toBe(
      "Cover art for Modular Dawn EP by Lumen Arc",
    );
  });

  it("uses fallbacks for missing metadata", () => {
    expect(buildCoverAlt(null, null)).toBe(
      "Cover art for Unknown title by Unknown artist",
    );
  });
});
