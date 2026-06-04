"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import VinylCover from "@/components/VinylCover";
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
  available:
    "bg-emerald-500/25 text-emerald-200 ring-emerald-400/35",
  sold: "bg-zinc-600/30 text-zinc-300 ring-zinc-500/35",
  reserved: "bg-amber-500/25 text-amber-200 ring-amber-400/35",
};

function statusClass(status?: string | null): string {
  const safeStatus = normalizeListingStatus(status);
  return (
    statusStyles[safeStatus] ??
    "bg-violet-500/25 text-violet-200 ring-violet-400/35"
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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0a14] shadow-md shadow-black/40 transition duration-300 ease-out hover:-translate-y-1.5 hover:border-violet-400/50 hover:shadow-[0_0_40px_-8px_rgba(139,92,246,0.55)]">
      <VinylCover title={title} artist={artist} size="card" />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold leading-snug text-white transition group-hover:text-violet-100">
              {title}
            </h3>
            <p className="mt-1 truncate font-mono text-xs uppercase tracking-wide text-fuchsia-300/90">
              {artist}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusClass(listing.status)}`}
          >
            {statusLabel(safeStatus)}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded bg-white/5 px-2 py-0.5 text-zinc-300">{city}</span>
          <span className="rounded bg-violet-500/20 px-2 py-0.5 font-medium text-violet-200">
            {genre}
          </span>
          {typeLabel && (
            <span className="rounded border border-fuchsia-500/30 bg-fuchsia-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-fuchsia-200">
              {typeLabel}
            </span>
          )}
          {recordGrade && (
            <span className="rounded bg-violet-950/80 px-2 py-0.5 font-mono text-[10px] text-violet-200">
              Disco {recordGrade}
            </span>
          )}
          {coverGrade && (
            <span className="rounded bg-violet-950/80 px-2 py-0.5 font-mono text-[10px] text-violet-200">
              Cover {coverGrade}
            </span>
          )}
          {isOwner && (
            <span className="rounded bg-fuchsia-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-fuchsia-200/90">
              Tu publicación
            </span>
          )}
        </div>

        <p className="mt-auto bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
          {formatPriceCLP(listing.price_clp)}
        </p>
      </div>

      <div
        className={`border-t border-white/10 bg-black/30 p-3 ${isOwner ? "" : "grid grid-cols-2 gap-2"}`}
      >
        <Link
          href={listingHref}
          className={`flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:from-violet-500 hover:to-fuchsia-500 ${isOwner ? "w-full" : ""}`}
        >
          Ver detalle
        </Link>
        {!isOwner && listing.id > 0 && (
          <button
            type="button"
            onClick={handleFavorite}
            disabled={favState === "loading" || favState === "done"}
            className="flex items-center justify-center gap-1 rounded-lg border border-violet-400/30 bg-violet-950/50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-violet-200 transition hover:border-fuchsia-400/50 hover:bg-violet-900/40 hover:text-white disabled:opacity-60"
          >
            {favState === "done" ? "Guardado" : favState === "loading" ? "…" : "Favorito"}
          </button>
        )}
      </div>
      {!isOwner && favState === "error" && (
        <p className="px-3 pb-2 text-center text-[10px] text-red-400">
          No se pudo guardar
        </p>
      )}
    </article>
  );
}
