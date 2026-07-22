import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE, createOrderFromListing } from "./api";

describe("createOrderFromListing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to the canonical listing order endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 42, status: "reserved" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createOrderFromListing(42);

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/orders/from-listing/42`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});
