/** Local default matches backend `run.py` bind address (127.0.0.1:8000). */
export const DEFAULT_API_BASE = "http://127.0.0.1:8000";

/**
 * Resolve the public API base URL for browser and SSR fetches.
 * Treats blank NEXT_PUBLIC_API_URL as unset (Next.js may inject empty strings).
 */
export function resolveApiBase(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    return DEFAULT_API_BASE;
  }
  return raw.replace(/\/$/, "");
}
