# Context Presets Design

## Goal

Allow users to save combinations of context selections (countries, platforms, metrics) as named presets and apply them in one click.

## Storage

localStorage under key `odin-context-presets`. Array of objects:
```ts
{ id: string, name: string, selections: { countries: string[], platforms: string[], metrics: string[] } }
```

## UX

### Presets in the `@` popover (root level, no search)

- "Presets" section appears above the category list (Countries, Platforms, Metrics)
- Each saved preset shows as a row with name and summary (e.g., "3 countries, 2 metrics")
- Clicking a preset **replaces** current selections with the preset's
- Each preset has a `...` menu with: **Edit**, **Duplicate**, **Delete**
- Presets appear in search results when the name matches

### Badges bar (above textarea)

- When selections are active: existing X (clear all) button stays, plus a new **Save** button (Bookmark icon) appears
- Clicking Save prompts for a name, saves current selections as new preset

### Edit flow

1. User clicks "Edit" on a preset → selections applied into badges bar
2. An **"Editing: [preset name]"** tag appears in the badges bar (distinct outline styling)
3. User adds/removes items using normal popover and badge X buttons
4. Save button in badges bar updates the existing preset
5. X (clear all) cancels the edit

### Duplicate flow

- Click "Duplicate" → creates "Copy of [name]", immediately enters edit mode for it

## Files

1. New: `lib/context-presets.ts` — types, localStorage read/write helpers
2. New: `hooks/use-context-presets.ts` — React hook wrapping storage with state, edit mode tracking
3. Modify: `context-popover.tsx` — add Presets section to root category view, preset rows with menu
4. Modify: `context-badges.tsx` — add Save button, editing tag
5. Modify: `index.tsx` (Thread) — wire up presets hook, pass to popover and badges

## No backend changes
