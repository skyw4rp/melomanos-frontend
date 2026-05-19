"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { getMyFavorites, getToken } from "@/lib/api";
import { mapFavoritesToEntries, type FavoriteListingEntry } from "@/lib/listing-normalize";

function FavoriteFallbackCard({
  favoriteId,
  listingId,
}: {
  favoriteId: number;
  listingId: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/90">
        Favorito
      </p>
      <p className="mt-2 font-semibold text-amber-100">Listing no disponible</p>
      <p className="mt-2 text-sm text-amber-200/80">
        No pudimos cargar los datos de este vinilo. Puede haber sido eliminado.
      </p>
      <p className="mt-4 font-mono text-xs text-amber-200/60">
        #{favoriteId} · listing {listingId}
      </p>
      <Link
        href="/"
        className="mt-auto pt-6 text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        Volver al marketplace →
      </Link>
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<FavoriteListingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    getMyFavorites()
      .then((favorites) => {
        const items = Array.isArray(favorites) ? favorites : [];
        setEntries(mapFavoritesToEntries(items));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load favorites"),
      )
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-400 sm:px-6">
        Loading favorites…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Your favorites</h1>
      <p className="mt-2 text-zinc-400">Listings you have saved for later.</p>

      {error && (
        <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {!error && entries.length === 0 && (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-zinc-400">
          No favorites yet.{" "}
          <Link href="/" className="text-violet-300 hover:text-violet-200">
            Browse the marketplace
          </Link>
        </p>
      )}

      {!error && entries.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) =>
            entry.listing ? (
              <ListingCard key={`fav-${entry.favoriteId}`} listing={entry.listing} />
            ) : (
              <FavoriteFallbackCard
                key={`fav-${entry.favoriteId}`}
                favoriteId={entry.favoriteId}
                listingId={entry.listingId}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
