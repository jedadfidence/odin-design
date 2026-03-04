# AI Summary & Page Context Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI executive summary with shimmer→word cascade animation to the demo dashboard, per-widget/section AI action menus (Explain/Summarize/Analyze/Add to context), and an "On Current Page" context category for attaching dashboard visuals to chat.

**Architecture:** Dashboard-specific components (`AISummary`, `WidgetMenu`) built alongside the demo page. A widget registry (`DashboardWidget[]`) describes all visuals. The existing context system is extended with a `"page"` category powered by a React context provider (`PageWidgetsContext`). All AI text is mock data with simulated delays.

**Tech Stack:** React, Framer Motion (animations), Radix DropdownMenu (widget menu), cmdk Command (context popover), Tailwind CSS, shadcn/ui components, sonner (toasts)

---

### Task 1: Widget Registry & Page Context Provider

**Files:**
- Create: `agent-chat-ui/src/lib/dashboard-widgets.ts`

**Step 1: Create the widget registry and provider**

```ts
import React, { createContext, useContext } from "react";

export interface DashboardWidget {
  id: string;
  title: string;
  type: "kpi" | "chart" | "table";
  section: string;
  data: Record<string, unknown>;
}

export const DEMO_WIDGETS: DashboardWidget[] = [
  {
    id: "kpi-revenue",
    title: "Total Revenue",
    type: "kpi",
    section: "KPIs",
    data: { value: 124500, change: 12.5, formatted: "$124,500" },
  },
  {
    id: "kpi-users",
    title: "Active Users",
    type: "kpi",
    section: "KPIs",
    data: { value: 8420, change: 3.2, formatted: "8,420" },
  },
  {
    id: "kpi-conversion",
    title: "Conversion Rate",
    type: "kpi",
    section: "KPIs",
    data: { value: 4.8, change: -0.3, formatted: "4.8%" },
  },
  {
    id: "revenue-chart",
    title: "Revenue Over Time",
    type: "chart",
    section: "Analytics",
    data: {
      months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      values: [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100],
    },
  },
  {
    id: "user-activity",
    title: "User Activity",
    type: "chart",
    section: "Analytics",
    data: {
      regions: [
        { name: "North America", pct: 72 },
        { name: "Europe", pct: 55 },
        { name: "Asia Pacific", pct: 88 },
        { name: "Latin America", pct: 41 },
      ],
    },
  },
  {
    id: "transactions",
    title: "Recent Transactions",
    type: "table",
    section: "Transactions",
    data: {
      rows: [
        { name: "Subscription Renewal", amount: "$299", date: "Today" },
        { name: "New Enterprise Plan", amount: "$1,200", date: "Yesterday" },
        { name: "Add-on Purchase", amount: "$49", date: "2 days ago" },
        { name: "Annual License", amount: "$3,600", date: "3 days ago" },
      ],
    },
  },
];

export const DEMO_SECTIONS = ["KPIs", "Analytics", "Transactions"] as const;

export const PageWidgetsContext = createContext<DashboardWidget[]>([]);

export function usePageWidgets(): DashboardWidget[] {
  return useContext(PageWidgetsContext);
}
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/lib/dashboard-widgets.ts
git commit -m "feat: add dashboard widget registry and page context provider"
```

---

### Task 2: Extend Context System with "page" Category

**Files:**
- Modify: `agent-chat-ui/src/lib/context-selectors.ts` (all lines)
- Modify: `agent-chat-ui/src/hooks/use-context-selectors.ts:1-88`

**Step 1: Add "page" to ContextCategory type and EMPTY_SELECTIONS**

In `context-selectors.ts`:

Change line 1:
```ts
export type ContextCategory = "countries" | "platforms" | "metrics" | "page";
```

Change `EMPTY_SELECTIONS` (line 78-82):
```ts
export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
  metrics: [],
  page: [],
};
```

Note: Do NOT add "page" to `CONTEXT_CATEGORIES` array — the page category is dynamic (provided by `PageWidgetsContext`), not static. It will be handled separately in the popover.

**Step 2: Update hasSelections and toMetadata in use-context-selectors.ts**

In `use-context-selectors.ts`:

Update `hasSelections` (line 46-47):
```ts
const hasSelections =
  selections.countries.length > 0 ||
  selections.platforms.length > 0 ||
  selections.metrics.length > 0 ||
  selections.page.length > 0;
```

Update `toMetadata` (line 49-56) to include page data:
```ts
const toMetadata = useCallback((): Record<string, unknown> | undefined => {
  if (!hasSelections) return undefined;
  const meta: Record<string, unknown> = {};
  if (selections.countries.length > 0) meta.countries = selections.countries;
  if (selections.platforms.length > 0) meta.platforms = selections.platforms;
  if (selections.metrics.length > 0) meta.metrics = selections.metrics;
  if (selections.page.length > 0) meta.page = selections.page;
  return meta;
}, [selections, hasSelections]);
```

**Step 3: Commit**

```bash
git add agent-chat-ui/src/lib/context-selectors.ts agent-chat-ui/src/hooks/use-context-selectors.ts
git commit -m "feat: extend context system with page category"
```

---

### Task 3: Add "On Current Page" to Context Popover

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-popover.tsx`

**Step 1: Add page category icon, color, and import**

Add to imports (line 17):
```ts
import { Globe, Megaphone, BarChart3, ChevronRight, ChevronLeft, Monitor } from "lucide-react";
```

Add import for page widgets:
```ts
import { usePageWidgets } from "@/lib/dashboard-widgets";
```

Inside the component (after line 92), add:
```ts
const pageWidgets = usePageWidgets();
```

**Step 2: Add "On Current Page" to the category list**

In `renderCategoryList` (after the CONTEXT_CATEGORIES map, around line 213, before the closing `</CommandGroup>`), add a conditional "On Current Page" row:

```tsx
{pageWidgets.length > 0 && (
  <CommandItem
    key="page"
    value="page"
    onSelect={() => onCategorySelect("page" as ContextCategory)}
    className="flex items-center justify-between"
  >
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 text-muted-foreground" />
      <span>On Current Page</span>
      {selections.page?.length > 0 && (
        <span className="text-xs text-muted-foreground">
          ({selections.page.length})
        </span>
      )}
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </CommandItem>
)}
```

**Step 3: Handle page category in items list**

Modify the items list rendering. When `activeCategory === "page"`, render the page widgets instead of `activeCategoryConfig?.items`. Add a new render function:

```tsx
const renderPageItemsList = () => (
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
      <span className="text-sm font-medium">On Current Page</span>
    </div>
    <CommandInput
      placeholder="Search visuals..."
      value={search}
      onValueChange={setSearch}
    />
    <CommandList>
      <CommandEmpty>No visuals found.</CommandEmpty>
      <CommandGroup>
        {pageWidgets.map((widget) => {
          const checked = selections.page?.includes(widget.id) ?? false;
          return (
            <CommandItem
              key={widget.id}
              value={`${widget.title} ${widget.type}`}
              onSelect={() => { onToggleItem("page" as ContextCategory, widget.id); setSearch(""); }}
              className="flex items-center gap-2"
            >
              <Checkbox checked={checked} className="pointer-events-none" />
              <span>{widget.title}</span>
              <span className="ml-auto text-[10px] text-muted-foreground uppercase">{widget.type}</span>
            </CommandItem>
          );
        })}
      </CommandGroup>
    </CommandList>
  </>
);
```

**Step 4: Update the main render logic to use renderPageItemsList**

Change the ternary at the bottom (around lines 445-466):

```tsx
{showPresets ? (
  renderPresetsPage()
) : activeCategory === "page" ? (
  renderPageItemsList()
) : !activeCategory ? (
  <>
    <CommandInput ... />
    <CommandList>
      ...
    </CommandList>
  </>
) : (
  renderItemsList()
)}
```

**Step 5: Update keyboard ArrowRight handler to support "page" value**

In `handleKeyDown` (line 127-130), the existing code handles categories from `CONTEXT_CATEGORIES`. Add a check for the "page" value:

```ts
if (value === "page" && pageWidgets.length > 0) {
  e.preventDefault();
  onCategorySelect("page" as ContextCategory);
} else {
  const cat = CONTEXT_CATEGORIES.find((c) => c.id === value);
  ...
}
```

**Step 6: Update cross-category search to include page widgets**

In `renderCrossCategorySearch`, after the CONTEXT_CATEGORIES map, add:
```tsx
{pageWidgets.length > 0 && (
  <CommandGroup heading="On Current Page">
    {pageWidgets.map((widget) => {
      const checked = selections.page?.includes(widget.id) ?? false;
      return (
        <CommandItem
          key={`page-${widget.id}`}
          value={`page-${widget.id}-${widget.title}`}
          onSelect={() => { onToggleItem("page" as ContextCategory, widget.id); setSearch(""); }}
          className="flex items-center gap-2"
        >
          <Checkbox checked={checked} className="pointer-events-none" />
          <span>{widget.title}</span>
        </CommandItem>
      );
    })}
  </CommandGroup>
)}
```

**Step 7: Commit**

```bash
git add agent-chat-ui/src/components/thread/context-popover.tsx
git commit -m "feat: add On Current Page category to context popover"
```

---

### Task 4: Add Page Context Badges

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-badges.tsx`

**Step 1: Add page badge support**

Import `Monitor` icon and `usePageWidgets`:
```ts
import { X, Globe, Megaphone, BarChart3, Save, Bookmark, Pencil, Monitor } from "lucide-react";
import { usePageWidgets } from "@/lib/dashboard-widgets";
```

Add to `CATEGORY_ICON` (line 26-30):
```ts
page: <Monitor className="h-3 w-3" />,
```

Add to `CATEGORY_COLORS` (line 32-39):
```ts
page: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
```

**Step 2: Update allBadges to include page items**

Inside the component, add `const pageWidgets = usePageWidgets();`

Update the `allBadges` loop (line 52-57) to include "page":
```ts
for (const category of ["countries", "platforms", "metrics", "page"] as ContextCategory[]) {
```

For page badges, the badge text should show the widget title instead of the raw ID. Modify the badge rendering (around line 176) to resolve page widget IDs to titles:

```tsx
{CATEGORY_ICON[category]}
{category === "page"
  ? (pageWidgets.find((w) => w.id === item)?.title ?? item)
  : item}
```

**Step 3: Update the visibility check in mini-input.tsx**

In `mini-input.tsx`, the `AnimatePresence` condition for context badges (line 380-382) needs to include `page`:
```ts
{(contextSelections.countries.length > 0 ||
  contextSelections.platforms.length > 0 ||
  contextSelections.metrics.length > 0 ||
  contextSelections.page.length > 0) && (
```

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/context-badges.tsx agent-chat-ui/src/components/mini-thread/mini-input.tsx
git commit -m "feat: add amber context badges for page widget selections"
```

---

### Task 5: AI Summary Component with Shimmer → Word Cascade Animation

**Files:**
- Create: `agent-chat-ui/src/components/demo/ai-summary.tsx`

**Step 1: Create the AISummary component**

This is the core animated component. Two variants: `"full"` (executive summary) and `"compact"` (per-widget inline).

```tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock AI text for different contexts ---
const EXECUTIVE_SUMMARY =
  "Revenue has grown 12.5% to $124,500 this month, driven primarily by enterprise subscription renewals. Active users are up 3.2% to 8,420, with Asia Pacific showing the strongest engagement at 88%. Conversion rate has dipped slightly by 0.3 percentage points to 4.8%, suggesting potential optimization opportunities in the checkout flow.";

const MOCK_RESPONSES: Record<string, Record<string, string>> = {
  "kpi-revenue": {
    explain: "This KPI shows your total revenue for the current period. The $124,500 figure represents all income sources combined, while the +12.5% indicates month-over-month growth.",
    summarize: "Revenue is strong at $124,500 with healthy 12.5% growth driven by enterprise plan upgrades.",
    analyze: "The 12.5% growth rate exceeds the industry average of 8%. The trend suggests enterprise plans are becoming the primary growth driver. Consider increasing enterprise-focused marketing spend.",
  },
  "kpi-users": {
    explain: "Active Users tracks unique users who performed at least one action in the current period. The 8,420 figure counts distinct users, with +3.2% showing steady growth.",
    summarize: "User base growing steadily at 8,420 active users, up 3.2% month-over-month.",
    analyze: "User growth at 3.2% is moderate but consistent. The gap between user growth (3.2%) and revenue growth (12.5%) indicates higher average revenue per user — likely from enterprise upgrades.",
  },
  "kpi-conversion": {
    explain: "Conversion Rate measures the percentage of visitors who complete a desired action. At 4.8%, roughly 1 in 21 visitors converts, with a slight decline of 0.3 points.",
    summarize: "Conversion rate at 4.8% with a minor 0.3% dip — within normal variance but worth monitoring.",
    analyze: "The 0.3% decline in conversion rate, combined with higher revenue, suggests a shift toward higher-value but longer sales cycles. A/B testing the checkout flow could recover the lost conversions.",
  },
  "revenue-chart": {
    explain: "This bar chart displays monthly revenue trends over 12 months. Bar heights represent relative revenue, with the tallest bar (December) being the peak month.",
    summarize: "Revenue shows an upward trend with Q4 being the strongest quarter. October peaked at the highest relative value.",
    analyze: "Revenue follows a seasonal pattern with dips in Q1 and Q3 and peaks in Q2 and Q4. The overall trendline is positive. The April and June spikes suggest successful campaign periods.",
  },
  "user-activity": {
    explain: "This horizontal chart compares user engagement across four geographic regions. The percentage represents the proportion of registered users who were active in the period.",
    summarize: "Asia Pacific leads engagement at 88%, followed by North America at 72%. Latin America lags at 41%.",
    analyze: "Asia Pacific's 88% engagement rate is exceptional and 16 points above North America. Latin America at 41% represents the biggest growth opportunity — targeted localization could significantly improve engagement.",
  },
  "transactions": {
    explain: "This table shows the four most recent transactions with their names, amounts, and dates. It provides a quick view of recent financial activity.",
    summarize: "Recent activity includes an enterprise plan sale ($1,200) and an annual license ($3,600) — high-value transactions dominating.",
    analyze: "Two of four recent transactions are high-value ($1,200 and $3,600), confirming the enterprise revenue trend. The $49 add-on suggests good upsell adoption. Transaction frequency appears healthy.",
  },
};

// Generate section-level mock text
const SECTION_RESPONSES: Record<string, Record<string, string>> = {
  KPIs: {
    explain: "These three KPIs provide a high-level health check: revenue tracks income, active users measures engagement breadth, and conversion rate indicates funnel efficiency.",
    summarize: "Revenue up 12.5%, users growing at 3.2%, conversion slightly down 0.3%. Overall strong performance with minor conversion concern.",
    analyze: "Revenue growth significantly outpacing user growth suggests increasing ARPU. The slight conversion dip warrants investigation but may reflect a natural shift toward higher-value, longer-cycle enterprise deals.",
  },
  Analytics: {
    explain: "The analytics section combines a temporal revenue view (bar chart showing monthly trends) with a geographic engagement breakdown (horizontal bars by region).",
    summarize: "Revenue trending upward with Q4 strength. Asia Pacific dominates engagement at 88%, Latin America is the weakest at 41%.",
    analyze: "Revenue seasonality aligns with enterprise budget cycles (Q4 peaks). Geographic data suggests APAC should be prioritized for expansion, while LATAM needs a localization strategy to close the 47-point gap with APAC.",
  },
  Transactions: {
    explain: "The transactions table lists recent financial events with amounts and dates, providing visibility into the latest customer activity.",
    summarize: "Recent transactions are dominated by high-value enterprise deals ($1,200 and $3,600), with healthy add-on activity.",
    analyze: "High-value transactions ($1,200, $3,600) represent 93% of recent transaction value. The $49 add-on purchase suggests good cross-sell penetration. Transaction recency is strong with activity every day.",
  },
};

export function getMockResponse(
  widgetId: string,
  action: "explain" | "summarize" | "analyze",
): string {
  return MOCK_RESPONSES[widgetId]?.[action] ?? "No data available for this visual.";
}

export function getSectionMockResponse(
  section: string,
  action: "explain" | "summarize" | "analyze",
): string {
  return SECTION_RESPONSES[section]?.[action] ?? "No data available for this section.";
}

// --- Shimmer skeleton ---
function ShimmerSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 rounded-md bg-muted/60 shimmer-line"
          style={{
            width: i === lines - 1 ? "60%" : "100%",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style jsx>{`
        .shimmer-line {
          background: linear-gradient(
            90deg,
            hsl(var(--muted) / 0.4) 25%,
            hsl(var(--muted) / 0.7) 50%,
            hsl(var(--muted) / 0.4) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// --- Word cascade ---
function WordCascade({ text }: { text: string }) {
  const words = useMemo(() => text.split(" "), [text]);
  return (
    <span>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: i * 0.035,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// --- Main component ---
interface AISummaryProps {
  variant?: "full" | "compact";
  text?: string;
  shimmerDuration?: number; // ms, default 1500
  initialDelay?: number;    // ms, default 0
  onDismiss?: () => void;
  className?: string;
}

type Phase = "idle" | "shimmer" | "cascade" | "done";

export function AISummary({
  variant = "full",
  text = EXECUTIVE_SUMMARY,
  shimmerDuration = 1500,
  initialDelay = 0,
  onDismiss,
  className,
}: AISummaryProps) {
  const [phase, setPhase] = useState<Phase>(initialDelay > 0 ? "idle" : "shimmer");

  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("shimmer"), initialDelay);
      return () => clearTimeout(t);
    }
    if (phase === "shimmer") {
      const t = setTimeout(() => setPhase("cascade"), shimmerDuration);
      return () => clearTimeout(t);
    }
    if (phase === "cascade") {
      // Words cascade takes ~35ms * wordCount; transition to done after
      const wordCount = text.split(" ").length;
      const cascadeDuration = wordCount * 35 + 300;
      const t = setTimeout(() => setPhase("done"), cascadeDuration);
      return () => clearTimeout(t);
    }
  }, [phase, shimmerDuration, initialDelay, text]);

  if (phase === "idle") return null;

  const isFull = variant === "full";

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn("overflow-hidden", className)}
    >
      <div
        className={cn(
          "rounded-xl border border-border bg-background shadow-sm",
          isFull ? "p-5" : "p-3",
        )}
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className={cn("text-primary", isFull ? "h-4 w-4" : "h-3.5 w-3.5")} />
            <span>AI Summary</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={cn("text-foreground leading-relaxed", isFull ? "text-sm" : "text-xs")}>
          <AnimatePresence mode="wait">
            {phase === "shimmer" && (
              <motion.div
                key="shimmer"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ShimmerSkeleton lines={isFull ? 4 : 2} />
              </motion.div>
            )}
            {(phase === "cascade" || phase === "done") && (
              <motion.div
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {phase === "cascade" ? <WordCascade text={text} /> : <span>{text}</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/components/demo/ai-summary.tsx
git commit -m "feat: add AISummary component with shimmer and word cascade animation"
```

---

### Task 6: Widget Menu Component

**Files:**
- Create: `agent-chat-ui/src/components/demo/widget-menu.tsx`

**Step 1: Create the WidgetMenu dropdown**

```tsx
"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Sparkles, FileText, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AIAction = "explain" | "summarize" | "analyze";

interface WidgetMenuProps {
  onAIAction: (action: AIAction) => void;
  onAddToContext: () => void;
  className?: string;
}

export function WidgetMenu({ onAIAction, onAddToContext, className }: WidgetMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            className,
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onAIAction("explain")}>
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Explain
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAIAction("summarize")}>
          <FileText className="mr-2 h-3.5 w-3.5" />
          Summarize
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAIAction("analyze")}>
          <Search className="mr-2 h-3.5 w-3.5" />
          Analyze
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddToContext}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add to context
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/components/demo/widget-menu.tsx
git commit -m "feat: add WidgetMenu dropdown component"
```

---

### Task 7: Integrate Everything into Demo Page

**Files:**
- Modify: `agent-chat-ui/src/app/demo/page.tsx` (complete rewrite of MockDashboard)

This is the largest task. The demo page needs to:
1. Wrap content in `PageWidgetsContext.Provider`
2. Add `<AISummary variant="full">` after the h1
3. Add `<WidgetMenu>` to each widget card and each section heading
4. Track which widget has an active inline summary
5. Wire "Add to context" to the context selector state

**Step 1: Rewrite the demo page**

Key structural changes:
- Import `PageWidgetsContext`, `DEMO_WIDGETS`, `DEMO_SECTIONS` from dashboard-widgets
- Import `AISummary`, `getMockResponse`, `getSectionMockResponse` from demo/ai-summary
- Import `WidgetMenu`, `AIAction` from demo/widget-menu
- Add state: `activeInlineSummary: { id: string; action: AIAction; text: string } | null`
- Add a custom event system or callback to communicate "add to context" from the dashboard to the MiniThread's context selectors

For "Add to context" from the dashboard to the chat: use a custom DOM event `"odin:add-page-context"` with widget ID as detail. The MiniInput listens for this event and calls `toggleItem("page", widgetId)`. This avoids prop drilling through unrelated component trees.

The page structure becomes:

```tsx
<PageWidgetsContext.Provider value={DEMO_WIDGETS}>
  <MockDashboard />
  <MiniThread />
</PageWidgetsContext.Provider>
```

Inside MockDashboard:
- After `<h1>Dashboard Overview</h1>`, add:
  ```tsx
  <AISummary variant="full" initialDelay={500} onDismiss={() => setShowExecSummary(false)} />
  ```
- Each widget card gets a `<WidgetMenu>` in its header area
- Each section heading gets a `<WidgetMenu>` next to it
- When an AI action is triggered, set `activeInlineSummary` state
- An `<AnimatePresence>` wrapping `<AISummary variant="compact">` appears above the targeted widget

**Step 2: Add custom event listener in MiniInput**

In `mini-input.tsx`, add a `useEffect` that listens for `"odin:add-page-context"`:

```tsx
useEffect(() => {
  const handler = (e: CustomEvent<string>) => {
    const widgetId = e.detail;
    if (!contextSelections.page.includes(widgetId)) {
      toggleItem("page" as ContextCategory, widgetId);
    }
  };
  window.addEventListener("odin:add-page-context", handler as EventListener);
  return () => window.removeEventListener("odin:add-page-context", handler as EventListener);
}, [contextSelections.page, toggleItem]);
```

In `widget-menu.tsx`'s `onAddToContext`, dispatch:
```tsx
window.dispatchEvent(new CustomEvent("odin:add-page-context", { detail: widgetId }));
```

Actually, better: pass the widgetId directly into WidgetMenu and have it dispatch. Or handle it in the demo page's callback. The demo page's `handleAddToContext(widgetId)` dispatches the event + shows a toast.

**Step 3: Wire toasts**

Import `toast` from `sonner` in the demo page. When "Add to context" is clicked:
```tsx
toast.success(`Added ${widget.title} to context`);
```

**Step 4: Full demo page rewrite**

The page will be restructured into sub-components within the file:
- `KPICard` — renders a single KPI with WidgetMenu
- `ChartCard` — renders a chart visual with WidgetMenu
- `TransactionsCard` — renders the table with WidgetMenu
- `SectionHeader` — renders section title + WidgetMenu for the section

Each renders `<AISummary variant="compact">` conditionally when it's the active inline summary target.

**Step 5: Commit**

```bash
git add agent-chat-ui/src/app/demo/page.tsx agent-chat-ui/src/components/mini-thread/mini-input.tsx
git commit -m "feat: integrate AI summary and widget menus into demo dashboard"
```

---

### Task 8: Handle Page Context Data in Submit

**Files:**
- Modify: `agent-chat-ui/src/components/mini-thread/mini-input.tsx:274-321`

**Step 1: Resolve page widget IDs to full data in toMetadata**

The `toMetadata` in `use-context-selectors.ts` currently returns page widget IDs as strings. We need the full widget data (title, type, data) sent to the AI. This resolution should happen at submit time.

In `mini-input.tsx`'s `handleSubmit`, after getting `contextMeta`, resolve page IDs:

```tsx
import { usePageWidgets } from "@/lib/dashboard-widgets";
// ... inside the component:
const pageWidgets = usePageWidgets();

// In handleSubmit, after line 281:
if (combinedMeta.page && Array.isArray(combinedMeta.page)) {
  combinedMeta.page = (combinedMeta.page as string[]).map((id) => {
    const widget = pageWidgets.find((w) => w.id === id);
    return widget ? { id: widget.id, title: widget.title, type: widget.type, data: widget.data } : { id };
  });
}
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/mini-input.tsx
git commit -m "feat: resolve page widget IDs to full data on submit"
```

---

### Task 9: Visual Polish and Edge Cases

**Files:**
- Modify: `agent-chat-ui/src/components/thread/context-popover.tsx` (preview tooltip for page category)
- Modify: `agent-chat-ui/src/app/demo/page.tsx` (hover visibility for menus)

**Step 1: Add hover-reveal for widget menus**

Widget menus should show on card hover. Add a `group` class to each widget card container and `opacity-0 group-hover:opacity-100 transition-opacity` to the WidgetMenu button.

**Step 2: Ensure only one inline summary at a time**

Verify that setting `activeInlineSummary` to a new widget auto-dismisses the previous. The `AnimatePresence` + state replacement handles this naturally.

**Step 3: Handle preset preview for page category**

In the context popover's preset preview tooltip (lines 411-443), the hardcoded category list `["countries", "platforms", "metrics"]` needs to include `"page"` if the preset has page items. Update the filter:

```ts
const cats = (
  ["countries", "platforms", "metrics", "page"] as ContextCategory[]
).filter((c) => preset.selections[c]?.length > 0);
```

And add page icon/color handling for the preview.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: polish widget menu hover, single inline summary, page preset preview"
```

---

### Task 10: Final Integration Test

**Step 1: Start the dev server**

```bash
cd agent-chat-ui && npm run dev
```

**Step 2: Manual verification checklist**

Navigate to `/demo` and verify:

- [ ] Executive summary appears after ~500ms with shimmer animation
- [ ] After ~1.5s shimmer, text cascades in word-by-word
- [ ] Dismiss X closes the executive summary
- [ ] Each widget card shows three-dot menu on hover
- [ ] Each section heading has a three-dot menu
- [ ] Clicking "Explain" on a widget shows compact AI summary above it
- [ ] Opening another widget's summary closes the previous one
- [ ] "Add to context" from menu shows toast and amber badge in chat
- [ ] Typing `@` in chat shows "On Current Page" category
- [ ] Drilling into "On Current Page" lists all 6 widgets
- [ ] Checking widgets adds amber badges above input
- [ ] Section-level "Add to context" adds all section widgets
- [ ] Submitting a message with page context includes widget data

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address integration test findings"
```
