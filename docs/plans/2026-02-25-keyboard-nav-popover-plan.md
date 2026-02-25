# Keyboard-Navigable Context Popover — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the `@`-triggered context popover fully keyboard-navigable with arrow keys, cross-category search, and proper Escape/focus behavior.

**Architecture:** Rewrite `context-popover.tsx` to add a `onKeyDown` handler on the `Command` root that intercepts `ArrowLeft`, `ArrowRight`, and `Escape` for level navigation. On the root page, switch from showing categories to showing cross-category search results (items from all categories with group headings) when the search input has text. cmdk handles `↑`/`↓` and search filtering natively.

**Tech Stack:** React, cmdk (Command), Radix Popover, shadcn/ui

---

### Task 1: Add `onKeyDown` handler for `←`, `→`, `Escape` navigation

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-popover.tsx`

**Step 1: Add a `search` state and `onKeyDown` handler**

Replace the entire `context-popover.tsx` with the following. Key changes from existing:

1. Add `search` state to track the search input value
2. Add `handleKeyDown` on the `Command` component that intercepts:
   - `ArrowRight`: if on category page with no search, drill into the cmdk-highlighted category
   - `ArrowLeft`: if on items page, go back to categories; if on category page, close popover
   - `Escape`: if on items page, go back to categories; if on category page, close popover
3. On the root page, when `search` is non-empty, show items from ALL categories grouped under headings (cross-category search), each toggleable directly via `Enter`
4. When `search` is empty on root page, show the original category list
5. Reset `search` to `""` when switching between pages

```tsx
import React, { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Megaphone, ChevronRight, ChevronLeft } from "lucide-react";
import {
  ContextCategory,
  ContextSelections,
  CONTEXT_CATEGORIES,
} from "@/lib/context-selectors";

const CATEGORY_ICONS: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-4 w-4 text-muted-foreground" />,
  platforms: <Megaphone className="h-4 w-4 text-muted-foreground" />,
};

interface ContextPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCategory: ContextCategory | null;
  onCategorySelect: (category: ContextCategory | null) => void;
  selections: ContextSelections;
  onToggleItem: (category: ContextCategory, item: string) => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}

export const ContextPopover: React.FC<ContextPopoverProps> = ({
  open,
  onOpenChange,
  activeCategory,
  onCategorySelect,
  selections,
  onToggleItem,
  children,
  align = "start",
  side = "top",
}) => {
  const [search, setSearch] = useState("");

  const activeCategoryConfig = activeCategory
    ? CONTEXT_CATEGORIES.find((c) => c.id === activeCategory)
    : null;

  // Reset search when popover opens/closes or category changes
  React.useEffect(() => {
    setSearch("");
  }, [open, activeCategory]);

  /** Get the cmdk-highlighted item's value */
  const getSelectedValue = useCallback((): string | null => {
    const el = document.querySelector("[cmdk-item][data-selected=true]");
    return el?.getAttribute("data-value") ?? null;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (!activeCategory && !search) {
          // On category page with no search — drill into highlighted category
          const value = getSelectedValue();
          const cat = CONTEXT_CATEGORIES.find((c) => c.id === value);
          if (cat) {
            e.preventDefault();
            onCategorySelect(cat.id);
          }
        }
        // On items page or search results, ArrowRight does nothing special
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeCategory) {
          // On items page — go back to categories
          onCategorySelect(null);
        } else {
          // On category page — close popover
          onOpenChange(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (activeCategory) {
          // On items page — go back to categories
          onCategorySelect(null);
        } else {
          // On category page — close popover
          onOpenChange(false);
        }
      }
    },
    [activeCategory, search, getSelectedValue, onCategorySelect, onOpenChange],
  );

  /** Root page: cross-category search results */
  const renderCrossCategorySearch = () => (
    <>
      {CONTEXT_CATEGORIES.map((cat) => (
        <CommandGroup key={cat.id} heading={cat.label}>
          {cat.items.map((item) => {
            const checked = selections[cat.id].includes(item);
            return (
              <CommandItem
                key={`${cat.id}-${item}`}
                value={`${cat.id}-${item}`}
                onSelect={() => onToggleItem(cat.id, item)}
                className="flex items-center gap-2"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span>{item}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      ))}
    </>
  );

  /** Root page: category list (no search) */
  const renderCategoryList = () => (
    <CommandGroup>
      {CONTEXT_CATEGORIES.map((cat) => {
        const count = selections[cat.id].length;
        return (
          <CommandItem
            key={cat.id}
            value={cat.id}
            onSelect={() => onCategorySelect(cat.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[cat.id]}
              <span>{cat.label}</span>
              {count > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({count})
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CommandItem>
        );
      })}
    </CommandGroup>
  );

  /** Items page: single category with checkboxes */
  const renderItemsList = () => (
    <>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          aria-label="Back to categories"
          className="flex items-center gap-1 rounded px-1 py-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {activeCategoryConfig?.label}
        </span>
      </div>
      <CommandInput
        placeholder={`Search ${activeCategoryConfig?.label?.toLowerCase()}...`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No items found.</CommandEmpty>
        <CommandGroup>
          {activeCategoryConfig?.items.map((item) => {
            const checked = selections[activeCategory!].includes(item);
            return (
              <CommandItem
                key={item}
                value={item}
                onSelect={() => onToggleItem(activeCategory!, item)}
                className="flex items-center gap-2"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span>{item}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </>
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0"
        align={align}
        side={side}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
      >
        <Command shouldFilter={true}>
          {!activeCategory ? (
            <>
              <CommandInput
                placeholder="Search context..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {search ? renderCrossCategorySearch() : renderCategoryList()}
              </CommandList>
            </>
          ) : (
            renderItemsList()
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

**Step 2: Verify build**

```bash
cd /Users/jed/Downloads/odin-dev/agent-chat-ui && pnpm build
```

Expected: PASS

**Step 3: Manual test**

1. Type `@` in textarea → popover opens at category level
2. Press `↓` to highlight "Platforms", press `→` → drills into Platforms
3. Press `↓`/`↑` to navigate items, `Enter` to toggle checkbox
4. Press `←` → back to categories
5. Press `Escape` → closes popover, focus returns to textarea
6. Type `@`, then type "pol" → cross-category results show "Poland" under Countries heading
7. Press `Enter` on "Poland" → toggles it, badge appears
8. Clear search → returns to category list
9. Drill into a category, press `Escape` → goes back to categories (not close)
10. Press `Escape` again → closes popover

**Step 4: Commit**

```bash
cd /Users/jed/Downloads/odin-dev && git add agent-chat-ui/src/components/thread/context-popover.tsx
git commit -m "feat: add full keyboard navigation and cross-category search to context popover"
```

---

### Task 2: Ensure `onKeyDown` doesn't leak to textarea

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-popover.tsx`

The `onKeyDown` handler is on the `PopoverContent`, which is rendered in a portal. Radix Popover portals should already trap focus, but verify that arrow keys and typing don't leak back to the textarea.

**Step 1: Test**

1. Open `@` popover
2. Type characters → should appear in search, NOT in textarea
3. Press arrow keys → should navigate popover, NOT move textarea cursor

If characters leak to textarea, add `e.stopPropagation()` for all key events on the `PopoverContent`.

**Step 2: If needed, add stopPropagation**

Add to the `onKeyDown` on `PopoverContent`:

```tsx
onKeyDown={(e) => {
  // Prevent all keystrokes from leaking to textarea
  e.stopPropagation();
  handleKeyDown(e);
}}
```

**Step 3: Verify build and test**

```bash
cd /Users/jed/Downloads/odin-dev/agent-chat-ui && pnpm build
```

**Step 4: Commit (if changes were needed)**

```bash
cd /Users/jed/Downloads/odin-dev && git add agent-chat-ui/src/components/thread/context-popover.tsx
git commit -m "fix: prevent keyboard events from leaking to textarea when popover is open"
```

---

## Summary

| Task | Description | Key Change |
|------|-------------|------------|
| 1 | Full keyboard nav + cross-category search | Rewrite context-popover.tsx with onKeyDown handler, search state, cross-category results |
| 2 | Ensure no keystroke leaking | Verify and fix event propagation |
