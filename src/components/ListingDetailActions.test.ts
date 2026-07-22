import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api", () => ({
  addFavorite: vi.fn(),
  createOrderFromListing: vi.fn(),
  getStoredUser: () => null,
  getToken: () => "test-token",
}));

vi.mock("@/lib/auth", () => ({
  isOwnListing: () => false,
}));

import ListingDetailActions, {
  initialPurchaseState,
  purchaseReducer,
  runOrderCreationRequest,
} from "./ListingDetailActions";

describe("ListingDetailActions purchase flow", () => {
  it("renders Comprar as the primary available-listing action", () => {
    const markup = renderToStaticMarkup(
      createElement(ListingDetailActions, {
        listingId: 42,
        status: "available",
        listingTitle: "Selected vinyl",
        priceClp: 12000,
      }),
    );

    expect(markup).toContain("Comprar");
    expect(markup).toContain("btn-primary");
  });

  it("opens and cancels confirmation without creating an order", () => {
    const opened = purchaseReducer(initialPurchaseState, { type: "open" });
    const pending = purchaseReducer(opened, { type: "pending" });
    const cancelled = purchaseReducer(opened, { type: "cancel" });

    expect(opened.confirmationOpen).toBe(true);
    expect(pending.status).toBe("loading");
    expect(cancelled).toEqual(initialPurchaseState);
  });

  it("creates an order once and navigates to its detail", async () => {
    const events: string[] = [];

    await runOrderCreationRequest({
      createOrder: vi.fn().mockResolvedValue({ id: 81 }),
      onLoading: () => events.push("loading"),
      onClearError: () => events.push("clear-error"),
      onSuccess: (order) => {
        events.push("success");
        push(`/orders/${order.id}`);
      },
      onError: () => events.push("error"),
    });

    expect(events).toEqual(["loading", "clear-error", "success"]);
    expect(push).toHaveBeenCalledWith("/orders/81");
  });

  it("reports an order-creation error", async () => {
    const error = vi.fn();

    await runOrderCreationRequest({
      createOrder: vi.fn().mockRejectedValue(new Error("Could not create order")),
      onLoading: vi.fn(),
      onClearError: vi.fn(),
      onSuccess: vi.fn(),
      onError: error,
    });

    expect(error).toHaveBeenCalledWith("Could not create order");
  });
});
