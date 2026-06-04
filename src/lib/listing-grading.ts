import type { Listing } from "@/types";

export const DISCOGS_GRADES = ["M", "NM", "VG+", "VG", "G"] as const;
export type DiscogsGrade = (typeof DISCOGS_GRADES)[number];

export const LISTING_TYPES = ["new", "used"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export function listingRecordCondition(listing: Listing): string | undefined {
  return listing.record_condition?.trim() || listing.condition_media?.trim() || undefined;
}

export function listingCoverCondition(listing: Listing): string | undefined {
  return listing.cover_condition?.trim() || listing.condition_sleeve?.trim() || undefined;
}

export function listingTypeLabel(type?: string | null): string | null {
  const value = type?.trim().toLowerCase();
  if (value === "new") return "Nuevo";
  if (value === "used") return "Usado";
  return type?.trim() || null;
}

export function youtubeEmbedUrl(videoUrl: string): string | null {
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
      const embed = url.pathname.match(/^\/embed\/([^/]+)/);
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;
    }
  } catch {
    return null;
  }

  return null;
}
