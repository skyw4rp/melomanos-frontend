"use client";

import ListingCard from "@/components/ListingCard";
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

  return (
    <section id="catalogo" className="scroll-mt-28">
      <div className="mb-7 max-w-2xl">
        <p className="editorial-label">Catálogo completo</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          Catálogo de vinilos
        </h1>
        <p className="mt-3 text-[length:var(--text-body-sm)] leading-relaxed text-muted-foreground">
          Pressings electrónicos seleccionados por coleccionistas y DJs en Chile.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        data-testid="marketplace-filters"
        className="mb-8 card-surface p-5 sm:p-7"
      >
        <h2 className="text-[length:var(--text-nav)] font-semibold text-foreground">
          Refinar búsqueda
        </h2>
        <p className="mt-1 text-[length:var(--text-body-sm)] text-muted-foreground">
          Artista, ciudad, estilo/subgénero, precio, disponibilidad.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
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

          <div>
            <label htmlFor="min_price" className={labelClass}>
              Precio mín. (CLP)
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
              Precio máx. (CLP)
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

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Buscar
          </button>
          <button type="button" onClick={handleReset} className="btn-ghost">
            Limpiar
          </button>
        </div>
      </form>

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
        <p className="rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted-foreground">
          Sin resultados para estos filtros. Prueba ampliar la búsqueda.
        </p>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {data.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
