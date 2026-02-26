# Metrics Context Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Metrics" context selector (20 digital advertising metrics) alongside existing Countries and Platforms selectors, ensuring selected metrics are included in AI responses.

**Architecture:** Extends the existing context selector pattern — add `"metrics"` to the category union type, define the 20 items, add icon/color mappings, add a third popover+button in the toolbar, and handle the new key in the backend prompt builder.

**Tech Stack:** TypeScript/React (Next.js), Python (LangGraph)

---

### Task 1: Add metrics to context-selectors.ts

**Files:**
- Modify: `agent-chat-ui/src/lib/context-selectors.ts`

**Step 1: Update the ContextCategory union type**

Change line 1 from:
```typescript
export type ContextCategory = "countries" | "platforms";
```
to:
```typescript
export type ContextCategory = "countries" | "platforms" | "metrics";
```

**Step 2: Add metrics category to CONTEXT_CATEGORIES array**

After the platforms entry (line 47), add:
```typescript
  {
    id: "metrics",
    label: "Metrics",
    items: [
      "Impressions",
      "Clicks",
      "CTR (Click-Through Rate)",
      "CPC (Cost Per Click)",
      "CPM (Cost Per Mille)",
      "Spend",
      "Conversions",
      "Conversion Rate",
      "CPA (Cost Per Acquisition)",
      "ROAS (Return on Ad Spend)",
      "Revenue",
      "Reach",
      "Frequency",
      "Video Views",
      "VTR (View-Through Rate)",
      "Engagement Rate",
      "Bounce Rate",
      "Add to Cart",
      "CPV (Cost Per View)",
      "ACOS (Ad Cost of Sales)",
    ],
  },
```

**Step 3: Update EMPTY_SELECTIONS**

Change from:
```typescript
export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
};
```
to:
```typescript
export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
  metrics: [],
};
```

---

### Task 2: Add BarChart3 icon to context-popover.tsx

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-popover.tsx`

**Step 1: Update import**

Change line 17 from:
```typescript
import { Globe, Megaphone, ChevronRight, ChevronLeft } from "lucide-react";
```
to:
```typescript
import { Globe, Megaphone, BarChart3, ChevronRight, ChevronLeft } from "lucide-react";
```

**Step 2: Add icon mapping**

Change lines 24-27 from:
```typescript
const CATEGORY_ICONS: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-4 w-4 text-muted-foreground" />,
  platforms: <Megaphone className="h-4 w-4 text-muted-foreground" />,
};
```
to:
```typescript
const CATEGORY_ICONS: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-4 w-4 text-muted-foreground" />,
  platforms: <Megaphone className="h-4 w-4 text-muted-foreground" />,
  metrics: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
};
```

---

### Task 3: Add green badge color to context-badges.tsx

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-badges.tsx`

**Step 1: Update import**

Change line 4 from:
```typescript
import { X, Globe, Megaphone } from "lucide-react";
```
to:
```typescript
import { X, Globe, Megaphone, BarChart3 } from "lucide-react";
```

**Step 2: Add icon mapping**

Change lines 15-18 from:
```typescript
const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
};
```
to:
```typescript
const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
  metrics: <BarChart3 className="h-3 w-3" />,
};
```

**Step 3: Add green color**

Change lines 20-25 from:
```typescript
const CATEGORY_COLORS: Record<ContextCategory, string> = {
  countries:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  platforms:
    "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};
```
to:
```typescript
const CATEGORY_COLORS: Record<ContextCategory, string> = {
  countries:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  platforms:
    "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  metrics:
    "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};
```

**Step 4: Add "metrics" to the iteration array**

Change line 34 from:
```typescript
  for (const category of ["countries", "platforms"] as ContextCategory[]) {
```
to:
```typescript
  for (const category of ["countries", "platforms", "metrics"] as ContextCategory[]) {
```

---

### Task 4: Add metrics popover + icon button in Thread index.tsx

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

**Step 1: Add BarChart3 to lucide-react import**

Change line 35 from:
```typescript
  Megaphone,
} from "lucide-react";
```
to:
```typescript
  Megaphone,
  BarChart3,
} from "lucide-react";
```

**Step 2: Add metrics ContextPopover after the platforms popover (after line 905)**

Insert after the platforms `</ContextPopover>` closing tag (line 905):
```tsx
                        <ContextPopover
                          open={contextPopoverOpen && triggerSource === "icon" && activeCategory === "metrics"}
                          onOpenChange={(open) => {
                            if (open) openContextPopover("metrics", "icon");
                            else closeContextPopover();
                          }}
                          activeCategory={activeCategory}
                          onCategorySelect={setActiveCategory}
                          selections={contextSelections}
                          onToggleItem={toggleItem}
                          align="start"
                          side="top"
                        >
                          <TooltipIconButton
                            tooltip="Metrics"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8",
                              contextSelections.metrics.length > 0
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </TooltipIconButton>
                        </ContextPopover>
```

---

### Task 5: Update human.tsx to include metrics in replay badges

**Files:**
- Modify: `agent-chat-ui/src/components/thread/messages/human.tsx`

**Step 1: Add "metrics" to the categories array**

Change line 25 from:
```typescript
      (["countries", "platforms"] as ContextCategory[])
```
to:
```typescript
      (["countries", "platforms", "metrics"] as ContextCategory[])
```

**Step 2: Add metrics to hasAnything check**

Change lines 33-36 from:
```typescript
  const hasAnything =
    selections.countries.length > 0 ||
    selections.platforms.length > 0 ||
    quoteCount > 0;
```
to:
```typescript
  const hasAnything =
    selections.countries.length > 0 ||
    selections.platforms.length > 0 ||
    selections.metrics.length > 0 ||
    quoteCount > 0;
```

---

### Task 6: Handle metrics in backend graph.py

**Files:**
- Modify: `odin/graph.py`

**Step 1: Add metrics handling in _build_context_message**

After line 22 (`parts.append(f"Platforms: {', '.join(context['platforms'])}")`), add:
```python
    if context.get("metrics"):
        parts.append(
            "Metrics: Make sure your response includes these metrics: "
            + ", ".join(context["metrics"])
        )
```

---

### Task 7: Rebuild and verify

**Step 1: Rebuild Docker containers**

Run: `cd /Users/jed/Downloads/odin-dev && docker compose up --build -d`

**Step 2: Verify UI loads**

Open http://localhost:3000 and confirm:
- BarChart3 icon appears in the toolbar next to Globe and Megaphone
- Clicking it opens a popover with 20 metrics
- Selecting metrics shows green badges above the textarea
- The `@` keyboard trigger shows Metrics as a third category

**Step 3: Verify backend receives metrics**

Send a message with metrics selected, check docker logs for the backend to confirm the context system message includes the metrics instruction.

Run: `docker compose logs backend --tail 50`
