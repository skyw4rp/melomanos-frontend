"use client";

import ListingCard from "@/components/ListingCard";
import EditorialEmptyState from "@/components/EditorialEmptyState";
import { useCatalogListings } from "@/hooks/useCatalogListings";

const labelClass = "label-field mb-0";

export default function CatalogExplore() {
  const {
    form,
    data,
    error,
    loading,
    handleSubmit,
    handleReset,
    updateField,
  } = useCatalogListings();

  const resultCount = data?.items.length ?? 0;

  return (
    <section id="catalogo" className="scroll-mt-28">
      <div className="mb-6 max-w-2xl lg:mb-8">
        <p className="editorial-label">Catálogo completo</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Catálogo de vinilos
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[length:var(--text-body-sm)]">
          Pressings electrónicos seleccionados por coleccionistas y DJs en Chile.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-10">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <form
            onSubmit={handleSubmit}
            data-testid="marketplace-filters"
            className="rounded-2xl border border-border/80 bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
          >
            <p className="editorial-label">Filtros</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Refinar búsqueda
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-[length:var(--text-body-sm)]">
              Artista, ciudad, estilo, precio y disponibilidad.
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="search" className={labelClass}>
                  Búsqueda
                </label>
                <input
                  id="search"
                  type="search"
                  value={form.search}
                  onChange={(e) => updateField("search", e.target.value)}
                  placeholder="Sello, artista, título…"
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="city" className={labelClass}>
                  Ciudad
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Santiago"
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="genre" className={labelClass}>
                  Estilo / subgénero
                </label>
                <input
                  id="genre"
                  type="text"
                  value={form.genre}
                  onChange={(e) => updateField("genre", e.target.value)}
                  placeholder="Minimal, Techno, House…"
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Estado
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="input-field mt-1.5"
                >
                  <option value="">Todos</option>
                  <option value="available">Disponible</option>
                  <option value="reserved">Reservado</option>
                  <option value="sold">Vendido</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="min_price" className={labelClass}>
                    Precio mín.
                  </label>
                  <input
                    id="min_price"
                    type="number"
                    min={0}
                    value={form.min_price}
                    onChange={(e) => updateField("min_price", e.target.value)}
                    placeholder="0"
                    className="input-field mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="max_price" className={labelClass}>
                    Precio máx.
                  </label>
                  <input
                    id="max_price"
                    type="number"
                    min={0}
                    value={form.max_price}
                    onChange={(e) => updateField("max_price", e.target.value)}
                    placeholder="500000"
                    className="input-field mt-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col">
              <button type="submit" className="btn-primary py-2.5 text-sm font-semibold">
                Buscar
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost py-2.5 text-sm font-semibold"
              >
                Limpiar
              </button>
            </div>
          </form>
        </aside>

        <div className="mt-8 min-w-0 lg:mt-0">
          {!loading && !error && data && data.items.length > 0 && (
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {resultCount} {resultCount === 1 ? "pressing" : "pressings"}
            </p>
          )}

          {loading && (
            <p className="py-10 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Cargando catálogo…
            </p>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && data && data.items.length === 0 && (
            <EditorialEmptyState
              testId="catalog-empty-state"
              eyebrow="Catálogo"
              title="Sin resultados para estos filtros"
              description="Prueba ampliar la búsqueda o usa Limpiar en el panel de filtros."
            />
          )}

          {!loading && !error && data && data.items.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-7">
              {data.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
