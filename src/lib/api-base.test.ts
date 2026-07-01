import { describe, expect, it } from "vitest";
import { DEFAULT_API_BASE, resolveApiBase } from "./api-base";

describe("resolveApiBase", () => {
  it("uses default when env var is unset", () => {
    expect(resolveApiBase({})).toBe(DEFAULT_API_BASE);
  });

  it("uses default when env var is blank", () => {
    expect(resolveApiBase({ NEXT_PUBLIC_API_URL: "   " })).toBe(DEFAULT_API_BASE);
  });

  it("strips trailing slash", () => {
    expect(resolveApiBase({ NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/" })).toBe(
      "http://127.0.0.1:8000",
    );
  });

  it("preserves explicit local URL", () => {
    expect(resolveApiBase({ NEXT_PUBLIC_API_URL: "http://localhost:8000" })).toBe(
      "http://localhost:8000",
    );
  });
});
