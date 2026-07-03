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
    <span className={`badge-muted ${className}`}>
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
      className="group flex h-full flex-col overflow-hidden card-surface card-surface-hover"
    >
      <div className="relative">
        <VinylCover
          title={title}
          artist={artist}
          coverImageUrl={listing.cover_image_url}
          size="card"
        />
        <span
          className={`absolute right-3 top-3 ${statusClass(listing.status)}`}
        >
          {statusLabel(safeStatus)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="truncate text-[length:var(--text-body-sm)] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {artist}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-accent sm:text-xl">
          {title}
        </h3>

        <p className="mt-2.5 text-[length:var(--text-nav)] text-muted-foreground">{city}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {genre && genre !== "Unknown" && <MetaChip>{genre}</MetaChip>}
          {typeLabel && <MetaChip>{typeLabel}</MetaChip>}
          {recordGrade && <MetaChip>Disco {recordGrade}</MetaChip>}
          {coverGrade && (
            <MetaChip className="opacity-80">Cover {coverGrade}</MetaChip>
          )}
          {isOwner && (
            <span className="badge-gold normal-case tracking-normal">
              Tu publicación
            </span>
          )}
        </div>

        <p className="mt-auto pt-5 text-[1.75rem] font-bold leading-none tracking-tight text-foreground sm:text-3xl">
          {formatPriceCLP(listing.price_clp)}
        </p>
      </div>

      <div
        className={`border-t border-border bg-surface-muted/40 p-4 ${isOwner ? "" : "grid grid-cols-2 gap-3"}`}
      >
        <Link
          href={listingHref}
          data-testid="listing-detail-link"
          className={`btn-primary ${isOwner ? "w-full" : ""}`}
        >
          Ver detalle
        </Link>
        {!isOwner && listing.id > 0 && (
          <button
            type="button"
            data-testid="listing-favorite-btn"
            onClick={handleFavorite}
            disabled={favState === "loading" || favState === "done"}
            className="btn-ghost bg-surface disabled:opacity-60"
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
