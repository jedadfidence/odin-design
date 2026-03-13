import React, { useState, useMemo } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SlidersHorizontal, RotateCcw, PanelRightClose, PanelRightOpen, Save, ChevronDown } from "lucide-react";
import { FilterCategory } from "./filter-category";
import { FilterDateRange } from "./filter-date-range";
import { FilterSearch } from "./filter-search";
import { FilterPresets } from "./filter-presets";
import {
  FILTER_CATEGORIES,
  FilterCategory as FilterCategoryType,
  FilterSelections,
  DateRange,
} from "@/lib/filter-data";
import { ContextPreset } from "@/lib/context-presets";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  selections: FilterSelections;
  dateRange: DateRange;
  onToggleItem: (category: FilterCategoryType, item: string) => void;
  onSelectAll: (category: FilterCategoryType, items: string[]) => void;
  onClearCategory: (category: FilterCategoryType) => void;
  onDateRangeChange: (range: DateRange) => void;
  onResetAll: () => void;
  hasSelections: boolean;
  totalSelected: number;
  // Presets
  presets: ContextPreset[];
  onApplyPreset: (preset: ContextPreset) => void;
  onSavePreset: () => void;
  onSaveAsNewPreset: () => void;
  onDeletePreset: (id: string) => void;
  activePresetName?: string | null;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selections,
  dateRange,
  onToggleItem,
  onSelectAll,
  onClearCategory,
  onDateRangeChange,
  onResetAll,
  hasSelections,
  totalSelected,
  presets,
  onApplyPreset,
  onSavePreset,
  onSaveAsNewPreset,
  onDeletePreset,
  activePresetName,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search) return FILTER_CATEGORIES;
    const lower = search.toLowerCase();
    return FILTER_CATEGORIES.map((cat) => {
      const matchingItems = cat.items.filter((item) =>
        item.toLowerCase().includes(lower),
      );
      const labelMatches = cat.label.toLowerCase().includes(lower);
      // If the category label matches, show all items; otherwise show only matching items
      return {
        ...cat,
        items: labelMatches ? cat.items : matchingItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [search]);

  return (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col border-0 !bg-surface-deep transition-[width] duration-200 ease-in-out",
        expanded ? "w-[var(--sidebar-width,16rem)]" : "w-[50px]",
      )}
    >
      {expanded ? (
        <>
          {/* Expanded header */}
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </div>
              <div className="flex items-center gap-1">
                {hasSelections && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={onResetAll}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Clear all filters</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setExpanded(false)}
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <FilterSearch value={search} onChange={setSearch} />
            <FilterPresets
              presets={presets}
              onApply={onApplyPreset}
              onDelete={onDeletePreset}
              activePresetName={activePresetName}
            />
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{
                gridTemplateRows: hasSelections ? "1fr" : "0fr",
                opacity: hasSelections ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                {activePresetName ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-[40px] text-sm gap-1.5 w-full justify-center glass-panel bg-brand-accent text-white hover:bg-brand-accent-hover"
                      >
                        <Save className="h-4 w-4" />
                        Save preset
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                      <DropdownMenuItem onClick={onSavePreset} className="text-xs">
                        Save to &ldquo;{activePresetName}&rdquo;
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSaveAsNewPreset} className="text-xs">
                        Save as new preset
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    className="h-[40px] text-sm gap-1.5 w-full justify-center glass-panel bg-brand-accent text-white hover:bg-brand-accent-hover"
                    onClick={onSaveAsNewPreset}
                  >
                    <Save className="h-4 w-4" />
                    Save preset
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Expanded content */}
          <ScrollArea className="flex-1">
            <Accordion type="multiple" className="py-1">
              <div className="mx-3 my-4">
                <FilterDateRange
                  dateRange={dateRange}
                  onDateRangeChange={onDateRangeChange}
                />
              </div>
              {filteredCategories.map((cat) => (
                <FilterCategory
                  key={cat.id}
                  id={cat.id}
                  label={cat.label}
                  items={cat.items}
                  selected={selections[cat.id]}
                  onToggle={(item) => onToggleItem(cat.id, item)}
                  onSelectAll={(items) => onSelectAll(cat.id, items)}
                  onClear={() => onClearCategory(cat.id)}
                />
              ))}
            </Accordion>
          </ScrollArea>
        </>
      ) : (
        /* Collapsed state — icon strip */
        <div className="flex flex-col items-center gap-2 pt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 relative"
                  onClick={() => setExpanded(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {totalSelected > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {totalSelected}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {totalSelected > 0
                  ? `Filters (${totalSelected} active)`
                  : "Expand filters"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
