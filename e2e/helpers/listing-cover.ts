import { type Page } from "@playwright/test";
import { authHeaders, loginForApi } from "./auth-api";
import { API_BASE, SELLER_EMAIL } from "./constants";

export const E2E_DEMO_COVER_PATH = "/static/demo/covers/house_01.svg";

export const E2E_DEMO_COVER_URL = `${API_BASE}${E2E_DEMO_COVER_PATH}`;

const MOCK_COVER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4c1d95"/></svg>';

/** Fulfill demo cover asset requests so VinylCover img onLoad succeeds in E2E. */
export async function mockDemoCoverAssets(page: Page): Promise<void> {
  await page.route("**/static/demo/covers/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: MOCK_COVER_SVG,
    });
  });
}

/** Create a published listing with cover_image_url via API (SSR-safe for detail page). */
export async function createListingWithCoverViaApi(
  stamp: number = Date.now(),
): Promise<number> {
  const token = await loginForApi(SELLER_EMAIL);
  const res = await fetch(`${API_BASE}/listings`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `E2E Cover ${stamp}`,
      artist: "Lumen Arc",
      label: "Melómanos Test Press",
      genre: "Electronic",
      subgenre: "House",
      year: 2018,
      price_clp: 15_000,
      city: "Santiago",
      description: "E2E listing with demo cover_image_url.",
      record_condition: "NM",
      cover_condition: "NM",
      listing_type: "new",
      cover_image_url: E2E_DEMO_COVER_URL,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create listing with cover failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: number };
  return data.id;
}

export function mockListingWithCover(
  id: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    title: "Greyscale Transit EP",
    artist: "Lumen Arc",
    price_clp: 15_000,
    city: "Santiago",
    genre: "Electronic",
    subgenre: "House",
    status: "available",
    record_condition: "NM",
    cover_condition: "NM",
    listing_type: "new",
    cover_image_url: E2E_DEMO_COVER_URL,
    ...overrides,
  };
}
