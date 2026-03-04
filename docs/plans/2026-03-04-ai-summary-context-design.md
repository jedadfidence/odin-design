# AI Summary & Page Context Integration — Design

**Date:** 2026-03-04
**Branch:** feature/ai-summary-context

## Problem

The demo dashboard displays data but provides no AI-powered insights. Users must manually interpret KPIs, charts, and tables. There's no way to attach dashboard visuals as context when chatting with the AI, limiting the AI's ability to reference specific on-screen data.

## Solution

Three interconnected features:

1. **AI Executive Summary** — auto-generated narrative at the top of the dashboard
2. **Per-widget/section AI actions** — three-dot menu on each visual with Explain/Summarize/Analyze
3. **"On Current Page" context category** — attach dashboard visuals as context in the chat

All use mock data for now. The focus is on the UI, animation, and context integration.

---

## 1. Data Model — Widget Registry

```ts
// src/lib/dashboard-widgets.ts

interface DashboardWidget {
  id: string;                     // e.g. "revenue-chart", "kpi-revenue"
  title: string;                  // e.g. "Revenue Over Time"
  type: "kpi" | "chart" | "table";
  section: string;                // e.g. "KPIs", "Analytics", "Transactions"
  data: Record<string, unknown>;  // raw data for context attachment
}
```

Hardcoded `DEMO_WIDGETS` array with all 6 dashboard widgets (3 KPIs, 2 charts, 1 table).

The existing `ContextCategory` type is extended:
```ts
type ContextCategory = "countries" | "platforms" | "metrics" | "page";
```

A React context (`PageWidgetsContext`) allows the demo page to provide available widgets to the context popover. When no widgets are provided (non-dashboard pages), the "On Current Page" category is hidden.

---

## 2. AI Summary Component

### `<AISummary>` — Shared component with two variants

**Full variant** (executive summary at top of dashboard):
- Full-width card below the navbar, subtle border
- Sparkles icon + "AI Summary" label top-left, dismiss X top-right
- Auto-triggers on page load after ~500ms delay

**Compact variant** (per-widget inline summary):
- Renders above the widget heading, slides in with height animation
- Smaller text, dismiss button
- Only one visible at a time (opening another closes the previous)
- Triggered by three-dot menu actions (Explain/Summarize/Analyze)

### Shimmer → Word Cascade Animation

**Phase 1 — Shimmer (1.5s):**
3-4 skeleton lines with a sweeping left-to-right gradient shimmer animation. Simulates "processing."

**Phase 2 — Word cascade (~1s):**
Skeleton fades out. Text words appear in groups of 2-3 with staggered `opacity: 0→1` + `translateY: 4px→0` transitions, each group delayed ~30-50ms. Creates a flowing waterfall effect.

**Phase 3 — Settled:**
All text visible, animation complete. Card remains with full content.

### Mock Content

Executive summary: A paragraph synthesizing all KPIs, charts, and trends on the page.

Per-widget summaries: Different mock text depending on action type:
- **Explain:** What the visual shows and how to read it
- **Summarize:** Key takeaways in 1-2 sentences
- **Analyze:** Patterns, anomalies, and recommendations

---

## 3. Three-Dot Widget Menu

### `<WidgetMenu>` Component

Uses Radix `DropdownMenu` (shadcn). Placed at top-right of each widget card and next to each section heading.

**Menu items:**
| Icon | Label | Action |
|------|-------|--------|
| Sparkles | Explain | Show inline AISummary (explain variant) |
| FileText | Summarize | Show inline AISummary (summarize variant) |
| Search | Analyze | Show inline AISummary (analyze variant) |
| — | — | Separator |
| Plus | Add to context | Add widget to `selections.page` |

### Placement

- **Per-widget:** Three dots in top-right of each widget card. Visible on hover (or always visible for demo).
- **Per-section:** Three dots next to section headings ("KPIs", "Analytics", "Transactions").

### Section-Level Behavior

- AI actions generate a combined summary covering all widgets in the section
- "Add to context" adds all section widgets to context at once

---

## 4. Context Integration — "On Current Page"

### Context Popover Extension

New category in the context popover:
- **On Current Page** — amber/orange color, Monitor icon
- Listed alongside Countries, Platforms, Metrics in the root menu
- Only visible when `PageWidgetsContext` provides widgets

Items page shows all dashboard widgets with checkboxes:
```
← On Current Page
────────────────────
☐ Total Revenue (KPI)
☐ Active Users (KPI)
☐ Conversion Rate (KPI)
☐ Revenue Over Time
☐ User Activity
☐ Recent Transactions
```

### Context Badges

Selected page widgets appear as amber badges above the chat input:
```
[📊 Revenue Over Time ×] [📊 User Activity ×]
```

### Data Sent to Chat

```ts
{
  countries: [...],
  platforms: [...],
  metrics: [...],
  page: [
    { id: "revenue-chart", title: "Revenue Over Time", type: "chart", data: { values: [...] } }
  ]
}
```

The `page` items include full widget data (title, type, raw data) so the AI has numbers to work with.

### "Add to Context" from Menu

1. Widget ID added to `selections.page`
2. Toast: "Added [Widget Name] to context"
3. Amber context badge appears above chat input
4. If chat is collapsed (FAB), FAB gets a subtle pulse indicator

---

## Files Changed

### New Files
- `src/lib/dashboard-widgets.ts` — Widget registry, types, `PageWidgetsContext`, `DEMO_WIDGETS`
- `src/components/demo/ai-summary.tsx` — `<AISummary>` with shimmer → word cascade animation
- `src/components/demo/widget-menu.tsx` — `<WidgetMenu>` three-dot dropdown

### Modified Files
- `src/app/demo/page.tsx` — Wrap in `PageWidgetsContext.Provider`, add `<AISummary>` at top, add `<WidgetMenu>` to widgets/sections
- `src/lib/context-selectors.ts` — Add `"page"` to `ContextCategory`, update `EMPTY_SELECTIONS`, add page items logic
- `src/hooks/use-context-selectors.ts` — Handle `"page"` category, consume `PageWidgetsContext` for available items
- `src/components/thread/context-popover.tsx` — Add "On Current Page" category (amber), items page for widgets
- `src/components/thread/context-badges.tsx` — Render amber badges for page selections
- `src/components/mini-thread/mini-input.tsx` — Include page context in `contextToMetadata()`

---

## User Flows

### Flow 1: Executive Summary
1. User navigates to demo dashboard
2. After 500ms, the AI Summary card appears at top with shimmer animation
3. After 1.5s, shimmer fades and text cascades in word-by-word
4. User reads the summary or dismisses it with X

### Flow 2: Widget AI Action
1. User hovers over "Revenue Over Time" chart → three-dot menu visible
2. User clicks menu → sees Explain, Summarize, Analyze, Add to context
3. User clicks "Analyze"
4. A compact AISummary slides in above the widget heading
5. Shimmer → word cascade plays with analysis text
6. User reads or dismisses; opening another widget's analysis auto-closes this one

### Flow 3: Add to Context via Menu
1. User clicks three-dot menu on "User Activity" chart
2. Clicks "Add to context"
3. Toast: "Added User Activity to context"
4. Amber badge appears above chat input in mini-thread
5. User types a question → AI receives the chart's raw data as context

### Flow 4: Add to Context via Popover
1. User types `@` in chat input → context popover opens
2. Sees categories: Countries, Platforms, Metrics, On Current Page
3. Clicks "On Current Page" → sees all 6 dashboard widgets
4. Checks "Revenue Over Time" and "User Activity"
5. Amber badges appear above input
6. User asks "Compare these two charts" → AI has both datasets
