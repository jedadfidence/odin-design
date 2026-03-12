import { useState, useCallback } from "react";
import {
  ContextCategory,
  ContextSelections,
  EMPTY_SELECTIONS,
} from "@/lib/context-selectors";

export function useContextSelectors() {
  const [selections, setSelections] =
    useState<ContextSelections>(EMPTY_SELECTIONS);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ContextCategory | null>(
    null,
  );
  const [triggerSource, setTriggerSource] = useState<
    "icon" | "keyboard" | null
  >(null);

  const toggleItem = useCallback(
    (category: ContextCategory, item: string) => {
      setSelections((prev) => {
        const current = prev[category];
        const next = current.includes(item)
          ? current.filter((i) => i !== item)
          : [...current, item];
        return { ...prev, [category]: next };
      });
    },
    [],
  );

  const removeItem = useCallback(
    (category: ContextCategory, item: string) => {
      setSelections((prev) => ({
        ...prev,
        [category]: prev[category].filter((i) => i !== item),
      }));
    },
    [],
  );

  const resetSelections = useCallback(() => {
    setSelections(EMPTY_SELECTIONS);
  }, []);

  const hasSelections =
    selections.countries.length > 0 ||
    selections.platforms.length > 0 ||
    selections.region.length > 0 ||
    selections.category.length > 0 ||
    selections.brand.length > 0 ||
    selections.page.length > 0;

  const toMetadata = useCallback((): Record<string, unknown> | undefined => {
    if (!hasSelections) return undefined;
    const meta: Record<string, unknown> = {};
    if (selections.countries.length > 0) meta.countries = selections.countries;
    if (selections.platforms.length > 0) meta.platforms = selections.platforms;
    if (selections.region.length > 0) meta.region = selections.region;
    if (selections.category.length > 0) meta.category = selections.category;
    if (selections.brand.length > 0) meta.brand = selections.brand;
    if (selections.page.length > 0) meta.page = selections.page;
    return meta;
  }, [selections, hasSelections]);

  const openPopover = useCallback(
    (category?: ContextCategory, source: "icon" | "keyboard" = "icon") => {
      setActiveCategory(category ?? null);
      setTriggerSource(source);
      setPopoverOpen(true);
    },
    [],
  );

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
    setActiveCategory(null);
    setTriggerSource(null);
  }, []);

  return {
    selections,
    setSelections,
    popoverOpen,
    activeCategory,
    setActiveCategory,
    triggerSource,
    toggleItem,
    removeItem,
    resetSelections,
    hasSelections,
    toMetadata,
    openPopover,
    closePopover,
  };
}
