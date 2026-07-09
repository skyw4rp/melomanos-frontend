"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getListings, type ListingsFilters } from "@/lib/api";
import type { ListingsResponse } from "@/types";

export function useListingsQuery(filters: ListingsFilters) {
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    skip,
    limit,
    search,
    city,
    genre,
    min_price,
    max_price,
    status,
  } = filters;

  // Value-stable object — inline `{ skip: 0, limit: 20 }` must not retrigger fetch every render.
  const stableFilters = useMemo(
    () => ({
      skip,
      limit,
      search,
      city,
      genre,
      min_price,
      max_price,
      status,
    }),
    [skip, limit, search, city, genre, min_price, max_price, status],
  );

  const loadListings = useCallback(async (next: ListingsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getListings(next);
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
    loadListings(stableFilters);
  }, [stableFilters, loadListings]);

  return { data, error, loading };
}
