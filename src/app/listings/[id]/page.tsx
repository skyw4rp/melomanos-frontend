import Link from "next/link";
import { notFound } from "next/navigation";
import ListingDetailClient from "@/components/ListingDetailClient";
import { API_BASE } from "@/lib/api";
import { formatPriceCLP, statusLabel } from "@/lib/format";
import type { Listing } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchListing(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_BASE}/listings/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load listing");
  return res.json();
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listingId = Number(id);

  if (Number.isNaN(listingId)) {
    notFound();
  }

  let listing: Listing | null = null;
  let error: string | null = null;

  try {
    listing = await fetchListing(id);
  } catch {
    error = "Could not load this listing.";
  }

  if (!error && !listing) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        ← Back to marketplace
      </Link>

      {error && (
        <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {listing && (
        <article className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-violet-400/90">
                {listing.genre}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">{listing.title}</h1>
              <p className="mt-1 text-xl text-violet-300/90">{listing.artist}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm capitalize text-zinc-300">
              {statusLabel(listing.status)}
            </span>
          </div>

          <p className="mt-8 text-4xl font-bold text-white">
            {formatPriceCLP(listing.price_clp)}
          </p>

          <dl className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">City</dt>
              <dd className="mt-1 font-medium text-white">{listing.city}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Genre</dt>
              <dd className="mt-1 font-medium text-white">{listing.genre}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
              <dd className="mt-1 font-medium capitalize text-white">
                {statusLabel(listing.status)}
              </dd>
            </div>
          </dl>

          {listing.description && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Description
              </h2>
              <p className="mt-3 leading-relaxed text-zinc-300">{listing.description}</p>
            </section>
          )}

          <ListingDetailClient listingId={listing.id} />
        </article>
      )}
    </div>
  );
}
