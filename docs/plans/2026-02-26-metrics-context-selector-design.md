# Metrics Context Selector

## Goal

Add a "Metrics" context selector alongside existing Countries and Platforms selectors, allowing users to specify which advertising metrics should be included in AI responses.

## Behavior

"Ensure inclusion" — selected metrics are guaranteed to appear in the AI response, but the AI may add others if relevant. This is not a filter/focus mode.

## Metrics (20)

Impressions, Clicks, CTR, CPC, CPM, Spend, Conversions, Conversion Rate, CPA, ROAS, Revenue, Reach, Frequency, Video Views, VTR, Engagement Rate, Bounce Rate, Add to Cart, CPV, ACOS

## Changes

### Frontend

1. `context-selectors.ts` — Add `"metrics"` to `ContextCategory` union, add 20 metrics to `CONTEXT_CATEGORIES`, update `EMPTY_SELECTIONS`
2. `context-popover.tsx` — Add `BarChart3` icon for metrics category
3. `context-badges.tsx` — Green badge color for metrics (`bg-green-100 text-green-800`)
4. `index.tsx` (Thread) — Third `ContextPopover` + `BarChart3` icon button

### Backend

5. `graph.py` — Handle `metrics` key in `_build_context_message` with prompt: "Make sure your response includes these metrics: ..."

### No changes needed

- `use-context-selectors.ts` — generic over `ContextCategory`
- `Stream.tsx` — context is `Record<string, unknown>`
- `human.tsx` / `shared.tsx` — reads from `ContextSelections` type
