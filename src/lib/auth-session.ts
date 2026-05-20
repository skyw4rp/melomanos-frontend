import { isSessionExpiredError } from "@/lib/api";

export const SESSION_EXPIRED_UI_MESSAGE =
  "Tu sesión expiró. Inicia sesión nuevamente.";

/** Allow only same-origin app paths (no open redirects). */
export function getSafeRedirectPath(next: string | null | undefined): string | null {
  if (!next?.trim()) return null;
  let path = next.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/login")) return null;
  return path;
}

export function redirectToLogin(
  router: { replace: (href: string) => void },
  nextPath?: string,
): void {
  const safe = getSafeRedirectPath(nextPath ?? null);
  if (safe) {
    router.replace(`/login?next=${encodeURIComponent(safe)}`);
  } else {
    router.replace("/login");
  }
}

export function handleAuthRedirect(
  err: unknown,
  router: { replace: (href: string) => void },
  nextPath?: string,
): boolean {
  if (!isSessionExpiredError(err)) return false;
  redirectToLogin(router, nextPath);
  return true;
}
