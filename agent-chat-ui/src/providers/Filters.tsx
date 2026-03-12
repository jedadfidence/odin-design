"use client";

import React, { createContext, useContext } from "react";
import { useFilters } from "@/hooks/use-filters";

type FiltersContextType = ReturnType<typeof useFilters>;

const FiltersContext = createContext<FiltersContextType | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const filters = useFilters();
  return (
    <FiltersContext.Provider value={filters}>{children}</FiltersContext.Provider>
  );
}

export function useFilterContext(): FiltersContextType {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return ctx;
}
