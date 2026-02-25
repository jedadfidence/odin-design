# Keyboard-Navigable Context Popover — Design

**Date**: 2026-02-25
**Status**: Approved

## Overview

Make the `@`-triggered context popover fully keyboard-navigable with arrow key navigation, cross-category search, and focus trapping.

## Keyboard Mapping

| Key | Category page | Items page |
|-----|--------------|------------|
| `↑` / `↓` | Navigate categories (and search) | Navigate items (and search) |
| `→` or `Enter` | Drill into highlighted category | Toggle checkbox on highlighted item |
| `←` | Close popover | Go back to categories |
| `Enter` | Drill into category (or toggle if search result is an item) | Toggle checkbox |
| `Escape` | Close popover | Go back to categories |
| Typing | Cross-category search (shows matching items from ALL categories) | Category-specific search |

## Cross-Category Search (Root Page)

When typing in search on the category page, results show items from all categories, grouped:

```
┌──────────────────┐
│ 🔍 pol           │
├──────────────────┤
│  Countries       │  ← group header (not selectable)
│  ☐ Poland        │  ← Enter toggles directly
│  Platforms       │
│  (no matches)    │
└──────────────────┘
```

- Matching items are toggleable directly without drilling in
- When search is cleared, view returns to category list
- Group headers are visual only, keyboard skips them

## Navigation Flow

```
┌─────────────┐  →/Enter   ┌──────────────┐
│  Categories │ ──────────→ │  Items list  │
│  (search    │             │  (search     │
│   cross-cat)│ ←/Escape   │   in-cat)    │
│             │ ←────────── │              │
└─────────────┘             └──────────────┘
      │                            │
   Escape                       Enter
      │                            │
      ↓                            ↓
  Close popover             Toggle checkbox
  + focus textarea
```

## Focus Trapping

- All keystrokes captured inside the popover while open
- `↑` from first item → moves focus to search input
- `↓` from search input → moves focus to first item
- Popover closing always returns focus to textarea

## Implementation Approach

Keep the cmdk `Command` component for search/filter but intercept `onKeyDown` at the popover level to handle `←`, `→`, `Escape`, and `Enter` for the two-level drill-in navigation pattern.
