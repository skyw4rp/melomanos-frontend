"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import MarketplaceStatsRow from "@/components/MarketplaceStats";
import { getListings, type ListingsFilters } from "@/lib/api";
import {
  computeMarketplaceStats,
  type MarketplaceStats,
} from "@/lib/marketplace-stats";
import type { ListingsResponse } from "@/types";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400";

const emptyFilters = {
  search: "",
  city: "",
  genre: "",
  min_price: "",
  max_price: "",
  status: "",
};

type FilterFormState = typeof emptyFilters;

function toApiFilters(form: FilterFormState): ListingsFilters {
  return {
    skip: 0,
    limit: 20,
    search: form.search || undefined,
    city: form.city || undefined,
    genre: form.genre || undefined,
    min_price: form.min_price || undefined,
    max_price: form.max_price || undefined,
    status: form.status || undefined,
  };
}

export default function Marketplace() {
  const [form, setForm] = useState<FilterFormState>(emptyFilters);
  const [applied, setApplied] = useState<ListingsFilters>({ skip: 0, limit: 20 });
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async (filters: ListingsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getListings(filters);
      setData(result);
      setStats(computeMarketplaceStats(result.items, result.total));
    } catch {
      setData(null);
      setStats(null);
      setError(
        "Could not reach the API. Make sure the backend is running on port 8000.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(applied);
  }, [applied, loadListings]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApplied(toApiFilters(form));
  }

  function handleReset() {
    setForm(emptyFilters);
    setApplied({ skip: 0, limit: 20 });
  }

  function updateField(key: keyof FilterFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <section className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-fuchsia-400/90">
              Melomanos · Crate diggers · DJs
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Vinyl & electronic marketplace
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-snug text-zinc-400">
              Rare pressings, club staples, and DJ tools — listed by collectors
              across Chile.
            </p>
          </div>
          <span className="hidden rounded border border-violet-500/30 bg-violet-950/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-violet-300/80 sm:inline">
            BPM not included
          </span>
        </div>

        {stats && !loading && !error && (
          <div className="mt-4">
            <MarketplaceStatsRow stats={stats} compact />
          </div>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-violet-950/20 sm:p-5"
      >
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-violet-200">
          Filter crate
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Artist, city, genre, price, availability.
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
              placeholder="Label, artist, title…"
              className={inputClass}
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
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="genre" className={labelClass}>
              Género
            </label>
            <input
              id="genre"
              type="text"
              value={form.genre}
              onChange={(e) => updateField("genre", e.target.value)}
              placeholder="Techno, House…"
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-500"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-white/15 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-white/5 hover:text-white"
          >
            Limpiar
          </button>
        </div>
      </form>

      {loading && (
        <p className="py-10 text-center font-mono text-xs uppercase tracking-widest text-zinc-500">
          Spinning up crate…
        </p>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-sm text-zinc-400">
          Empty crate for these filters. Widen the dig?
        </p>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </>
  );
}
