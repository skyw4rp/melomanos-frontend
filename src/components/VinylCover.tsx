"use client";

import { useState } from "react";
import VinylCoverPlaceholder from "@/components/VinylCoverPlaceholder";
import { buildCoverAlt, resolveCoverImageUrl } from "@/lib/listing-cover";

interface VinylCoverProps {
  title?: string | null;
  artist?: string | null;
  coverImageUrl?: string | null;
  size?: "card" | "hero";
}

const containerClass = (isHero: boolean) =>
  isHero
    ? "relative w-full overflow-hidden aspect-square max-w-md rounded-2xl border border-white/10 shadow-2xl shadow-black/40 lg:max-w-none"
    : "relative w-full overflow-hidden aspect-square bg-surface-muted";

export default function VinylCover({
  title,
  artist,
  coverImageUrl,
  size = "card",
}: VinylCoverProps) {
  const safeTitle = title?.trim() || "?";
  const safeArtist = artist?.trim() || "?";
  const isHero = size === "hero";
  const resolvedUrl = resolveCoverImageUrl(coverImageUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(resolvedUrl) && failedUrl !== resolvedUrl;
  const alt = buildCoverAlt(title, artist);

  return (
    <div className={containerClass(isHero)}>
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- demo/API URLs vary by environment */}
          <img
            src={resolvedUrl!}
            alt={alt}
            data-testid="listing-cover-image"
            className="absolute inset-0 h-full w-full object-cover"
            loading={isHero ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailedUrl(resolvedUrl)}
          />
          <div
            className={`absolute inset-0 ${isHero ? "bg-gradient-to-t from-black/35 via-transparent to-transparent" : "bg-gradient-to-t from-black/15 via-transparent to-transparent"}`}
            aria-hidden
          />
        </>
      ) : (
        <div data-testid="listing-cover-placeholder" className="absolute inset-0">
          <VinylCoverPlaceholder title={safeTitle} artist={safeArtist} size={size} />
        </div>
      )}
      {isHero && (
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-1 w-full bg-accent opacity-90"
          aria-hidden
        />
      )}
    </div>
  );
}
