"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getListings, type ListingsFilters } from "@/lib/api";
import type { ListingsResponse } from "@/types";

export function useListingsQuery(filters: ListingsFilters) {
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stableFilters = useMemo(
    () => filters,
    // Value-stable key — inline `{ skip: 0, limit: 20 }` must not retrigger fetch every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)],
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
