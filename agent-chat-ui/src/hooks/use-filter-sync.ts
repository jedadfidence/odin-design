import { useCallback } from "react";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { FilterCategory as FilterCategoryType } from "@/lib/filter-data";

const CONTEXT_TO_FILTER_MAP: Partial<Record<ContextCategory, FilterCategoryType>> = {
  platforms: "platform",
  countries: "country",
  region: "region",
  category: "category",
  brand: "brand",
};

interface FilterSyncDeps {
  useAsContext: boolean;
  toggleItem: (cat: ContextCategory, item: string) => void;
  removeItem: (cat: ContextCategory, item: string) => void;
  resetSelections: () => void;
  setSelections: React.Dispatch<React.SetStateAction<ContextSelections>>;
  toggleFilterItem: (cat: FilterCategoryType, item: string) => void;
  removeFilterItem: (cat: FilterCategoryType, item: string) => void;
  selectAllFilter: (cat: FilterCategoryType, items: string[]) => void;
  clearFilterCategory: (cat: FilterCategoryType) => void;
  resetAllFilters: () => void;
}

export function useFilterSync({
  useAsContext,
  toggleItem,
  removeItem,
  resetSelections,
  setSelections,
  toggleFilterItem,
  removeFilterItem,
  selectAllFilter,
  clearFilterCategory,
  resetAllFilters,
}: FilterSyncDeps) {
  const handleToggleContextItem = useCallback(
    (cat: ContextCategory, item: string) => {
      toggleItem(cat, item);
      if (useAsContext) {
        const filterCat = CONTEXT_TO_FILTER_MAP[cat];
        if (filterCat) toggleFilterItem(filterCat, item);
      }
    },
    [toggleItem, useAsContext, toggleFilterItem],
  );

  const handleRemoveContextItem = useCallback(
    (cat: ContextCategory, item: string) => {
      removeItem(cat, item);
      if (useAsContext) {
        const filterCat = CONTEXT_TO_FILTER_MAP[cat];
        if (filterCat) removeFilterItem(filterCat, item);
      }
    },
    [removeItem, useAsContext, removeFilterItem],
  );

  const handleToggleFilterItem = useCallback(
    (cat: FilterCategoryType, item: string) => {
      toggleFilterItem(cat, item);
      if (useAsContext) {
        const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
          ([, v]) => v === cat,
        )?.[0] as ContextCategory | undefined;
        if (contextCat) toggleItem(contextCat, item);
      }
    },
    [toggleFilterItem, useAsContext, toggleItem],
  );

  const handleResetAllFilters = useCallback(() => {
    resetAllFilters();
    if (useAsContext) {
      resetSelections();
    }
  }, [resetAllFilters, useAsContext, resetSelections]);

  const handleClearFilterCategory = useCallback(
    (cat: FilterCategoryType) => {
      clearFilterCategory(cat);
      if (useAsContext) {
        const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
          ([, v]) => v === cat,
        )?.[0] as ContextCategory | undefined;
        if (contextCat) {
          setSelections((prev) => ({ ...prev, [contextCat]: [] }));
        }
      }
    },
    [clearFilterCategory, useAsContext, setSelections],
  );

  const handleSelectAllFilter = useCallback(
    (cat: FilterCategoryType, items: string[]) => {
      selectAllFilter(cat, items);
      if (useAsContext) {
        const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
          ([, v]) => v === cat,
        )?.[0] as ContextCategory | undefined;
        if (contextCat) {
          setSelections((prev) => ({ ...prev, [contextCat]: [...items] }));
        }
      }
    },
    [selectAllFilter, useAsContext, setSelections],
  );

  return {
    handleToggleContextItem,
    handleRemoveContextItem,
    handleToggleFilterItem,
    handleResetAllFilters,
    handleClearFilterCategory,
    handleSelectAllFilter,
  };
}
