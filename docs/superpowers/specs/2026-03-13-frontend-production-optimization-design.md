# Frontend Production Optimization — Design Spec

**Date:** 2026-03-13
**Scope:** Chat section (`thread/`, `mini-thread/`) and demo section (`demo/`, `app/demo/`)
**Goal:** Optimize for production readiness — code splitting, consistent styling, lazy loading, memoization — without changing look, feel, or functionality.

---

## 1. Split `thread/index.tsx` (1,371 lines → ~6 focused files)

The Thread component currently holds scroll helpers, header, sidebar, input form, toolbar, all handler callbacks, and the full render tree.

| New file | What moves there | ~Lines |
|----------|-----------------|--------|
| `thread/scroll-helpers.tsx` | `ScrollToBottomBridge`, `StickyToBottomContent`, `ScrollToBottom` | ~75 |
| `thread/chat-header.tsx` | Header bar (report btn, new thread, tool toggle, minimize, theme) | ~60 |
| `thread/chat-sidebar.tsx` | Collapsible history sidebar (desktop) | ~40 |
| `thread/chat-input.tsx` | Form, textarea, toolbar, context/shortcut popovers, quote/badge sections | ~300 |
| `thread/use-chat-handlers.ts` | All `useCallback` handlers (preset, shortcut, filter sync, submit, reuse, suggestion select) | ~350 |
| `thread/index.tsx` (remains) | Orchestrator: hooks setup, state, composes the above | ~350 |

Principle: `index.tsx` stays as the wiring file. It calls hooks, passes props down. Each extracted component is self-contained with typed props.

## 2. Split `mini-thread/mini-input.tsx` (792 lines → ~3 files)

| New file | What moves there | ~Lines |
|----------|-----------------|--------|
| `mini-thread/mini-input-toolbar.tsx` | Bottom toolbar (suggestion toggle, shortcut popover, context popover, send button) | ~150 |
| `mini-thread/use-mini-handlers.ts` | All callbacks (preset, shortcut, filter sync, submit) | ~300 |
| `mini-thread/mini-input.tsx` (remains) | Form shell, textarea, composes toolbar | ~250 |

### Shared logic extraction

Both `use-chat-handlers.ts` and `use-mini-handlers.ts` contain near-identical two-way filter sync callbacks (`CONTEXT_TO_FILTER_MAP`, `handleToggleFilterItemSynced`, `handleResetAllFiltersSynced`, etc.). Extract into:

| New file | Purpose |
|----------|---------|
| `hooks/use-filter-sync.ts` | Shared two-way sync logic between context selectors and filter panel |

## 3. Lazy Loading with `next/dynamic`

Heavy modal/overlay components that don't need to be in the initial bundle:

| Component | Size | Trigger | Strategy |
|-----------|------|---------|----------|
| `ShortcutDialog` | 15KB | User opens dialog | `dynamic(() => import('./shortcut-dialog'), { ssr: false })` |
| `ReportSheet` | 9KB | User clicks report btn | `dynamic(() => import('./report-sheet'), { ssr: false })` |
| `ChartRenderer` | 13KB | AI returns chart data | `dynamic(() => import('./chart-renderer'), { ssr: false })` |
| `AISummary` (demo) | 22KB | Demo page only | `dynamic(() => import('./ai-summary'), { ssr: false })` |

All four are already conditionally rendered (behind `open` state or data checks), so wrapping them in `dynamic` is zero-risk.

**Not lazy loading:** Message components (`ai.tsx`, `human.tsx`, `tool-calls.tsx`) — core to chat, must render immediately.

## 4. Styling Consistency Fixes

Replace hardcoded hex values with CSS variable-based Tailwind classes:

| Current | Replace with | Files affected |
|---------|-------------|----------------|
| `bg-[#4586F7]` | `bg-primary` | `thread/index.tsx` (send button) |
| `hover:bg-[#3a75e0]` | `hover:bg-primary-hover` | `thread/index.tsx` |
| `text-[#4586F7]` | `text-primary` | `thread/index.tsx` (AI heading) |
| `!bg-[#F0F4FF]` / `!bg-[#0D0D14]` | `!bg-background` | `filter-sidebar.tsx` |
| `style={{ backgroundColor: "#DBEAFE" }}` | `bg-primary-light` | `filter-category.tsx` |
| `style={{ width: "100%", height: "100%" }}` | `className="w-full h-full"` | `scroll-helpers.tsx` |
| `bg-blue-100 text-blue-800 dark:bg-blue-900/30` | `bg-primary-light text-primary dark:bg-primary-light` | `context-popover.tsx` |

Glass panel `border-radius: 24px` stays — intentional design token separate from component `--radius`.

## 5. Memoization & Performance

| Optimization | Where | Why |
|-------------|-------|-----|
| `React.memo` on `HumanMessage`, `AssistantMessage` | `messages/ai.tsx`, `messages/human.tsx` | Prevent re-render of all messages when input state changes |
| `useMemo` for filtered message list | `thread/index.tsx` | `.filter().map()` on every render |
| `useMemo` for `visibleSuggestions` computation | `thread/index.tsx` | Derived state recomputed on every keystroke |
| `useCallback` audit | All handler files | Verify deps are correct after extraction |

**Not adding:** `React.memo` to small leaf components — comparison overhead outweighs re-render cost.

## Constraints

- Zero visual or behavioral changes
- All existing functionality preserved
- No new dependencies
- No directory restructuring — new files go alongside existing ones
- Relative imports within `thread/` and `mini-thread/`; absolute `@/` imports for cross-directory

## Summary

- ~10 new files (component splits + shared hook)
- ~5 files with lazy loading wrappers
- ~6 files with hardcoded color fixes
- ~3 files with memoization additions
