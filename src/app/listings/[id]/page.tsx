import Link from "next/link";
import { notFound } from "next/navigation";
import DetailField from "@/components/DetailField";
import ListingCard from "@/components/ListingCard";
import ListingDetailActions from "@/components/ListingDetailActions";
import ListingVideoSection from "@/components/ListingVideoSection";
import SellerCard from "@/components/SellerCard";
import VinylCover from "@/components/VinylCover";
import { API_BASE } from "@/lib/api";
import { formatPriceCLP, normalizeListingStatus, statusLabel } from "@/lib/format";
import {
  listingCoverCondition,
  listingRecordCondition,
  listingTypeLabel,
} from "@/lib/listing-grading";
import { normalizeListing } from "@/lib/listing-normalize";
import type { Listing, ListingsResponse } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchListing(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_BASE}/listings/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load listing");
  const data = (await res.json()) as Listing;
  return normalizeListing(data);
}

async function fetchRelated(genre: string, excludeId: number): Promise<Listing[]> {
  const params = new URLSearchParams({
    skip: "0",
    limit: "4",
    genre,
  });
  const res = await fetch(`${API_BASE}/listings?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as ListingsResponse;
  return data.items.filter((item) => item.id !== excludeId).slice(0, 4);
}

const statusStyles: Record<string, string> = {
  available: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  sold: "bg-zinc-500/20 text-zinc-300 ring-zinc-500/30",
  reserved: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
};

function statusBadgeClass(status?: string | null): string {
  const safeStatus = normalizeListingStatus(status);
  return (
    statusStyles[safeStatus] ??
    "bg-violet-500/20 text-violet-200 ring-violet-400/30"
  );
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    notFound();
  }

  let listing: Listing | null = null;
  let related: Listing[] = [];
  let error: string | null = null;

  try {
    listing = await fetchListing(id);
    if (listing) {
      related = await fetchRelated(listing.genre, listing.id);
    }
  } catch {
    error = "Could not load this listing.";
  }

  if (!error && !listing) {
    notFound();
  }

  const typeLabel = listing ? listingTypeLabel(listing.listing_type) : null;
  const recordGrade = listing ? listingRecordCondition(listing) : undefined;
  const coverGrade = listing ? listingCoverCondition(listing) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-violet-300 transition hover:text-violet-200"
      >
        ← Crate / Marketplace
      </Link>

      {error && (
        <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {listing && (
        <>
          <article className="mt-6 lg:mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-12">
              <div className="mx-auto w-full lg:mx-0">
                <VinylCover title={listing.title} artist={listing.artist} size="hero" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-200">
                    {listing.genre}
                  </span>
                  {listing.subgenre && (
                    <span className="rounded bg-fuchsia-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fuchsia-200/90">
                      {listing.subgenre}
                    </span>
                  )}
                  {typeLabel && (
                    <span className="rounded border border-fuchsia-500/35 bg-fuchsia-500/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fuchsia-100">
                      {typeLabel}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(listing.status)}`}
                  >
                    {statusLabel(listing.status)}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {listing.title}
                </h1>
                <p className="mt-2 font-mono text-lg uppercase tracking-wide text-fuchsia-300/95">
                  {listing.artist}
                </p>

                <p className="mt-6 bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
                  {formatPriceCLP(listing.price_clp)}
                </p>

                <dl className="mt-8 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02] px-5">
                  <DetailField label="Label" value={listing.label} />
                  <DetailField label="Genre" value={listing.genre} />
                  <DetailField label="Subgenre" value={listing.subgenre} />
                  <DetailField label="Year" value={listing.year} />
                  <DetailField label="Listing type" value={typeLabel} />
                  <DetailField label="Record condition" value={recordGrade} />
                  <DetailField label="Cover condition" value={coverGrade} />
                  <DetailField label="City" value={listing.city} />
                  <DetailField label="Status" value={statusLabel(listing.status)} />
                </dl>

                <div className="mt-8">
                  <ListingDetailActions
                    listingId={listing.id}
                    status={listing.status}
                    sellerId={listing.seller_id}
                  />
                </div>

                <div className="mt-8">
                  <SellerCard listing={listing} sellerId={listing.seller_id} />
                </div>
              </div>
            </div>

            <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/20 to-transparent p-6 sm:p-8">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Collector notes
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-300">
                {listing.description?.trim() ||
                  "Sin notas del coleccionista. Contacta al vendedor para más detalles sobre este press."}
              </p>
            </section>

            <ListingVideoSection videoUrl={listing.video_url} />
          </article>

          {related.length > 0 && (
            <section className="mt-14 border-t border-white/10 pt-12">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
                    Same genre
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Related in {listing.genre}
                  </h2>
                </div>
                <Link
                  href={`/?genre=${encodeURIComponent(listing.genre)}`}
                  className="text-xs font-medium uppercase tracking-wide text-violet-300 hover:text-violet-200"
                >
                  Ver todo →
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
