# Settings Modal — Design Spec

## Overview

Create a macOS-style split-pane settings modal accessible from the AppSidebar user dropdown. Consolidate all scattered UI toggles into a centralized settings experience with live-updating preferences. Promote `AppSidebar` to a shared layout element across all pages.

## Goals

1. Shared `AppSidebar` across all pages (lifted to root layout)
2. Centralized settings modal with three categories: General, Shortcuts, Presets
3. All settings changes apply live (no reload required)
4. Replace scattered toggle buttons with a single `SettingsProvider`

## Architecture

### Structural Change: Shared AppSidebar

Move `AppSidebar` + `SidebarProvider` from individual pages into the root layout:

```
layout.tsx
  └─ SidebarProvider
       ├─ AppSidebar          (always present)
       └─ {children}          (page content)
```

Each page retains its own providers (Thread, Stream, Filter, etc.).

### SettingsProvider

New React context persisted to localStorage (`odin-settings`):

```ts
interface Settings {
  navSidebarVisible: boolean;    // default: true
  chatHistoryVisible: boolean;   // default: true
  filterSidebarVisible: boolean; // default: true
  showToolCalls: boolean;        // default: false
  showSuggestions: boolean;      // default: true
  theme: "light" | "dark" | "system"; // default: "system"
}
```

Replaces the scattered `useQueryState` / `useState` toggles in `thread/index.tsx`, `chat-header.tsx`, and `chat-input.tsx`. Components consume `useSettings()` instead.

Theme setting wraps `next-themes` `setTheme` — the provider calls it reactively when `settings.theme` changes.

## Modal Layout

macOS System Settings style — split pane within a Radix `Dialog` (~700x500):

- **Left column** (~160px): Category list (`General`, `Shortcuts`, `Presets`). Active item highlighted. Simple button list.
- **Right column**: Scrollable content area for selected category.

Triggered from AppSidebar user dropdown "Settings" item.

## General Pane

Three subsections:

| Subsection | Setting | Control | Default |
|---|---|---|---|
| Appearance | Theme | Dropdown (Light/Dark/System) | System |
| Layout | Navigation sidebar | Switch | On |
| Layout | Chat history panel | Switch | On |
| Layout | Filter sidebar | Switch | On |
| Chat | Show tool calls | Switch | Off |
| Chat | Show suggestions | Switch | On |

Each switch toggles immediately — UI behind the modal updates in real time.

## Shortcuts Pane

- Header with "Shortcuts" title + "+ New" button
- List of shortcut cards showing: name (bold), truncated instructions preview, Edit/Delete icon buttons
- **Inline editing**: clicking Edit expands the card with editable `name` input, `instructions` textarea, and optional context/preset selectors. Save/Cancel buttons collapse it back.
- **New shortcut**: inserts an expanded empty card at the top
- Uses existing `useShortcuts` hook — no new storage logic

## Presets Pane

- Same pattern as Shortcuts: header + "+ New", list of preset cards
- Each card shows name + summary (e.g. "3 countries, 2 platforms")
- Inline editing expands to show preset name input and read-only summary of filter selections
- Rename and delete inline. To modify a preset's filters, user applies it from the filter sidebar, adjusts, and saves over it (existing flow).
- Uses existing `useContextPresets` hook

## Migration: What Moves / Gets Removed

| Current Location | What | Action |
|---|---|---|
| `chat-header.tsx` | Tool calls toggle button | Remove (now in Settings > General) |
| `chat-header.tsx` | History visible toggle button | Remove (now in Settings > General) |
| `chat-header.tsx` | Theme toggle dropdown | Remove (now in Settings > General) |
| `chat-input.tsx` | Suggestions toggle button | Remove (now in Settings > General) |
| `thread/index.tsx` | `useQueryState` for `hideToolCalls`, `historyVisible` | Replace with `useSettings()` |
| `thread/index.tsx` | `useState` for `showSuggestions` | Replace with `useSettings()` |

## File Plan

| File | Action |
|---|---|
| `providers/Settings.tsx` | **New** — SettingsProvider context + `useSettings` hook |
| `components/settings/settings-modal.tsx` | **New** — split-pane modal shell |
| `components/settings/general-pane.tsx` | **New** — General settings content |
| `components/settings/shortcuts-pane.tsx` | **New** — Shortcuts management with inline editing |
| `components/settings/presets-pane.tsx` | **New** — Presets management with inline editing |
| `app/layout.tsx` | **Edit** — add SidebarProvider, AppSidebar, SettingsProvider |
| `app/page.tsx` | **Edit** — remove SidebarProvider + AppSidebar |
| `app/demo/page.tsx` | **Edit** — remove SidebarProvider + AppSidebar |
| `components/demo/app-sidebar.tsx` | **Edit** — wire Settings item to open modal |
| `components/thread/index.tsx` | **Edit** — consume `useSettings()` instead of local toggle state |
| `components/thread/chat-header.tsx` | **Edit** — remove toggle buttons |
| `components/thread/chat-input.tsx` | **Edit** — remove suggestions toggle |

## Styling

- All colors via CSS variable Tailwind classes (no hardcoded hex)
- Modal uses `glass-panel` utility where appropriate
- Left sidebar category list: `bg-surface-deep` background, active item with `bg-accent` highlight
- Switch components use existing `@/components/ui/switch` (Radix, `bg-brand-accent` when checked)
- Consistent with existing design language
