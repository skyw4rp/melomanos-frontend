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
    if (listing) {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-ui hover:text-accent"
      >
        ← Volver al catálogo
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
                  <span className="badge-muted">{listing.genre}</span>
                  {listing.subgenre && (
                    <span className="badge-muted">{listing.subgenre}</span>
                  )}
                  {typeLabel && <span className="badge-gold">{typeLabel}</span>}
                  <span className={statusBadgeClass(listing.status)}>
                    {statusLabel(listing.status)}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  {listing.title}
                </h1>
                <p className="mt-2 text-lg font-medium uppercase tracking-wide text-accent">
                  {listing.artist}
                </p>

                <p className="mt-6 text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {formatPriceCLP(listing.price_clp)}
                </p>

                <dl className="card-surface mt-8 divide-y divide-border px-5">
                  <DetailField label="Sello" value={listing.label} />
                  <DetailField label="Género" value={listing.genre} />
                  <DetailField label="Subgénero" value={listing.subgenre} />
                  <DetailField label="Año" value={listing.year} />
                  <DetailField label="Tipo de publicación" value={typeLabel} />
                  <DetailField label="Estado del disco" value={recordGrade} />
                  <DetailField label="Estado de la funda" value={coverGrade} />
                  <DetailField label="Ciudad" value={listing.city} />
                  <DetailField label="Estado" value={statusLabel(listing.status)} />
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

            <section className="card-surface mt-12 p-6 sm:p-8">
              <h2 className="editorial-eyebrow">Notas del coleccionista</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {listing.description?.trim() ||
                  "Sin notas del coleccionista. Contacta al vendedor para más detalles sobre este press."}
              </p>
            </section>

            <ListingVideoSection videoUrl={listing.video_url} />
          </article>

          {related.length > 0 && (
            <section className="mt-14 border-t border-border pt-12">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="editorial-label">Mismo género</p>
                  <h2 className="mt-1 text-2xl font-bold text-foreground">
                    Relacionados en {listing.genre}
                  </h2>
                </div>
                <Link
                  href={`/?genre=${encodeURIComponent(listing.genre)}`}
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
