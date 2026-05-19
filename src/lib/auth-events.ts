export const AUTH_CHANGED_EVENT = "melomanos:auth-changed";

export function dispatchAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
