import { API_BASE } from "@/lib/api";

/**
 * Resolve listing cover URL for display.
 * Absolute URLs are used as-is; relative paths are prefixed with the API base.
 */
export function resolveCoverImageUrl(
  coverImageUrl: string | null | undefined,
  apiBase: string = API_BASE,
): string | null {
  const trimmed = coverImageUrl?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = apiBase.replace(/\/$/, "");
  if (trimmed.startsWith("/")) {
    return `${base}${trimmed}`;
  }

  return `${base}/${trimmed}`;
}

/** Accessible alt text for listing cover images. */
export function buildCoverAlt(
  title?: string | null,
  artist?: string | null,
): string {
  const safeTitle = title?.trim() || "Unknown title";
  const safeArtist = artist?.trim() || "Unknown artist";
  return `Cover art for ${safeTitle} by ${safeArtist}`;
}
