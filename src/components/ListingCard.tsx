"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import VinylCover from "@/components/VinylCover";
import { IconHeart } from "@/components/icons";
import { isOwnListing } from "@/lib/auth";
import { addFavorite, getStoredUser, getToken } from "@/lib/api";
import { formatPriceCLP, normalizeListingStatus, statusLabel } from "@/lib/format";
import {
  listingCoverCondition,
  listingRecordCondition,
  listingTypeLabel,
} from "@/lib/listing-grading";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

const statusStyles: Record<string, string> = {
  available: "badge-success",
  sold: "badge-neutral",
  reserved: "badge-amber",
};

function statusClass(status?: string | null): string {
  const safeStatus = normalizeListingStatus(status);
  return statusStyles[safeStatus] ?? "badge-muted";
}

function MetaChip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge-muted px-2 py-0.5 text-[10px] ${className}`}>
      {children}
    </span>
  );
}

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const currentUser = getStoredUser();
  const isOwner = isOwnListing(listing, currentUser);

  const title = listing.title ?? "Unknown";
  const artist = listing.artist ?? "Unknown";
  const city = listing.city ?? "Unknown";
  const genre = listing.genre ?? "Unknown";
  const safeStatus = normalizeListingStatus(listing.status);
  const listingHref = listing.id ? `/listings/${listing.id}` : "/";
  const typeLabel = listingTypeLabel(listing.listing_type);
  const recordGrade = listingRecordCondition(listing);
  const coverGrade = listingCoverCondition(listing);
  const gradeLine = [recordGrade && `Disco ${recordGrade}`, coverGrade && `Cover ${coverGrade}`]
    .filter(Boolean)
    .join(" · ");

  const [favState, setFavState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!listing.id) return;

    if (!getToken()) {
      router.push("/login");
      return;
    }

    setFavState("loading");
    try {
      await addFavorite(listing.id);
      setFavState("done");
    } catch {
      setFavState("error");
    }
  }

  return (
    <article
      data-testid="listing-card"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[var(--shadow-card)] transition-ui hover:border-border hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative">
        <VinylCover
          title={title}
          artist={artist}
          coverImageUrl={listing.cover_image_url}
          size="card"
        />
        <span
          className={`absolute right-2.5 top-2.5 text-[10px] ${statusClass(listing.status)}`}
        >
          {statusLabel(safeStatus)}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <p className="editorial-label truncate">{artist}</p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-accent sm:text-lg">
          <Link href={listingHref} className="focus-ring rounded-sm">
            {title}
          </Link>
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {genre && genre !== "Unknown" && <MetaChip>{genre}</MetaChip>}
          {typeLabel && <MetaChip>{typeLabel}</MetaChip>}
          {isOwner && (
            <span className="badge-gold px-2 py-0.5 text-[10px] normal-case tracking-normal">
              Tu publicación
            </span>
          )}
        </div>

        {gradeLine && (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{gradeLine}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="min-w-0 truncate text-sm text-muted-foreground">{city}</p>
          <p className="shrink-0 text-right text-2xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-[1.65rem]">
            {formatPriceCLP(listing.price_clp)}
          </p>
        </div>
      </div>

      <div
        className={`border-t border-border/80 bg-surface-muted/25 p-3.5 ${isOwner ? "" : "grid grid-cols-2 gap-2.5"}`}
      >
        <Link
          href={listingHref}
          data-testid="listing-detail-link"
          className={`btn-primary py-2.5 text-sm ${isOwner ? "w-full" : ""}`}
        >
          Ver detalle
        </Link>
        {!isOwner && listing.id > 0 && (
          <button
            type="button"
            data-testid="listing-favorite-btn"
            onClick={handleFavorite}
            disabled={favState === "loading" || favState === "done"}
            className="btn-ghost bg-surface py-2.5 text-sm disabled:opacity-60"
          >
            {favState === "done" ? (
              <span className="inline-flex items-center gap-1.5">
                <IconHeart className="h-4 w-4 fill-accent text-accent" aria-hidden />
                Guardado
              </span>
            ) : favState === "loading" ? (
              "…"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <IconHeart className="h-4 w-4" aria-hidden />
                Favorito
              </span>
            )}
          </button>
        )}
      </div>
      {!isOwner && favState === "error" && (
        <p className="px-4 pb-3 text-center text-[length:var(--text-caption)] text-destructive">
          No se pudo guardar
        </p>
      )}
    </article>
  );
}
