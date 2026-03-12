# Filter Panel Design

## Overview

Add a persistent, collapsible right-side filter panel to the chat UI. Filters can optionally be used as AI chat context via a toggle. Presets are unified — one save captures both filter and context selections.

## Layout

Dual-sidebar layout using shadcn's `SidebarProvider`:
- Left sidebar: existing navigation (unchanged)
- Right sidebar: filter panel (`Sidebar` with `side="right"`)
- Chat area flexes between both sidebars

**Collapsed state:** Thin icon strip with a filter icon — matches left sidebar pattern. Click to expand.

**Responsive:** Chat area adjusts fluidly when either sidebar collapses/expands.

## Filter Panel Contents

### Header
- Title: "Filters"
- Reset all button (clears every filter)
- Search input (`Command`) — searches across all categories

### Presets Section
- Dropdown to select/apply a saved preset
- "Save as preset" button — captures current filters + context selections
- Rename/delete actions on each preset

### Date Range
- Single date range picker (single-select)
- Reset button to clear

### Filter Categories (Accordion)
All multi-select with checkboxes. Flat list (no grouping):

1. **Item ID**
2. **Platform** — Meta, Google, TikTok, Snapchat, Pinterest, LinkedIn
3. **Placement** — Feed, Stories, Reels, Search, Display, Video
4. **Objective** — Awareness, Reach, Traffic, Engagement, Conversions, Sales
5. **Buying type** — Auction, Reservation, Fixed
6. **Performance goal** — Impressions, Clicks, Conversions, Video Views, Reach
7. **Region** — EMEA, APAC, Americas, LATAM
8. **Country** — Poland, Germany, UK, France, Spain, Italy, US, Canada, Brazil
9. **Category** — Beauty, Food, Beverages, Household, Healthcare
10. **Brand** — Brand A, Brand B, Brand C, Brand D, Brand E

### Each Category (Expanded)
- Search input to filter options within the category
- "Select all" / "Clear" actions
- Scrollable checkbox list (max ~6 visible, scroll for more)

### Compact Badge Pattern
- 1-3 selected: show individual badges inline
- 4+ selected: `Meta +3` — single compact badge
- Hover tooltip shows full list with individual remove (`X`) per item
- Applies everywhere: filter panel, context badges, popover

## "Ask AI Using Your Filters" Toggle

### Placement
Above the input box, left-aligned, next to context badges.

### Behavior
- **OFF:** Filter panel is independent. Chat context comes only from manual `@` selections and text quotes.
- **ON:** Filter selections merge into the chat context alongside `@` selections.
- State persisted in localStorage.

### Copy
- Toggle label: "Ask AI using your filters"
- Toast (on): "AI will now use your selected filters as context"
- Toast (off): "AI will no longer use your filters"
- Empty state hint: "Select filters in the panel to give AI more context"

### Two-Way Sync (Toggle ON)
- Selecting "Meta" via `@` popover checks "Meta" in filter panel
- Selecting "Poland" in filter panel shows as context badge near input
- Removing a filter-sourced badge deselects it in the filter panel
- Duplicate selections from both sources display as one badge

### Context Badge Display (Unified)
- Filter-sourced badges get a subtle visual distinction (small filter icon or different variant)
- Same compact pattern: `Platform: Meta +2` `Country: Poland +4`
- Hover tooltip with full list + individual remove

## Context Popover Changes

### Categories (Updated)
- Remove: Metrics
- Add: Region, Category, Brand (with same dummy data as filter panel)
- Keep: Platforms, Countries, Page Widgets

### Sync
When toggle is ON, popover and filter panel share state. When OFF, popover works independently.

## Unified Presets

### Current State
Presets save context selections only (from `@` popover).

### New Shape
```typescript
{
  name: string;
  selections: Record<ContextCategory, string[]>; // existing @ context
  filters: Record<FilterCategory, string[]>;      // new filter state
}
```

### Behavior
- Applying a preset (from either panel or popover) hydrates both systems
- Saving from either location captures both filter + context state
- Existing presets migrated — `filters` field defaults to empty

## shadcn/ui Components

| Component | Usage |
|-----------|-------|
| `Sidebar` (side="right") | Filter panel shell |
| `Accordion` | Expandable filter categories |
| `Checkbox` | Multi-select options |
| `Command` | Search (panel-level and per-category) |
| `Switch` | "Ask AI using your filters" toggle |
| `Tooltip` | Compact badge hover |
| `Badge` | Selected item tags |
| `Button` | Reset, save, collapse |
| `Popover` | Date range picker |
| `Separator` | Visual dividers |
| `ScrollArea` | Scrollable option lists |
| `Calendar` | Date range (NEW - install) |

**New installs needed:** `Accordion`, `ScrollArea`, `Calendar`

## File Structure

```
src/
├── components/
│   ├── filters/
│   │   ├── filter-sidebar.tsx      # Right sidebar wrapper
│   │   ├── filter-category.tsx     # Accordion item with checkboxes
│   │   ├── filter-search.tsx       # Global search across categories
│   │   ├── filter-date-range.tsx   # Date range picker
│   │   ├── filter-presets.tsx      # Preset dropdown + save
│   │   └── compact-badge.tsx       # "Poland +4" badge with tooltip
│   └── ui/
│       ├── accordion.tsx           # NEW
│       ├── scroll-area.tsx         # NEW
│       └── calendar.tsx            # NEW
├── hooks/
│   └── use-filters.ts             # Filter state, persistence, sync
├── lib/
│   └── filter-data.ts             # Dummy data for all categories
```

## State Management

- **`useFilters()`** — new hook for filter selections, localStorage persistence, reset
- **Extend `useContextPresets()`** — add `filters` field to preset shape
- **Extend `useContextSelectors()`** — sync logic when toggle is ON
- **Shared `compact-badge.tsx`** — used in filter panel + context badges area

## Persistence

- Filter selections: localStorage (`odin-filter-selections`)
- Toggle state: localStorage (`odin-use-filters-as-context`)
- Presets: existing localStorage key (`odin-context-presets`) — extended shape
