/** Local default matches backend `run.py` bind address (127.0.0.1:8000). */
export const DEFAULT_API_BASE = "http://127.0.0.1:8000";

/**
 * Resolve the public API base URL for browser and SSR fetches.
 * Treats blank NEXT_PUBLIC_API_URL as unset (Next.js may inject empty strings).
 *
 * Reads `process.env.NEXT_PUBLIC_API_URL` as a literal expression (not via an
 * aliased `env` parameter) so Next.js's client bundler can statically inline
 * it — an aliased/destructured read is invisible to that inlining pass and
 * silently falls back to `DEFAULT_API_BASE` in the browser regardless of the
 * configured value. The optional `env` override exists for tests only.
 */
export function resolveApiBase(env?: NodeJS.ProcessEnv): string {
  const raw = (
    env ? env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL
  )?.trim();
  if (!raw) {
    return DEFAULT_API_BASE;
  }
  return raw.replace(/\/$/, "");
}
