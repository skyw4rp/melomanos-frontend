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
import type { Listing, ListingsResponse } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchListing(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_BASE}/listings/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load listing");
  return (await res.json()) as Listing;
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
  available: "badge-success",
  sold: "badge-neutral",
  reserved: "badge-amber",
};

function statusBadgeClass(status?: string | null): string {
  const safeStatus = normalizeListingStatus(status);
  return statusStyles[safeStatus] ?? "badge-muted";
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
    if (listing?.genre?.trim()) {
      related = await fetchRelated(listing.genre, listing.id);
    }
  } catch {
    error = "No se pudo cargar esta publicación.";
  }

  if (!error && !listing) {
    notFound();
  }

  const typeLabel = listing ? listingTypeLabel(listing.listing_type) : null;
  const recordGrade = listing ? listingRecordCondition(listing) : undefined;
  const coverGrade = listing ? listingCoverCondition(listing) : undefined;
  const gradeLine = [recordGrade && `Disco ${recordGrade}`, coverGrade && `Cover ${coverGrade}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-ui hover:text-accent"
      >
        ← Volver a Explorar
      </Link>

      {error && (
        <p className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {listing && (
        <>
          <article className="mt-6 lg:mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-12">
              <div className="mx-auto w-full lg:mx-0">
                <VinylCover
                  title={listing.title}
                  artist={listing.artist}
                  coverImageUrl={listing.cover_image_url}
                  size="hero"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.genre?.trim() && (
                    <span className="badge-muted">{listing.genre}</span>
                  )}
                  {listing.subgenre && (
                    <span className="badge-muted">{listing.subgenre}</span>
                  )}
                  {typeLabel && <span className="badge-gold">{typeLabel}</span>}
                  <span className={statusBadgeClass(listing.status)}>
                    {statusLabel(listing.status)}
                  </span>
                </div>

                <p className="editorial-label mt-4 truncate">{listing.artist}</p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                  {listing.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.75rem]">
                    {formatPriceCLP(listing.price_clp)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city?.trim() || "Ubicación no informada"}
                  </p>
                </div>

                {gradeLine && (
                  <p className="mt-3 text-sm font-medium text-foreground">
                    <span className="text-muted-foreground">Condición: </span>
                    {gradeLine}
                  </p>
                )}

                <div className="card-surface mt-6 p-4 sm:p-5">
                  <p className="editorial-label">Acciones de compra</p>
                  <ListingDetailActions
                    listingId={listing.id}
                    status={listing.status}
                    sellerId={listing.seller_id}
                  />
                </div>

                <div className="mt-6">
                  <SellerCard listing={listing} sellerId={listing.seller_id} />
                </div>

                <details className="mt-6 rounded-2xl border border-border/80 bg-surface shadow-[var(--shadow-card)]">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                    Ficha del press
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      Sello, año y datos del catálogo
                    </span>
                  </summary>
                  <dl className="divide-y divide-border border-t border-border px-5 pb-2">
                    <DetailField label="Sello" value={listing.label} />
                    <DetailField label="Año" value={listing.year} />
                    <DetailField label="Tipo de publicación" value={typeLabel} />
                  </dl>
                </details>
              </div>
            </div>

            <section className="card-surface mt-10 p-5 sm:p-6">
              <h2 className="editorial-eyebrow">Descripción del vendedor</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {listing.description?.trim() ||
                  "El vendedor no agregó una descripción para este vinilo."}
              </p>
            </section>

            <ListingVideoSection videoUrl={listing.video_url} />
          </article>

          {listing.genre?.trim() && related.length > 0 && (
            <section className="mt-12 border-t border-border pt-10 sm:mt-14 sm:pt-12">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
                <div>
                  <p className="editorial-label">Mismo género</p>
                  <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                    Relacionados en {listing.genre}
                  </h2>
                </div>
                <Link
                  href={`/explorar?genre=${encodeURIComponent(listing.genre)}`}
                  className="text-sm font-semibold text-accent transition-ui hover:text-foreground"
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
