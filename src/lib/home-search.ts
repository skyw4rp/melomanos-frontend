/** Navbar home search → marketplace filter bridge (frontend-only, no API changes). */

export const HOME_SEARCH_EVENT = "melomanos-home-search";

export function dispatchHomeSearch(query: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HOME_SEARCH_EVENT, { detail: { query: query.trim() } }),
  );
}

export function scrollToCatalog(): void {
  if (typeof window === "undefined") return;
  const el = document.getElementById("catalogo");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
