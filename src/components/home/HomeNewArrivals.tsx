"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import VinylCover from "@/components/VinylCover";
import { IconArrowRight, IconHeart } from "@/components/icons";
import { addFavorite, getToken } from "@/lib/api";
import { formatPriceCLP } from "@/lib/format";
import { listingRecordCondition } from "@/lib/listing-grading";
import type { Listing } from "@/types";

/** Stable rail placeholders — same card chrome as loaded listings (initials cover, no blank swap). */
const RAIL_PLACEHOLDER_LISTINGS: Listing[] = [
  {
    id: -1,
    title: "Minimal Sessions",
    artist: "Various",
    city: "Santiago",
    genre: "Minimal",
    price_clp: 0,
    status: "available",
  },
  {
    id: -2,
    title: "Deep Pulse",
    artist: "Various",
    city: "Valparaíso",
    genre: "House",
    price_clp: 0,
    status: "available",
  },
  {
    id: -3,
    title: "Night Drive",
    artist: "Various",
    city: "Concepción",
    genre: "Techno",
    price_clp: 0,
    status: "available",
  },
];

function HomeListingPreviewCard({
  listing,
  highlighted,
  isPlaceholder = false,
}: {
  listing: Listing;
  highlighted?: boolean;
  isPlaceholder?: boolean;
}) {
  const router = useRouter();
  const [favState, setFavState] = useState<"idle" | "loading" | "done">("idle");
  const artist = listing.artist ?? "—";
  const title = listing.title ?? "—";
  const city = listing.city ?? "—";
  const grade = listingRecordCondition(listing) ?? "VG+";
  const href = isPlaceholder || !listing.id ? "/explorar" : `/listings/${listing.id}`;

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
      setFavState("idle");
    }
  }

  return (
    <article
      data-testid="home-listing-preview"
      aria-busy={isPlaceholder}
      className={`group flex w-[min(100%,236px)] shrink-0 flex-col overflow-hidden card-surface card-surface-hover sm:w-[236px] ${
        highlighted ? "border-accent ring-1 ring-accent/30" : "border-border"
      } ${isPlaceholder ? "opacity-90" : ""}`}
    >
      <Link href={href} className="relative block">
        <VinylCover
          title={title}
          artist={artist}
          size="card"
        />
        <span className="badge-gold absolute left-3 top-3">
          Nuevo
        </span>
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favState !== "idle"}
          aria-label="Guardar en favoritos"
          className="icon-btn absolute right-2 top-2 bg-surface/90 disabled:opacity-60"
        >
          <IconHeart
            className={`h-3.5 w-3.5 ${favState === "done" ? "fill-accent text-accent" : ""}`}
          />
        </button>
      </Link>
      <Link href={href} className="flex flex-1 flex-col px-3.5 pb-4 pt-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {artist}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground group-hover:text-accent">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">{city}</p>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{grade}</p>
        <p className="mt-auto pt-2.5 text-lg font-bold tabular-nums text-foreground">
          {isPlaceholder ? "—" : formatPriceCLP(listing.price_clp)}
        </p>
      </Link>
    </article>
  );
}

interface HomeNewArrivalsProps {
  listings: Listing[];
}

export default function HomeNewArrivals({ listings }: HomeNewArrivalsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const visible = listings.slice(0, 6);
  const railListings =
    visible.length > 0 ? visible : RAIL_PLACEHOLDER_LISTINGS;
  const isLoadingRail = visible.length === 0;

  function scrollNext() {
    scrollerRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  }

  return (
    <section
      id="nuevos-ingresos"
      data-testid="home-new-arrivals"
      className="mt-14 min-h-[24rem] scroll-mt-28"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">
          Nuevos ingresos
        </h2>
        <Link
          href="/explorar"
          className="shrink-0 text-[13px] font-semibold text-accent transition hover:text-foreground"
        >
          Ver todos →
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {railListings.map((listing, index) => (
            <HomeListingPreviewCard
              key={listing.id}
              listing={listing}
              isPlaceholder={isLoadingRail}
              highlighted={!isLoadingRail && index === 2}
            />
          ))}
        </div>
        {!isLoadingRail && (
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Ver más nuevos ingresos"
            className="icon-btn absolute -right-1 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 bg-surface shadow-[var(--shadow-card)] sm:flex"
          >
            <IconArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
