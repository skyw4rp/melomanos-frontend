"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import HomeBenefitsStrip from "@/components/home/HomeBenefitsStrip";
import HomeCommunityCard from "@/components/home/HomeCommunityCard";
import HomeHero from "@/components/home/HomeHero";
import HomeMetricsBand from "@/components/home/HomeMetricsBand";
import HomeNewArrivals from "@/components/home/HomeNewArrivals";
import ListingCard from "@/components/ListingCard";
import { getListings, type ListingsFilters } from "@/lib/api";
import {
  buildMarketplaceApiFilters,
  type MarketplaceFilterForm,
} from "@/lib/marketplace-filters";
import { HOME_SEARCH_EVENT } from "@/lib/home-search";
import type { ListingsResponse } from "@/types";

const labelClass = "label-field mb-0";

const emptyFilters: MarketplaceFilterForm = {
  search: "",
  city: "",
  genre: "",
  min_price: "",
  max_price: "",
  status: "",
};

type FilterFormState = MarketplaceFilterForm;

export default function Marketplace() {
  const [form, setForm] = useState<FilterFormState>(emptyFilters);
  const [applied, setApplied] = useState<ListingsFilters>({ skip: 0, limit: 20 });
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async (filters: ListingsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getListings(filters);
      setData(result);
    } catch {
      setData(null);
      setError(
        "No se pudo conectar con la API. Verifica que el backend esté corriendo en el puerto 8000.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(applied);
  }, [applied, loadListings]);

  useEffect(() => {
    function onHomeSearch(event: Event) {
      const detail = (event as CustomEvent<{ query: string }>).detail;
      const query = detail?.query ?? "";
      setForm((prev) => ({ ...prev, search: query }));
      setApplied(buildMarketplaceApiFilters({ ...emptyFilters, search: query }));
    }
    window.addEventListener(HOME_SEARCH_EVENT, onHomeSearch);
    return () => window.removeEventListener(HOME_SEARCH_EVENT, onHomeSearch);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApplied(buildMarketplaceApiFilters(form));
  }

  function handleReset() {
    setForm(emptyFilters);
    setApplied({ skip: 0, limit: 20 });
  }

  function updateField(key: keyof FilterFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const featuredListing =
    data?.items.find((item) => item.cover_image_url) ?? data?.items[0] ?? null;
  const showHero =
    applied.skip === 0 &&
    !applied.search &&
    !applied.city &&
    !applied.status &&
    !applied.genre;

  return (
    <>
      {showHero && (
        <section className="mb-14 space-y-0">
          <HomeHero featuredListing={featuredListing} />
          <HomeMetricsBand />
          {data && data.items.length > 0 && (
            <HomeNewArrivals listings={data.items} />
          )}
          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_minmax(300px,380px)] lg:items-start lg:gap-10">
            <HomeBenefitsStrip />
            <HomeCommunityCard />
          </div>
        </section>
      )}

      <section id="catalogo" className="scroll-mt-28 border-t border-border pt-10">
        <div className="mb-6 max-w-2xl">
          <p className="editorial-label">Catálogo completo</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Catálogo de vinilos
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pressings electrónicos seleccionados por coleccionistas y DJs en Chile.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          data-testid="marketplace-filters"
          className="mb-8 card-surface p-4 sm:p-6"
        >
          <h3 className="text-sm font-semibold text-foreground">Refinar búsqueda</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Artista, ciudad, estilo/subgénero, precio, disponibilidad.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

          <div className="mt-4 flex flex-wrap gap-2">
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
