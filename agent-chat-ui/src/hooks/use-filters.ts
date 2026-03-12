import { useState, useCallback, useEffect } from "react";
import {
  FilterCategory,
  FilterSelections,
  EMPTY_FILTER_SELECTIONS,
  DateRange,
} from "@/lib/filter-data";

const FILTER_STORAGE_KEY = "odin-filter-selections";
const DATE_RANGE_STORAGE_KEY = "odin-filter-date-range";
const TOGGLE_STORAGE_KEY = "odin-use-filters-as-context";

function loadFilterSelections(): FilterSelections {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return EMPTY_FILTER_SELECTIONS;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_FILTER_SELECTIONS, ...parsed };
  } catch {
    return EMPTY_FILTER_SELECTIONS;
  }
}

function loadDateRange(): DateRange {
  try {
    const raw = localStorage.getItem(DATE_RANGE_STORAGE_KEY);
    if (!raw) return { from: undefined, to: undefined };
    const parsed = JSON.parse(raw);
    return {
      from: parsed.from ? new Date(parsed.from) : undefined,
      to: parsed.to ? new Date(parsed.to) : undefined,
    };
  } catch {
    return { from: undefined, to: undefined };
  }
}

function loadToggleState(): boolean {
  try {
    return localStorage.getItem(TOGGLE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useFilters() {
  const [selections, setSelections] = useState<FilterSelections>(loadFilterSelections);
  const [dateRange, setDateRange] = useState<DateRange>(loadDateRange);
  const [useAsContext, setUseAsContext] = useState<boolean>(loadToggleState);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(selections));
  }, [selections]);

  useEffect(() => {
    localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify(dateRange));
  }, [dateRange]);

  useEffect(() => {
    localStorage.setItem(TOGGLE_STORAGE_KEY, String(useAsContext));
  }, [useAsContext]);

  const toggleItem = useCallback((category: FilterCategory, item: string) => {
    setSelections((prev) => {
      const current = prev[category];
      const next = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [category]: next };
    });
  }, []);

  const removeItem = useCallback((category: FilterCategory, item: string) => {
    setSelections((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }));
  }, []);

  const selectAll = useCallback((category: FilterCategory, items: string[]) => {
    setSelections((prev) => ({ ...prev, [category]: [...items] }));
  }, []);

  const clearCategory = useCallback((category: FilterCategory) => {
    setSelections((prev) => ({ ...prev, [category]: [] }));
  }, []);

  const resetAll = useCallback(() => {
    setSelections(EMPTY_FILTER_SELECTIONS);
    setDateRange({ from: undefined, to: undefined });
  }, []);

  const hasSelections = Object.values(selections).some((arr) => arr.length > 0) ||
    dateRange.from !== undefined;

  const totalSelected = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0) +
    (dateRange.from ? 1 : 0);

  const toMetadata = useCallback((): Record<string, unknown> | undefined => {
    if (!hasSelections) return undefined;
    const meta: Record<string, unknown> = {};
    for (const [key, values] of Object.entries(selections)) {
      if (values.length > 0) meta[key] = values;
    }
    if (dateRange.from) {
      meta.dateRange = {
        from: dateRange.from.toISOString(),
        to: dateRange.to?.toISOString(),
      };
    }
    return meta;
  }, [selections, dateRange, hasSelections]);

  return {
    selections,
    setSelections,
    dateRange,
    setDateRange,
    useAsContext,
    setUseAsContext,
    toggleItem,
    removeItem,
    selectAll,
    clearCategory,
    resetAll,
    hasSelections,
    totalSelected,
    toMetadata,
  };
}
