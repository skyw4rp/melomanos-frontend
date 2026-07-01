"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { getMyFavorites, getToken } from "@/lib/api";
import { handleAuthRedirect, redirectToLogin } from "@/lib/auth-session";
import { mapFavoritesToEntries, type FavoriteListingEntry } from "@/lib/listing-normalize";

function FavoriteFallbackCard({
  favoriteId,
  listingId,
}: {
  favoriteId: number;
  listingId: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Favorito
      </p>
      <p className="mt-2 font-semibold text-foreground">Publicación no disponible</p>
      <p className="mt-2 text-sm text-muted-foreground">
        No pudimos cargar los datos de este vinilo. Puede haber sido eliminado.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        #{favoriteId} · publicación {listingId}
      </p>
      <Link
        href="/"
        className="mt-auto pt-6 text-sm font-medium text-accent hover:underline"
      >
        Volver al catálogo →
      </Link>
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [entries, setEntries] = useState<FavoriteListingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      redirectToLogin(router, pathname);
      return;
    }

    getMyFavorites()
      .then((favorites) => {
        const items = Array.isArray(favorites) ? favorites : [];
        setEntries(mapFavoritesToEntries(items));
      })
      .catch((err) => {
        if (handleAuthRedirect(err, router, pathname)) return;
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los favoritos",
        );
      })
      .finally(() => setLoading(false));
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground sm:px-6">
        Cargando favoritos…
      </div>
    );
  }

  return (
    <div
      data-testid="favorites-page"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <header>
        <p className="editorial-label text-accent">Colección personal</p>
        <h1
          data-testid="favorites-page-title"
          className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Tus favoritos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Vinilos que guardaste para revisar más tarde.
        </p>
      </header>

      {error && (
        <p
          className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {!error && entries.length === 0 && (
        <div
          data-testid="favorites-empty-state"
          className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]"
        >
          <p className="text-base font-semibold text-foreground">
            Aún no tienes favoritos
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Guarda vinilos para volver a revisarlos cuando quieras.
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm">
            Explorar catálogo
          </Link>
        </div>
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
