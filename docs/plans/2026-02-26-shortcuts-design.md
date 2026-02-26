# Shortcuts Feature Design

## Overview

Shortcuts let users save reusable prompt templates with optional context filters. Selecting a shortcut pre-fills the input box with saved prompt text and applies saved context selections (countries, platforms, metrics). Coexists with the existing presets system — presets are lightweight context filters, shortcuts are full prompt + context bundles.

## Data Model

```ts
interface Shortcut {
  id: string;                        // crypto.randomUUID()
  name: string;                      // display name
  instructions: string;              // prompt text
  context: ContextSelections | null;  // { countries: string[], platforms: string[], metrics: string[] }
  presetId: string | null;           // optional preset reference (display only)
  createdAt: number;                 // Date.now()
  updatedAt: number;
}
```

- Stored in `localStorage["odin-shortcuts"]`
- Context is stored as an inline snapshot — if a preset was used as a starting point and then tweaked, the final selections are saved, not the preset reference
- `presetId` is kept for display only (e.g., "Based on preset: US Markets"); if the preset is deleted, the shortcut's context still works
- Five default shortcuts seeded on first load

## Slash Command Popover

**Trigger:** `/` key in textarea at position 0 or after whitespace/newline (mirrors the `@` context trigger pattern). Prevents the `/` character from being typed.

**Component:** `ShortcutPopover` — Radix Popover + cmdk Command (same pattern as `ContextPopover`).

```
┌─────────────────────────────┐
│ Search shortcuts...          │
├─────────────────────────────┤
│ ⚡ Performance Analysis   ✏️ │
│ ⚡ Low-Hanging Fruits     ✏️ │
│ ⚡ Competitor Benchmark   ✏️ │
│ ⚡ Budget Optimizer       ✏️ │
│ ⚡ Weekly Digest          ✏️ │
├─────────────────────────────┤
│ + Create new shortcut       │
└─────────────────────────────┘
```

**Behaviors:**
- Arrow keys navigate (cmdk built-in), typing filters by name
- Enter/click on shortcut → fills input with `instructions`, applies `context`, closes popover
- Click ✏️ → opens `ShortcutDialog` in edit mode
- Click "Create new shortcut" → opens `ShortcutDialog` in create mode (blank)
- Escape → closes popover, refocuses textarea
- Width/styling matches `ContextPopover` (`w-[220px]`, `bg-background/80 backdrop-blur-sm`)

## Shortcut Editor Dialog

Centered Radix Dialog modal. Opens for create, edit, or "save as shortcut" from input box.

### Layout

```
┌──────────────────────────────────────┐
│  Create Shortcut              ✕      │
├──────────────────────────────────────┤
│  Name                                │
│  [______________________________]    │
│                                      │
│  Instructions                        │
│  [______________________________]    │
│  [______________________________]    │
│  [______________________________]    │
│                                      │
│  ▶ Advanced                          │
│                                      │
│          [Cancel]  [Save Shortcut]   │
└──────────────────────────────────────┘
```

### Advanced Section (expanded)

Collapsed by default. "Add filter" and preset picker are independent — user can add filters manually without touching presets.

```
▼ Advanced
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                                  │
│ [+ Add filter]                   │
│   ┌──────────────┐               │
│   │ Countries    │               │
│   │ Platforms    │               │
│   │ Metrics      │               │
│   └──────────────┘               │
│                                  │
│ Countries:  US, UK        [×]   │  ← added by user
│ Metrics:    ROAS, CPA     [×]   │  ← added by user
│                                  │
│  ── or ──                        │
│                                  │
│ Apply preset:                    │
│ [Select a preset...         ▼]  │
│                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

- "Add filter" dropdown lists available categories; already-added ones show as disabled/checked
- Each added category row has a `[×]` to remove it
- Applying a preset auto-adds whichever categories the preset has values for
- Preset picker is purely a convenience to bulk-fill filters

### Edit Mode

When editing an existing shortcut:
- Save button becomes split: "Save current shortcut" / "Save as new shortcut"
- Footer shows Delete and Duplicate actions

## "Save as Shortcut" from Input Box

- New `Bookmark` icon in the input toolbar row (next to existing context icons)
- Only visible when textarea has text (non-empty input)
- Opens `ShortcutDialog` in create mode, pre-filled with:
  - `instructions` = current input text
  - `context` = current context selections (if any)

## Default Shortcuts

Five pre-seeded shortcuts on first load (no context attached):

1. **Performance Analysis** — "Analyze the performance of my campaigns. Break down results by key metrics, identify top and bottom performers, and highlight any significant trends or anomalies. Summarize with actionable takeaways."

2. **Low-Hanging Fruits** — "Identify quick-win optimization opportunities across my campaigns. Look for underperforming ads with high potential, wasted spend, bid inefficiencies, and targeting gaps that could be fixed with minimal effort for maximum impact."

3. **Competitor Benchmark** — "Compare my campaign performance against industry benchmarks and competitive positioning. Highlight where I'm outperforming, where I'm falling behind, and what strategies competitors might be leveraging that I'm not."

4. **Budget Optimizer** — "Evaluate my current budget allocation across campaigns and platforms. Recommend how to redistribute spend to maximize ROI. Identify over-funded underperformers and underfunded high-potential campaigns."

5. **Weekly Digest** — "Generate a concise weekly summary of my advertising performance. Include week-over-week changes, top highlights, areas of concern, and a prioritized list of recommended actions for the coming week."

## CRUD Operations

| Operation | Trigger |
|---|---|
| **Create** | "Create new shortcut" in `/` popover or "Save as shortcut" from input toolbar |
| **Edit** | ✏️ icon in `/` popover → dialog in edit mode |
| **Save current** | Save button in edit mode → updates existing shortcut |
| **Save as new** | Split button option → creates new shortcut from current edits |
| **Duplicate** | Button in edit dialog footer → creates "Copy of ..." |
| **Delete** | Button in edit dialog footer |
| **Rename** | Edit the name field in the dialog |

## New Files

| File | Purpose |
|---|---|
| `src/lib/shortcuts.ts` | `Shortcut` type, default shortcuts data, localStorage load/save helpers |
| `src/hooks/use-shortcuts.ts` | CRUD hook, popover open state management |
| `src/components/thread/shortcut-popover.tsx` | `/`-triggered popover with cmdk search list |
| `src/components/thread/shortcut-dialog.tsx` | Create/edit modal dialog with Advanced section |

## Modified Files

| File | Change |
|---|---|
| `src/components/thread/index.tsx` | Add `/` keydown handler, render `ShortcutPopover`, add save-as-shortcut toolbar icon, wire `useShortcuts` hook |

## Technical Notes

- Follows existing patterns: `useShortcuts` mirrors `useContextPresets`, `ShortcutPopover` mirrors `ContextPopover`
- No backend changes — shortcuts are purely a frontend convenience feature
- Context selections applied from shortcuts use the same `setContextSelections()` from `useContextSelectors`
- Shortcut editor reads presets list via `useContextPresets` for the "Apply preset" dropdown
