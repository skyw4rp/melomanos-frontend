"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ListingsFilters } from "@/lib/api";
import {
  consumePendingHomeSearch,
  HOME_SEARCH_EVENT,
} from "@/lib/home-search";
import {
  buildMarketplaceApiFilters,
  EMPTY_MARKETPLACE_FILTERS,
  type MarketplaceFilterForm,
} from "@/lib/marketplace-filters";
import { useListingsQuery } from "@/lib/useListingsQuery";

const defaultApplied: ListingsFilters = { skip: 0, limit: 20 };

export function useCatalogListings() {
  const [form, setForm] = useState<MarketplaceFilterForm>(EMPTY_MARKETPLACE_FILTERS);
  const [applied, setApplied] = useState<ListingsFilters>(defaultApplied);
  const { data, error, loading } = useListingsQuery(applied);

  useEffect(() => {
    const pending = consumePendingHomeSearch();
    if (pending) {
      setForm((prev) => ({ ...prev, search: pending }));
      setApplied(
        buildMarketplaceApiFilters({ ...EMPTY_MARKETPLACE_FILTERS, search: pending }),
      );
    }
  }, []);

  useEffect(() => {
    function onHomeSearch(event: Event) {
      const detail = (event as CustomEvent<{ query: string }>).detail;
      const query = detail?.query ?? "";
      setForm((prev) => ({ ...prev, search: query }));
      setApplied(
        buildMarketplaceApiFilters({ ...EMPTY_MARKETPLACE_FILTERS, search: query }),
      );
    }
    window.addEventListener(HOME_SEARCH_EVENT, onHomeSearch);
    return () => window.removeEventListener(HOME_SEARCH_EVENT, onHomeSearch);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApplied(buildMarketplaceApiFilters(form));
  }

  function handleReset() {
    setForm(EMPTY_MARKETPLACE_FILTERS);
    setApplied(defaultApplied);
  }

  function updateField(key: keyof MarketplaceFilterForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return {
    form,
    applied,
    data,
    error,
    loading,
    handleSubmit,
    handleReset,
    updateField,
  };
}
