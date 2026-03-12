# Filter Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible right-side filter panel that optionally feeds filter selections into the AI chat context, with unified presets covering both filters and context.

**Architecture:** Dual-sidebar layout using shadcn's `SidebarProvider` (left nav + right filters). Filter state managed by a new `useFilters` hook with localStorage persistence. A "Ask AI using your filters" toggle merges filter state into the existing context system. The preset system is extended to capture both context and filter selections.

**Tech Stack:** Next.js 15, React 19, shadcn/ui (Sidebar, Accordion, Checkbox, Command, Switch, ScrollArea, Calendar, Tooltip, Badge), Tailwind CSS, Framer Motion, localStorage.

---

## File Structure Overview

```
New files:
  src/lib/filter-data.ts              — Filter category definitions + dummy data
  src/hooks/use-filters.ts            — Filter state, persistence, reset, sync
  src/components/filters/filter-sidebar.tsx    — Right sidebar wrapper
  src/components/filters/filter-category.tsx   — Accordion item with checkboxes
  src/components/filters/filter-search.tsx     — Global search across categories
  src/components/filters/filter-date-range.tsx — Date range picker
  src/components/filters/filter-presets.tsx    — Preset dropdown + save in panel
  src/components/filters/compact-badge.tsx     — "Poland +4" badge with tooltip

Modified files:
  src/app/page.tsx                    — Add right sidebar to layout
  src/lib/context-selectors.ts        — Add Region/Category/Brand categories, remove Metrics
  src/lib/context-presets.ts          — Add `filters` field to preset type
  src/hooks/use-context-presets.ts    — Extend for unified presets
  src/hooks/use-context-selectors.ts  — Add filter sync logic
  src/components/thread/index.tsx     — Add toggle, wire filter state, update submit
  src/components/thread/context-badges.tsx — Use compact badge pattern
  src/components/thread/context-popover.tsx — Update categories

Install:
  shadcn components: accordion, scroll-area, calendar
```

---

## Chunk 1: Foundation — Filter Data, Types, and shadcn Installs

### Task 1: Install required shadcn components

**Files:**
- Modify: `agent-chat-ui/package.json`
- Create: `agent-chat-ui/src/components/ui/accordion.tsx`
- Create: `agent-chat-ui/src/components/ui/scroll-area.tsx`
- Create: `agent-chat-ui/src/components/ui/calendar.tsx`

- [ ] **Step 1: Install accordion, scroll-area, calendar via shadcn CLI**

```bash
cd agent-chat-ui
npx shadcn@latest add accordion scroll-area calendar
```

Expected: Three new files created in `src/components/ui/`, dependencies added to `package.json`.

- [ ] **Step 2: Verify install**

```bash
ls src/components/ui/accordion.tsx src/components/ui/scroll-area.tsx src/components/ui/calendar.tsx
```

Expected: All three files exist.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: install shadcn accordion, scroll-area, calendar components"
```

---

### Task 2: Create filter data definitions

**Files:**
- Create: `agent-chat-ui/src/lib/filter-data.ts`

- [ ] **Step 1: Create filter-data.ts with all categories and dummy data**

```typescript
export type FilterCategory =
  | "itemId"
  | "platform"
  | "placement"
  | "objective"
  | "buyingType"
  | "performanceGoal"
  | "region"
  | "country"
  | "category"
  | "brand";

export interface FilterCategoryConfig {
  id: FilterCategory;
  label: string;
  items: string[];
}

export const FILTER_CATEGORIES: FilterCategoryConfig[] = [
  {
    id: "itemId",
    label: "Item ID",
    items: [
      "ID-10001",
      "ID-10002",
      "ID-10003",
      "ID-10004",
      "ID-10005",
      "ID-10006",
      "ID-10007",
      "ID-10008",
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: ["Meta", "Google Ads", "DV360", "TikTok", "Snapchat", "Pinterest", "LinkedIn"],
  },
  {
    id: "placement",
    label: "Placement",
    items: ["Feed", "Stories", "Reels", "Search", "Display", "Video"],
  },
  {
    id: "objective",
    label: "Objective",
    items: ["Awareness", "Reach", "Traffic", "Engagement", "Conversions", "Sales"],
  },
  {
    id: "buyingType",
    label: "Buying Type",
    items: ["Auction", "Reservation", "Fixed"],
  },
  {
    id: "performanceGoal",
    label: "Performance Goal",
    items: ["Impressions", "Clicks", "Conversions", "Video Views", "Reach"],
  },
  {
    id: "region",
    label: "Region",
    items: ["EMEA", "APAC", "Americas", "LATAM"],
  },
  {
    id: "country",
    label: "Country",
    items: [
      "Poland",
      "Germany",
      "United Kingdom",
      "France",
      "Spain",
      "Italy",
      "United States",
      "Canada",
      "Brazil",
    ],
  },
  {
    id: "category",
    label: "Category",
    items: ["Beauty", "Food", "Beverages", "Household", "Healthcare"],
  },
  {
    id: "brand",
    label: "Brand",
    items: ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"],
  },
];

export type FilterSelections = Record<FilterCategory, string[]>;

export const EMPTY_FILTER_SELECTIONS: FilterSelections = {
  itemId: [],
  platform: [],
  placement: [],
  objective: [],
  buyingType: [],
  performanceGoal: [],
  region: [],
  country: [],
  category: [],
  brand: [],
};

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/lib/filter-data.ts
git commit -m "feat: add filter category definitions and dummy data"
```

---

### Task 3: Create the useFilters hook

**Files:**
- Create: `agent-chat-ui/src/hooks/use-filters.ts`

- [ ] **Step 1: Create use-filters.ts with state management and localStorage persistence**

```typescript
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
    // Merge with empty to handle new categories added after storage was saved
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

  // Persist selections
  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(selections));
  }, [selections]);

  // Persist date range
  useEffect(() => {
    localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify(dateRange));
  }, [dateRange]);

  // Persist toggle
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
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/hooks/use-filters.ts
git commit -m "feat: add useFilters hook with localStorage persistence"
```

---

### Task 4: Update context-selectors.ts — add Region/Category/Brand, remove Metrics

**Files:**
- Modify: `agent-chat-ui/src/lib/context-selectors.ts`

This is a significant change to the type system. The `ContextCategory` union and `ContextSelections` type both expand.

- [ ] **Step 1: Update ContextCategory type and CONTEXT_CATEGORIES array**

In `agent-chat-ui/src/lib/context-selectors.ts`:

Replace the entire file with:

```typescript
export type ContextCategory = "countries" | "platforms" | "region" | "category" | "brand" | "page";

export interface ContextCategoryConfig {
  id: ContextCategory;
  label: string;
  items: string[];
}

export const CONTEXT_CATEGORIES: ContextCategoryConfig[] = [
  {
    id: "platforms",
    label: "Platforms",
    items: [
      "Meta",
      "Google Ads",
      "DV360",
      "TikTok",
      "Snapchat",
      "Pinterest",
      "LinkedIn",
      "Twitter/X",
      "Amazon DSP",
      "Programmatic (Other)",
    ],
  },
  {
    id: "countries",
    label: "Countries",
    items: [
      "Poland",
      "Germany",
      "France",
      "Spain",
      "Italy",
      "Netherlands",
      "United Kingdom",
      "Sweden",
      "Norway",
      "Denmark",
      "Czech Republic",
      "Austria",
      "Belgium",
      "Switzerland",
      "Portugal",
      "Romania",
    ],
  },
  {
    id: "region",
    label: "Region",
    items: ["EMEA", "APAC", "Americas", "LATAM"],
  },
  {
    id: "category",
    label: "Category",
    items: ["Beauty", "Food", "Beverages", "Household", "Healthcare"],
  },
  {
    id: "brand",
    label: "Brand",
    items: ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"],
  },
];

export type ContextSelections = Record<ContextCategory, string[]>;

export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
  region: [],
  category: [],
  brand: [],
  page: [],
};
```

- [ ] **Step 2: Fix all references to `metrics` in the codebase**

Search for `metrics` references in these files and update them:

1. `src/hooks/use-context-selectors.ts` line 49: Remove `selections.metrics.length > 0` from `hasSelections`. Add `selections.region.length > 0 || selections.category.length > 0 || selections.brand.length > 0`.
2. `src/hooks/use-context-selectors.ts` line 57: Remove the `metrics` line from `toMetadata()`. Add lines for `region`, `category`, `brand`.
3. `src/components/thread/context-badges.tsx` line 4: Remove `BarChart3` import. Add icons for region (`MapPin`), category (`Tag`), brand (`Building2`).
4. `src/components/thread/context-badges.tsx` lines 27-32: Update `CATEGORY_ICON` — remove `metrics`, add `region`, `category`, `brand`.
5. `src/components/thread/context-badges.tsx` lines 40-49: Update `CATEGORY_COLORS` — remove `metrics`, add colors for `region`, `category`, `brand`.
6. `src/components/thread/context-badges.tsx` line 65: Update the iteration array to include new categories.
7. `src/lib/context-presets.ts` lines 37-41: Update `duplicatePreset` to spread new categories instead of `metrics`.
8. `src/lib/context-presets.ts` lines 46-54: Update `presetSummary` to count new categories instead of `metrics`.
9. `src/components/thread/context-popover.tsx`: Remove metrics category rendering. Add region/category/brand.

- [ ] **Step 3: Run the dev server and verify no TypeScript errors**

```bash
cd agent-chat-ui && npx next build 2>&1 | head -50
```

Expected: No type errors related to `metrics` or missing categories.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: replace Metrics with Region/Category/Brand in context system"
```

---

## Chunk 2: Filter Panel UI Components

### Task 5: Create the compact badge component

**Files:**
- Create: `agent-chat-ui/src/components/filters/compact-badge.tsx`

- [ ] **Step 1: Create compact-badge.tsx**

This component shows up to 3 items as individual badges. When 4+ items are selected, it shows the first item + a count (e.g. "Poland +4"). On hover, a tooltip shows the full list with remove buttons.

```typescript
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactBadgeProps {
  items: string[];
  colorClass?: string;
  icon?: React.ReactNode;
  onRemove?: (item: string) => void;
  maxVisible?: number;
}

export const CompactBadge: React.FC<CompactBadgeProps> = ({
  items,
  colorClass = "",
  icon,
  onRemove,
  maxVisible = 3,
}) => {
  if (items.length === 0) return null;

  if (items.length <= maxVisible) {
    return (
      <>
        {items.map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className={cn("gap-1 rounded-full text-xs font-normal", onRemove && "pr-1", colorClass)}
          >
            {icon}
            {item}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </>
    );
  }

  const remaining = items.length - 1;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn("gap-1 rounded-full text-xs font-normal cursor-default", colorClass)}
          >
            {icon}
            {items[0]} +{remaining}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px] p-2">
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className={cn(
                  "gap-1 rounded-full text-xs font-normal",
                  onRemove && "pr-1",
                  colorClass,
                )}
              >
                {item}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/filters/compact-badge.tsx
git commit -m "feat: add CompactBadge component with tooltip overflow"
```

---

### Task 6: Create the filter category accordion component

**Files:**
- Create: `agent-chat-ui/src/components/filters/filter-category.tsx`

- [ ] **Step 1: Create filter-category.tsx**

Each filter category is an accordion item with: per-category search, select all/clear, scrollable checkbox list, compact selection summary when collapsed.

```typescript
import React, { useState, useMemo } from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterCategoryProps {
  id: string;
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onSelectAll: (items: string[]) => void;
  onClear: () => void;
}

export const FilterCategory: React.FC<FilterCategoryProps> = ({
  id,
  label,
  items,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}) => {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(
    () =>
      search
        ? items.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
        : items,
    [items, search],
  );

  const summaryText =
    selected.length === 0
      ? null
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected[0]} +${selected.length - 1}`;

  return (
    <AccordionItem value={id} className="border-b-0">
      <AccordionTrigger className="px-3 py-2.5 text-sm font-medium hover:no-underline">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {summaryText && (
            <Badge
              variant="secondary"
              className="rounded-full text-[10px] font-normal px-1.5 py-0"
            >
              {summaryText}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => onSelectAll(filteredItems)}
              className="hover:text-foreground"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onClear}
              className="hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <ScrollArea className={cn(filteredItems.length > 6 && "h-[168px]")}>
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.includes(item)}
                    onCheckedChange={() => onToggle(item)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs">{item}</span>
                </label>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No results
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/filters/filter-category.tsx
git commit -m "feat: add FilterCategory accordion component with search and multi-select"
```

---

### Task 7: Create the date range filter component

**Files:**
- Create: `agent-chat-ui/src/components/filters/filter-date-range.tsx`

- [ ] **Step 1: Create filter-date-range.tsx**

Uses shadcn Calendar with a popover for date range selection.

```typescript
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "@/lib/filter-data";

interface FilterDateRangeProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export const FilterDateRange: React.FC<FilterDateRangeProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const hasRange = dateRange.from !== undefined;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Date range
        </div>
        {hasRange && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left text-xs font-normal h-8",
              !hasRange && "text-muted-foreground",
            )}
          >
            {hasRange
              ? `${formatDate(dateRange.from!)}${dateRange.to ? ` ~ ${formatDate(dateRange.to)}` : ""}`
              : "Select date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={
              dateRange.from
                ? { from: dateRange.from, to: dateRange.to }
                : undefined
            }
            onSelect={(range) =>
              onDateRangeChange({
                from: range?.from,
                to: range?.to,
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/filters/filter-date-range.tsx
git commit -m "feat: add FilterDateRange component with calendar popover"
```

---

### Task 8: Create the filter search component

**Files:**
- Create: `agent-chat-ui/src/components/filters/filter-search.tsx`

- [ ] **Step 1: Create filter-search.tsx**

Global search that filters across all categories. Uses a simple Input (not Command) since the categories use Accordion.

```typescript
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FilterSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const FilterSearch: React.FC<FilterSearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search filters..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/filters/filter-search.tsx
git commit -m "feat: add FilterSearch component"
```

---

### Task 9: Create the filter presets component

**Files:**
- Create: `agent-chat-ui/src/components/filters/filter-presets.tsx`

- [ ] **Step 1: Create filter-presets.tsx**

Dropdown to apply/save presets from within the filter panel.

```typescript
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, ChevronDown, Trash2, Save } from "lucide-react";
import { ContextPreset } from "@/lib/context-presets";

interface FilterPresetsProps {
  presets: ContextPreset[];
  onApply: (preset: ContextPreset) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  activePresetName?: string | null;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  onApply,
  onSave,
  onDelete,
  activePresetName,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 flex-1"
          >
            <Bookmark className="h-3.5 w-3.5" />
            {activePresetName ?? "Presets"}
            <ChevronDown className="h-3 w-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {presets.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No saved presets
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between text-xs"
                onClick={() => onApply(preset)}
              >
                <span className="truncate">{preset.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(preset.id);
                  }}
                  className="ml-2 rounded p-0.5 hover:bg-muted-foreground/20"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSave} className="text-xs">
            <Save className="mr-2 h-3.5 w-3.5" />
            Save current as preset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/filters/filter-presets.tsx
git commit -m "feat: add FilterPresets dropdown component"
```

---

## Chunk 3: Filter Sidebar Assembly & Layout Integration

### Task 10: Create the filter sidebar wrapper

**Files:**
- Create: `agent-chat-ui/src/components/filters/filter-sidebar.tsx`

- [ ] **Step 1: Create filter-sidebar.tsx**

Assembles all filter sub-components into the right sidebar using shadcn Sidebar.

```typescript
import React, { useState, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { FilterCategory } from "./filter-category";
import { FilterDateRange } from "./filter-date-range";
import { FilterSearch } from "./filter-search";
import { FilterPresets } from "./filter-presets";
import { FILTER_CATEGORIES, FilterCategory as FilterCategoryType, FilterSelections, DateRange } from "@/lib/filter-data";
import { ContextPreset } from "@/lib/context-presets";

interface FilterSidebarProps {
  selections: FilterSelections;
  dateRange: DateRange;
  onToggleItem: (category: FilterCategoryType, item: string) => void;
  onSelectAll: (category: FilterCategoryType, items: string[]) => void;
  onClearCategory: (category: FilterCategoryType) => void;
  onDateRangeChange: (range: DateRange) => void;
  onResetAll: () => void;
  hasSelections: boolean;
  // Presets
  presets: ContextPreset[];
  onApplyPreset: (preset: ContextPreset) => void;
  onSavePreset: () => void;
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
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  activePresetName,
}) => {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search) return FILTER_CATEGORIES;
    const lower = search.toLowerCase();
    return FILTER_CATEGORIES.filter(
      (cat) =>
        cat.label.toLowerCase().includes(lower) ||
        cat.items.some((item) => item.toLowerCase().includes(lower)),
    );
  }, [search]);

  return (
    <Sidebar side="right" collapsible="icon" className="border-l">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>
          {hasSelections && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onResetAll}
              title="Clear all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <FilterSearch value={search} onChange={setSearch} />
        <FilterPresets
          presets={presets}
          onApply={onApplyPreset}
          onSave={onSavePreset}
          onDelete={onDeletePreset}
          activePresetName={activePresetName}
        />
      </SidebarHeader>

      {/* Icon-only collapsed state */}
      <SidebarHeader className="hidden group-data-[collapsible=icon]:flex items-center justify-center p-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:hidden">
        <ScrollArea className="h-full">
          <div className="px-3 pb-2">
            <FilterDateRange
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
          <SidebarSeparator />
          <Accordion type="multiple" className="px-0">
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
      </SidebarContent>
    </Sidebar>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/filters/filter-sidebar.tsx
git commit -m "feat: add FilterSidebar wrapper assembling all filter components"
```

---

### Task 11: Integrate filter sidebar into the page layout

**Files:**
- Modify: `agent-chat-ui/src/app/page.tsx`

- [ ] **Step 1: Add FilterSidebar to the layout**

The key challenge: shadcn's `SidebarProvider` manages one sidebar. For dual sidebars, we need a second `SidebarProvider` wrapping the right sidebar, or we use a simpler approach of placing the right sidebar outside the provider and managing its state independently via `useFilters`.

Update `page.tsx`:

```typescript
"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/demo/app-sidebar";
import React from "react";

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <SidebarProvider>
        <AppSidebar />
        <ThreadProvider>
          <StreamProvider>
            <ArtifactProvider>
              <Thread />
            </ArtifactProvider>
          </StreamProvider>
        </ThreadProvider>
      </SidebarProvider>
    </React.Suspense>
  );
}
```

Note: The `FilterSidebar` will be rendered INSIDE the `Thread` component (similar to how the artifact panel is inline). This avoids the dual-SidebarProvider issue. The Thread component already manages a flexible grid layout and is where all the state hooks live.

Actually, the better approach: render `FilterSidebar` inside Thread's layout grid, right after the main chat column. Thread already uses a grid for the artifact panel. We add the filter sidebar as another grid column.

This means Task 11 may not need `page.tsx` changes — the integration happens in Task 12 inside `Thread`.

- [ ] **Step 2: Verify the current Thread grid layout**

Read `src/components/thread/index.tsx` around the grid layout (near the artifact section) to understand the current structure before modifying.

- [ ] **Step 3: Commit (if page.tsx was changed)**

```bash
git add agent-chat-ui/src/app/page.tsx
git commit -m "feat: update page layout for filter sidebar"
```

---

### Task 12: Wire filter sidebar into Thread component

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

This is the main integration task. Changes needed:

- [ ] **Step 1: Add imports at top of file**

Add these imports to Thread's import section:

```typescript
import { useFilters } from "@/hooks/use-filters";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
```

- [ ] **Step 2: Initialize useFilters hook**

Near the other hook calls (around line 177-202), add:

```typescript
const {
  selections: filterSelections,
  dateRange,
  useAsContext,
  setUseAsContext,
  toggleItem: toggleFilterItem,
  removeItem: removeFilterItem,
  selectAll: selectAllFilter,
  clearCategory: clearFilterCategory,
  resetAll: resetAllFilters,
  hasSelections: hasFilterSelections,
  toMetadata: filterToMetadata,
  setSelections: setFilterSelections,
  setDateRange,
} = useFilters();
```

- [ ] **Step 3: Add the "Ask AI using your filters" toggle**

In the input area, above the context badges (around line 945), add:

```tsx
{/* Ask AI using your filters toggle */}
<div className="flex items-center gap-2 px-5 pt-2">
  <Switch
    id="use-filters"
    checked={useAsContext}
    onCheckedChange={(checked) => {
      setUseAsContext(checked);
      toast(
        checked
          ? "AI will now use your selected filters as context"
          : "AI will no longer use your filters",
      );
    }}
    className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
  />
  <Label htmlFor="use-filters" className="text-xs text-muted-foreground cursor-pointer">
    Ask AI using your filters
  </Label>
</div>
```

- [ ] **Step 4: Update handleSubmit to merge filter context**

In the `handleSubmit` function (around line 504-556), update the metadata construction:

```typescript
const contextMeta = contextToMetadata();
const quotesMeta = quotesToMetadata();
const filterMeta = useAsContext ? filterToMetadata() : undefined;

const combinedMeta =
  contextMeta || quotesMeta || filterMeta
    ? { ...contextMeta, ...quotesMeta, ...(filterMeta ? { filters: filterMeta } : {}) }
    : undefined;
```

- [ ] **Step 5: Render FilterSidebar in the layout**

The FilterSidebar needs to appear as a right-side panel. Place it after the main chat content, using a flex layout. Wrap the existing chat + artifact grid and the filter sidebar in a flex container:

Find the outermost container div of Thread and update it to include the sidebar. The exact placement depends on the current layout structure — the sidebar should sit to the right of everything else, outside the messages/input area.

Wire up all props:

```tsx
<FilterSidebar
  selections={filterSelections}
  dateRange={dateRange}
  onToggleItem={toggleFilterItem}
  onSelectAll={selectAllFilter}
  onClearCategory={clearFilterCategory}
  onDateRangeChange={setDateRange}
  onResetAll={resetAllFilters}
  hasSelections={hasFilterSelections}
  presets={presets}
  onApplyPreset={handleApplyPreset}
  onSavePreset={handleSavePreset}
  onDeletePreset={deletePreset}
  activePresetName={activePresetName}
/>
```

- [ ] **Step 6: Add preset handlers for unified presets**

Add handler functions that apply presets to both context and filter state:

```typescript
const handleApplyPreset = useCallback((preset: ContextPreset) => {
  setContextSelections(preset.selections);
  if (preset.filters) {
    setFilterSelections(preset.filters);
  }
  setActivePreset(preset);
}, []);

const handleSavePreset = useCallback(() => {
  const name = `Preset ${presets.length + 1}`;
  addPreset(name, contextSelections, filterSelections);
}, [presets, contextSelections, filterSelections, addPreset]);
```

- [ ] **Step 7: Verify the app builds and renders**

```bash
cd agent-chat-ui && npm run dev
```

Open in browser, verify:
- Right sidebar appears with filter icon when collapsed
- Expands to show all filter categories
- Checkboxes work for selection
- Date range picker opens
- Toggle appears above input box

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: integrate filter sidebar into Thread with toggle and preset support"
```

---

## Chunk 4: Unified Presets & Context Sync

### Task 13: Extend preset type to include filters

**Files:**
- Modify: `agent-chat-ui/src/lib/context-presets.ts`
- Modify: `agent-chat-ui/src/hooks/use-context-presets.ts`

- [ ] **Step 1: Update ContextPreset type in context-presets.ts**

Add `filters` as an optional field (for backward compatibility with existing saved presets):

```typescript
import { ContextSelections, EMPTY_SELECTIONS } from "./context-selectors";
import { FilterSelections, EMPTY_FILTER_SELECTIONS } from "./filter-data";

export interface ContextPreset {
  id: string;
  name: string;
  selections: ContextSelections;
  filters?: FilterSelections;
}
```

- [ ] **Step 2: Update createPreset to accept filters**

```typescript
export function createPreset(
  name: string,
  selections: ContextSelections,
  filters?: FilterSelections,
): ContextPreset {
  return {
    id: generateId(),
    name,
    selections: { ...selections },
    filters: filters ? { ...filters } : undefined,
  };
}
```

- [ ] **Step 3: Update duplicatePreset to copy filters**

```typescript
export function duplicatePreset(preset: ContextPreset): ContextPreset {
  return {
    id: generateId(),
    name: `Copy of ${preset.name}`,
    selections: {
      countries: [...preset.selections.countries],
      platforms: [...preset.selections.platforms],
      region: [...(preset.selections.region ?? [])],
      category: [...(preset.selections.category ?? [])],
      brand: [...(preset.selections.brand ?? [])],
      page: [...(preset.selections.page ?? [])],
    },
    filters: preset.filters
      ? Object.fromEntries(
          Object.entries(preset.filters).map(([k, v]) => [k, [...v]]),
        ) as FilterSelections
      : undefined,
  };
}
```

- [ ] **Step 4: Update presetSummary to include filter counts**

```typescript
export function presetSummary(preset: ContextPreset): string {
  const parts: string[] = [];
  const c = preset.selections.countries.length;
  const p = preset.selections.platforms.length;
  const r = (preset.selections.region ?? []).length;
  if (c > 0) parts.push(`${c} ${c === 1 ? "country" : "countries"}`);
  if (p > 0) parts.push(`${p} ${p === 1 ? "platform" : "platforms"}`);
  if (r > 0) parts.push(`${r} ${r === 1 ? "region" : "regions"}`);

  // Count filter selections
  if (preset.filters) {
    const filterCount = Object.values(preset.filters).reduce((sum, arr) => sum + arr.length, 0);
    if (filterCount > 0) parts.push(`${filterCount} ${filterCount === 1 ? "filter" : "filters"}`);
  }

  return parts.join(", ") || "Empty";
}
```

- [ ] **Step 5: Update useContextPresets hook addPreset signature**

In `src/hooks/use-context-presets.ts`, update `addPreset`:

```typescript
const addPreset = useCallback(
  (name: string, selections: ContextSelections, filters?: FilterSelections) => {
    const preset = createPreset(name, selections, filters);
    setPresets((prev) => [...prev, preset]);
    return preset;
  },
  [],
);
```

Add the `FilterSelections` import at top.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: extend preset system to include filter selections"
```

---

### Task 14: Update context badges to use compact badge pattern

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-badges.tsx`

- [ ] **Step 1: Refactor badges to group by category and show compact format**

Update the rendering logic to group items by category and use the compact pattern (first item + count when > 3):

Replace the badge mapping section (around lines 171-206) with grouped rendering that uses `CompactBadge`:

```typescript
import { CompactBadge } from "@/components/filters/compact-badge";

// In the component, replace individual badge mapping with:
{(["countries", "platforms", "region", "category", "brand", "page"] as ContextCategory[]).map(
  (cat) => {
    const items = selections[cat] ?? [];
    if (items.length === 0) return null;
    return (
      <CompactBadge
        key={cat}
        items={
          cat === "page"
            ? items.map((id) => pageWidgets.find((w) => w.id === id)?.title ?? id)
            : items
        }
        icon={CATEGORY_ICON[cat]}
        colorClass={CATEGORY_COLORS[cat]}
        onRemove={
          onRemove
            ? (item) => {
                const original =
                  cat === "page"
                    ? pageWidgets.find((w) => w.title === item)?.id ?? item
                    : item;
                onRemove(cat, original);
              }
            : undefined
        }
      />
    );
  },
)}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: refactor context badges to use compact badge pattern"
```

---

### Task 15: Add two-way sync between filters and context popover

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

When the "Ask AI using your filters" toggle is ON, selecting items in the context popover for shared categories (platforms, countries, region, category, brand) should sync to the filter panel and vice versa.

- [ ] **Step 1: Create sync effect**

In Thread, add a sync mechanism. The shared categories between context and filters are: platforms → platform, countries → country, region → region, category → category, brand → brand.

Add a mapping and sync callbacks:

```typescript
// Mapping between context categories and filter categories
const CONTEXT_TO_FILTER_MAP: Partial<Record<ContextCategory, FilterCategory>> = {
  platforms: "platform",
  countries: "country",
  region: "region",
  category: "category",
  brand: "brand",
};

// When toggle is ON, wrap toggleItem to also update filters
const handleToggleContextItem = useCallback(
  (category: ContextCategory, item: string) => {
    toggleItem(category, item);
    if (useAsContext) {
      const filterCat = CONTEXT_TO_FILTER_MAP[category];
      if (filterCat) {
        toggleFilterItem(filterCat, item);
      }
    }
  },
  [toggleItem, useAsContext, toggleFilterItem],
);

// When toggle is ON, wrap filter toggle to also update context
const handleToggleFilterItem = useCallback(
  (category: FilterCategory, item: string) => {
    toggleFilterItem(category, item);
    if (useAsContext) {
      const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
        ([, v]) => v === category,
      )?.[0] as ContextCategory | undefined;
      if (contextCat) {
        toggleItem(contextCat, item);
      }
    }
  },
  [toggleFilterItem, useAsContext, toggleItem],
);
```

Pass `handleToggleContextItem` to ContextPopover and `handleToggleFilterItem` to FilterSidebar instead of the raw toggle functions.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add two-way sync between context popover and filter panel"
```

---

## Chunk 5: Polish & Final Integration

### Task 16: Update the context popover categories

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-popover.tsx`

- [ ] **Step 1: Verify popover renders new categories**

Since we updated `context-selectors.ts` in Task 4 (removed metrics, added region/category/brand), the popover should already pick up the new categories from `CONTEXT_CATEGORIES`. Verify:

- Region, Category, Brand appear in the category list
- Metrics no longer appears
- Selection works for new categories

If the popover hardcodes category rendering, update it to use `CONTEXT_CATEGORIES` dynamically.

- [ ] **Step 2: Commit if changes were needed**

```bash
git add -A
git commit -m "feat: update context popover to show new categories"
```

---

### Task 17: Add filter-sourced badge distinction

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-badges.tsx`

- [ ] **Step 1: Add visual indicator for filter-sourced badges**

When the toggle is ON, badges that came from the filter panel should have a subtle filter icon. Add an optional `filterSourced` prop to CompactBadge or add a small `SlidersHorizontal` icon overlay.

This is a visual nicety — the simplest approach is to add a small filter icon next to filter-sourced category badges in the context badges area. Since with sync ON both systems share state, we can show a combined indicator.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "style: add visual distinction for filter-sourced context badges"
```

---

### Task 18: Handle empty state for toggle

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Show hint when toggle is ON but no filters selected**

Below the toggle, show a subtle hint:

```tsx
{useAsContext && !hasFilterSelections && (
  <p className="px-5 text-[11px] text-muted-foreground">
    Select filters in the panel to give AI more context
  </p>
)}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add empty state hint for filter toggle"
```

---

### Task 19: End-to-end verification

- [ ] **Step 1: Verify filter panel**
- Open app, verify right sidebar shows with filter icon when collapsed
- Expand sidebar, verify all 10 categories appear
- Search works across categories
- Multi-select checkboxes work
- Date range picker works
- Reset clears everything
- Panel state persists on page refresh

- [ ] **Step 2: Verify toggle and context merge**
- Turn on "Ask AI using your filters"
- Select filters — verify they appear as context badges
- Send a message — verify filters are included in context metadata
- Turn off toggle — verify filters no longer affect context
- Toggle state persists on refresh

- [ ] **Step 3: Verify presets**
- Save a preset with both context and filter selections
- Apply it — verify both systems hydrate
- Delete/rename works

- [ ] **Step 4: Verify compact badges**
- Select 4+ items in a category
- Verify "Poland +4" pattern appears
- Hover shows tooltip with full list and remove buttons

- [ ] **Step 5: Verify two-way sync**
- Toggle ON, select "Meta" via `@` popover — check it's selected in filter panel
- Select "Poland" in filter panel — check it appears as context badge
- Toggle OFF — verify no sync

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete filter panel implementation with context integration"
```
