"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { getMyFavorites, getToken } from "@/lib/api";
import type { Listing } from "@/types";

export default function FavoritesPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    getMyFavorites()
      .then(setListings)
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

      {!error && listings.length === 0 && (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-zinc-400">
          No favorites yet.{" "}
          <Link href="/" className="text-violet-300 hover:text-violet-200">
            Browse the marketplace
          </Link>
        </p>
      )}

      {!error && listings.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
