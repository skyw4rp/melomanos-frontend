/** Navbar search → catalog filter bridge (frontend-only, no API changes). */

export const HOME_SEARCH_EVENT = "melomanos-home-search";
export const PENDING_HOME_SEARCH_KEY = "melomanos-pending-search";

export function dispatchHomeSearch(query: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HOME_SEARCH_EVENT, { detail: { query: query.trim() } }),
  );
}

export function setPendingHomeSearch(query: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_HOME_SEARCH_KEY, query.trim());
}

export function consumePendingHomeSearch(): string | null {
  if (typeof window === "undefined") return null;
  const query = sessionStorage.getItem(PENDING_HOME_SEARCH_KEY);
  if (query !== null) {
    sessionStorage.removeItem(PENDING_HOME_SEARCH_KEY);
  }
  return query;
}

export function scrollToCatalog(): void {
  if (typeof window === "undefined") return;
  const el = document.getElementById("catalogo");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
