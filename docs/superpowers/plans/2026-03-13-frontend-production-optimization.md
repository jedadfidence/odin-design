# Frontend Production Optimization — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the chat and demo frontend for production — split monolithic components, add lazy loading, fix styling inconsistencies, add memoization — with zero visual or behavioral changes.

**Architecture:** Extract focused components and hooks from `thread/index.tsx` (1,371 lines) and `mini-thread/mini-input.tsx` (792 lines). Deduplicate shared filter-sync logic into a common hook. Wrap heavy modals/overlays in `next/dynamic`. Replace hardcoded hex colors with CSS variables. Add `React.memo` and `useMemo` to prevent unnecessary re-renders.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Radix UI, nuqs

**Verification:** After every task, run `cd agent-chat-ui && npx next build` to confirm no regressions. There are no frontend unit tests in this project.

---

## File Structure

### New files to create:
- `src/hooks/use-filter-sync.ts` — Shared two-way sync between context selectors and filter panel
- `src/components/thread/scroll-helpers.tsx` — ScrollToBottomBridge, StickyToBottomContent, ScrollToBottom
- `src/components/thread/chat-header.tsx` — Thread header bar
- `src/components/thread/chat-sidebar.tsx` — Collapsible history sidebar
- `src/components/thread/use-chat-handlers.ts` — All useCallback handlers for Thread
- `src/components/thread/chat-input.tsx` — Form, textarea, toolbar, popovers

### Files to modify:
- `src/components/thread/index.tsx` — Slim orchestrator (~350 lines)
- `src/components/mini-thread/mini-input.tsx` — Slim version using shared hook (~400 lines)
- `src/components/thread/messages/ai.tsx` — Add React.memo wrapper
- `src/components/thread/messages/human.tsx` — Add React.memo, fix hardcoded color
- `src/components/filters/filter-sidebar.tsx` — Fix hardcoded colors
- `src/components/filters/filter-category.tsx` — Fix hardcoded color
- `src/components/demo/app-sidebar.tsx` — Fix hardcoded color
- `src/app/demo/page.tsx` — Fix hardcoded color, add lazy loading for AISummary
- `src/components/thread/markdown-text.tsx` — Lazy load ChartRenderer
- `src/app/globals.css` — Add --brand-accent and --surface-deep CSS variables
- `src/components/ui/switch.tsx` — Fix hardcoded color

---

## Chunk 1: Shared Hook & CSS Variables

### Task 1: Add CSS variables for brand accent and surface-deep

**Files:**
- Modify: `agent-chat-ui/src/app/globals.css`

These two colors are used across many components but aren't mapped to CSS variables:
- `#4586F7` — brand accent blue, used on send buttons, FAB, filter save buttons, switch
- `#F0F4FF` / `#0D0D14` — deep surface background used on sidebars and demo page (note: `#0D0D14` differs from `--background: #111118` in dark mode, so this needs its own variable)

- [ ] **Step 1: Add variables to `:root` and `.dark` in globals.css**

In `:root` block, add after `--surface-alt: #E4EFFE;`:
```css
--brand-accent: #4586F7;
--brand-accent-hover: #3a75e0;
--surface-deep: #F0F4FF;
```

In `.dark` block, add after `--surface-alt: #1F356F;`:
```css
--brand-accent: #4586F7;
--brand-accent-hover: #3a75e0;
--surface-deep: #0D0D14;
```

- [ ] **Step 2: Add Tailwind theme mappings**

In the second `@theme inline` block (the one with `--color-background`), add after `--color-surface-alt`:
```css
--color-brand-accent: var(--brand-accent);
--color-brand-accent-hover: var(--brand-accent-hover);
--color-surface-deep: var(--surface-deep);
```

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`
Expected: Build succeeds, no errors.

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/app/globals.css
git commit -m "feat: add brand-accent, brand-accent-hover, and surface-deep CSS variables"
```

---

### Task 2: Extract `use-filter-sync.ts` shared hook

**Files:**
- Create: `agent-chat-ui/src/hooks/use-filter-sync.ts`

This hook encapsulates the two-way sync logic between context selectors and the filter panel. Currently duplicated in `thread/index.tsx` (lines 304-383) and `mini-thread/mini-input.tsx` (lines 131-160).

- [ ] **Step 1: Create the shared hook**

Create `agent-chat-ui/src/hooks/use-filter-sync.ts` with the following content:

```typescript
import { useCallback } from "react";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { FilterCategory as FilterCategoryType, FilterSelections } from "@/lib/filter-data";

const CONTEXT_TO_FILTER_MAP: Partial<Record<ContextCategory, FilterCategoryType>> = {
  platforms: "platform",
  countries: "country",
  region: "region",
  category: "category",
  brand: "brand",
};

interface FilterSyncDeps {
  useAsContext: boolean;
  toggleItem: (cat: ContextCategory, item: string) => void;
  removeItem: (cat: ContextCategory, item: string) => void;
  resetSelections: () => void;
  setSelections: React.Dispatch<React.SetStateAction<ContextSelections>>;
  toggleFilterItem: (cat: FilterCategoryType, item: string) => void;
  removeFilterItem: (cat: FilterCategoryType, item: string) => void;
  selectAllFilter: (cat: FilterCategoryType, items: string[]) => void;
  clearFilterCategory: (cat: FilterCategoryType) => void;
  resetAllFilters: () => void;
}

export function useFilterSync({
  useAsContext,
  toggleItem,
  removeItem,
  resetSelections,
  setSelections,
  toggleFilterItem,
  removeFilterItem,
  selectAllFilter,
  clearFilterCategory,
  resetAllFilters,
}: FilterSyncDeps) {
  const handleToggleContextItem = useCallback(
    (cat: ContextCategory, item: string) => {
      toggleItem(cat, item);
      if (useAsContext) {
        const filterCat = CONTEXT_TO_FILTER_MAP[cat];
        if (filterCat) toggleFilterItem(filterCat, item);
      }
    },
    [toggleItem, useAsContext, toggleFilterItem],
  );

  const handleRemoveContextItem = useCallback(
    (cat: ContextCategory, item: string) => {
      removeItem(cat, item);
      if (useAsContext) {
        const filterCat = CONTEXT_TO_FILTER_MAP[cat];
        if (filterCat) removeFilterItem(filterCat, item);
      }
    },
    [removeItem, useAsContext, removeFilterItem],
  );

  const handleToggleFilterItem = useCallback(
    (cat: FilterCategoryType, item: string) => {
      toggleFilterItem(cat, item);
      if (useAsContext) {
        const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
          ([, v]) => v === cat,
        )?.[0] as ContextCategory | undefined;
        if (contextCat) toggleItem(contextCat, item);
      }
    },
    [toggleFilterItem, useAsContext, toggleItem],
  );

  const handleResetAllFilters = useCallback(() => {
    resetAllFilters();
    if (useAsContext) {
      resetSelections();
    }
  }, [resetAllFilters, useAsContext, resetSelections]);

  const handleClearFilterCategory = useCallback(
    (cat: FilterCategoryType) => {
      clearFilterCategory(cat);
      if (useAsContext) {
        const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
          ([, v]) => v === cat,
        )?.[0] as ContextCategory | undefined;
        if (contextCat) {
          setSelections((prev) => ({ ...prev, [contextCat]: [] }));
        }
      }
    },
    [clearFilterCategory, useAsContext, setSelections],
  );

  const handleSelectAllFilter = useCallback(
    (cat: FilterCategoryType, items: string[]) => {
      selectAllFilter(cat, items);
      if (useAsContext) {
        const contextCat = Object.entries(CONTEXT_TO_FILTER_MAP).find(
          ([, v]) => v === cat,
        )?.[0] as ContextCategory | undefined;
        if (contextCat) {
          setSelections((prev) => ({ ...prev, [contextCat]: [...items] }));
        }
      }
    },
    [selectAllFilter, useAsContext, setSelections],
  );

  return {
    handleToggleContextItem,
    handleRemoveContextItem,
    handleToggleFilterItem,
    handleResetAllFilters,
    handleClearFilterCategory,
    handleSelectAllFilter,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd agent-chat-ui && npx next build`
Expected: Build succeeds (new file isn't imported yet, so no change).

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/hooks/use-filter-sync.ts
git commit -m "feat: extract shared use-filter-sync hook for two-way context/filter sync"
```

---

## Chunk 2: Split `thread/index.tsx`

### Task 3: Extract `scroll-helpers.tsx`

**Files:**
- Create: `agent-chat-ui/src/components/thread/scroll-helpers.tsx`
- Modify: `agent-chat-ui/src/components/thread/index.tsx` (replace inline definitions with imports)

- [ ] **Step 1: Create scroll-helpers.tsx**

Move `ScrollToBottomBridge` (lines 75-81), `StickyToBottomContent` (lines 83-106), and `ScrollToBottom` (lines 108-147) from `index.tsx` into `scroll-helpers.tsx`.

```typescript
import { ReactNode, useState, useEffect } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToBottomBridge({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  useEffect(() => {
    scrollRef.current = scrollToBottom;
  }, [scrollToBottom, scrollRef]);
  return null;
}

export function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      className={cn("w-full h-full", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>
      {props.footer}
    </div>
  );
}

export function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const [hovered, setHovered] = useState(false);

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm",
        props.className,
      )}
      onClick={() => scrollToBottom()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="relative h-4 w-4 overflow-hidden">
        <ArrowDown
          className="h-4 w-4"
          style={{
            animation: hovered
              ? "arrow-exit-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
              : "arrow-reset-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
        <ArrowDown
          className="absolute inset-0 h-4 w-4"
          style={{
            animation: hovered
              ? "arrow-enter-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
              : "arrow-exit-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      </span>
      <span>Scroll to bottom</span>
    </Button>
  );
}
```

Note: `style={{ width: "100%", height: "100%" }}` replaced with `className="w-full h-full"` in `StickyToBottomContent`.

- [ ] **Step 2: Update index.tsx imports**

In `thread/index.tsx`:
- Remove the inline `ScrollToBottomBridge`, `StickyToBottomContent`, `ScrollToBottom` function definitions (lines 75-147)
- Add import: `import { ScrollToBottomBridge, StickyToBottomContent, ScrollToBottom } from "./scroll-helpers";`
- Remove unused imports that were only used by scroll helpers: `ArrowDown` from lucide-react (check if used elsewhere in the file first — it IS used in ScrollToBottom only)

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/scroll-helpers.tsx agent-chat-ui/src/components/thread/index.tsx
git commit -m "refactor: extract scroll helpers from thread/index.tsx"
```

---

### Task 4: Extract `chat-header.tsx`

**Files:**
- Create: `agent-chat-ui/src/components/thread/chat-header.tsx`
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Create chat-header.tsx**

Extract the `<header>` JSX block from `index.tsx` (lines 825-873) into a new component.

```typescript
import { Button } from "../ui/button";
import { TooltipIconButton } from "./tooltip-icon-button";
import { FileBarChart, SquarePen, Wrench, PanelBottomClose, Menu } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface ChatHeaderProps {
  chatStarted: boolean;
  hideToolCalls: boolean | null;
  onToggleToolCalls: () => void;
  onNewThread: () => void;
  onOpenReport: () => void;
  onToggleChatHistory: () => void;
}

export function ChatHeader({
  chatStarted,
  hideToolCalls,
  onToggleToolCalls,
  onNewThread,
  onOpenReport,
  onToggleChatHistory,
}: ChatHeaderProps) {
  const searchParams = useSearchParams();

  return (
    <header className="flex h-12 items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleChatHistory}
        >
          <Menu />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        {chatStarted && (
          <>
            <TooltipIconButton
              tooltip="Generate report"
              variant="ghost"
              onClick={onOpenReport}
              data-testid="report-btn"
            >
              <FileBarChart />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="New thread"
              variant="ghost"
              onClick={onNewThread}
            >
              <SquarePen />
            </TooltipIconButton>
          </>
        )}
        <TooltipIconButton
          tooltip={hideToolCalls ? "Show details" : "Hide details"}
          variant="ghost"
          onClick={onToggleToolCalls}
          className={cn(hideToolCalls === false && "text-primary")}
        >
          <Wrench />
        </TooltipIconButton>
        <Link href={`/demo${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}>
          <TooltipIconButton tooltip="Minimize chat" variant="ghost" className="h-8 w-8">
            <PanelBottomClose className="h-4 w-4" />
          </TooltipIconButton>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update index.tsx**

- Remove the `<header>...</header>` JSX from the Thread component's render
- Add import: `import { ChatHeader } from "./chat-header";`
- Replace with: `<ChatHeader chatStarted={chatStarted} hideToolCalls={hideToolCalls} onToggleToolCalls={() => setHideToolCalls(!(hideToolCalls ?? true))} onNewThread={() => setThreadId(null)} onOpenReport={() => setReportSheetOpen(true)} onToggleChatHistory={() => setChatHistoryOpen((p) => !p)} />`
- Remove unused imports from index.tsx: `FileBarChart`, `Menu`, `Wrench`, `PanelBottomClose`, `SquarePen` (from lucide-react), `ThemeToggle`, `Link`, `useSearchParams` — but check each is truly unused first

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/chat-header.tsx agent-chat-ui/src/components/thread/index.tsx
git commit -m "refactor: extract ChatHeader from thread/index.tsx"
```

---

### Task 5: Extract `chat-sidebar.tsx`

**Files:**
- Create: `agent-chat-ui/src/components/thread/chat-sidebar.tsx`
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Create chat-sidebar.tsx**

Extract the collapsible sidebar JSX from `index.tsx` (lines 779-809).

```typescript
import { Button } from "../ui/button";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ThreadHistory from "./history";

interface ChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ collapsed, onToggle }: ChatSidebarProps) {
  return (
    <div
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex items-center p-2",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <span className="text-sm font-medium text-sidebar-foreground pl-2">
            History
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ThreadHistory collapsed={collapsed} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update index.tsx**

- Remove the sidebar `<div>` block from render
- Add import: `import { ChatSidebar } from "./chat-sidebar";`
- Replace with: `<ChatSidebar collapsed={sidebarCollapsed ?? true} onToggle={() => setSidebarCollapsed((p) => !p)} />`
- Remove unused imports: `ChevronsLeft`, `ChevronsRight` from lucide-react, `ThreadHistory` — if no longer used directly

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/chat-sidebar.tsx agent-chat-ui/src/components/thread/index.tsx
git commit -m "refactor: extract ChatSidebar from thread/index.tsx"
```

---

### Task 6: Extract `use-chat-handlers.ts`

**Files:**
- Create: `agent-chat-ui/src/components/thread/use-chat-handlers.ts`
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Create use-chat-handlers.ts**

Move all `useCallback` handler definitions from `index.tsx` into a custom hook. This includes:
- Preset handlers: `handleRenamePreset`, `handleConfirmRename`, `handleApplyPreset`, `handleEditPreset`, `handleDuplicatePreset`, `handleSavePreset`, `handleSaveAsNewPreset`, `handleConfirmNewPreset`, `handleDeactivatePreset`, `handleClearSelections` (lines 242-302)
- Shortcut handlers: `handleSelectShortcut`, `handleEditShortcutFromPopover`, `handleCreateShortcutFromPopover`, `handleSaveShortcut`, `handleSaveShortcutAsNew`, `handleSaveAsShortcutFromToolbar` (lines 385-445)
- Quote handler: `handleAddQuote`, `handleScrollToQuoteSource` (lines 463-552)
- Submit handlers: `handleSubmit`, `handleRegenerate`, `handleSuggestionSelect`, `handleReuse` (lines 610-750)

The hook should accept all the state and setters it needs as a deps object. It returns all the handler functions.

```typescript
import { useCallback, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { ContextPreset } from "@/lib/context-presets";
import { ContextSelections, ContextCategory } from "@/lib/context-selectors";
import { Shortcut } from "@/lib/shortcuts";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";

interface ChatHandlersDeps {
  // Input state
  input: string;
  setInput: (val: string) => void;
  contentBlocks: any[];
  setContentBlocks: (blocks: any[]) => void;

  // Stream
  stream: any;

  // Context selectors
  contextSelections: ContextSelections;
  setContextSelections: React.Dispatch<React.SetStateAction<ContextSelections>>;
  hasContextSelections: boolean;
  resetContextSelections: () => void;
  contextToMetadata: () => Record<string, any> | undefined;

  // Quotes
  quotes: any[];
  addQuote: (text: string, messageId: string, sourceType: "ai" | "human") => void;
  clearQuotes: () => void;
  setQuotesFromTexts: (texts: string[]) => void;
  quotesToMetadata: () => Record<string, any> | undefined;
  clearSelection: () => void;

  // Presets
  presetEditing: { presetId: string; presetName: string } | null;
  addPreset: (name: string, selections: ContextSelections, filters?: any) => ContextPreset;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  duplicatePreset: (id: string) => ContextPreset | undefined;
  startPresetEditing: (preset: ContextPreset) => void;
  stopPresetEditing: () => void;
  savePresetEditing: (selections: ContextSelections, filters?: any) => void;

  // Shortcuts
  editingShortcut: Shortcut | null;
  addShortcut: (name: string, instructions: string, context: ContextSelections | null, presetId: string | null) => void;
  updateShortcut: (id: string, data: Partial<Shortcut>) => void;
  openShortcutPopover: (source?: string) => void;
  closeShortcutPopover: () => void;
  openShortcutCreateDialog: (prefill?: { instructions: string; context: ContextSelections | null }) => void;
  openShortcutEditDialog: (shortcut: Shortcut) => void;
  closeShortcutDialog: () => void;

  // Filters
  useAsContext: boolean;
  filterSelections: any;
  hasFilterSelections: boolean;
  setFilterSelections: React.Dispatch<React.SetStateAction<any>>;
  filterToMetadata: () => any;
  resetAllFilters: () => void;

  // Suggestions
  clearSuggestions: () => void;

  // Artifact
  artifactContext: Record<string, any>;

  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottomRef: React.MutableRefObject<(() => void) | null>;

  // Dialogs
  setPresetNameDialogOpen: (open: boolean) => void;
  setRenameTarget: (target: { id: string; name: string } | null) => void;
  renameTarget: { id: string; name: string } | null;

  // Context popover
  closeContextPopover: () => void;
}

export function useChatHandlers(deps: ChatHandlersDeps) {
  const {
    input, setInput, contentBlocks, setContentBlocks, stream,
    contextSelections, setContextSelections, hasContextSelections, resetContextSelections, contextToMetadata,
    addQuote, clearQuotes, setQuotesFromTexts, quotesToMetadata, clearSelection,
    presetEditing, addPreset, renamePreset: renamePresetFn, duplicatePreset,
    startPresetEditing, stopPresetEditing, savePresetEditing,
    editingShortcut, addShortcut, updateShortcut,
    closeShortcutPopover, openShortcutCreateDialog, openShortcutEditDialog, closeShortcutDialog,
    useAsContext, filterSelections, hasFilterSelections, setFilterSelections, filterToMetadata, resetAllFilters,
    clearSuggestions, artifactContext,
    textareaRef, messagesContainerRef, scrollToBottomRef,
    setPresetNameDialogOpen, setRenameTarget, renameTarget,
    closeContextPopover,
  } = deps;

  // --- Preset handlers ---

  const handleRenamePreset = useCallback((id: string, currentName: string) => {
    setRenameTarget({ id, name: currentName });
  }, [setRenameTarget]);

  const handleConfirmRename = useCallback((newName: string) => {
    if (renameTarget) {
      renamePresetFn(renameTarget.id, newName);
      setRenameTarget(null);
    }
  }, [renameTarget, renamePresetFn, setRenameTarget]);

  const handleApplyPreset = useCallback((preset: ContextPreset) => {
    setContextSelections(preset.selections);
    if (preset.filters) {
      setFilterSelections(preset.filters);
    }
    startPresetEditing(preset);
    closeContextPopover();
  }, [setContextSelections, setFilterSelections, startPresetEditing, closeContextPopover]);

  const handleEditPreset = useCallback((preset: ContextPreset) => {
    setContextSelections(preset.selections);
    startPresetEditing(preset);
    closeContextPopover();
  }, [setContextSelections, startPresetEditing, closeContextPopover]);

  const handleDuplicatePreset = useCallback((presetId: string) => {
    const newPreset = duplicatePreset(presetId);
    if (newPreset) {
      setContextSelections(newPreset.selections);
      startPresetEditing(newPreset);
      closeContextPopover();
    }
  }, [duplicatePreset, setContextSelections, startPresetEditing, closeContextPopover]);

  const handleSavePreset = useCallback(() => {
    if (presetEditing) {
      savePresetEditing(contextSelections, filterSelections);
    }
  }, [presetEditing, savePresetEditing, contextSelections, filterSelections]);

  const handleSaveAsNewPreset = useCallback(() => {
    setPresetNameDialogOpen(true);
  }, [setPresetNameDialogOpen]);

  const handleConfirmNewPreset = useCallback((name: string) => {
    const preset = addPreset(name, contextSelections, filterSelections);
    startPresetEditing(preset);
  }, [addPreset, contextSelections, filterSelections, startPresetEditing]);

  const handleDeactivatePreset = useCallback(() => {
    stopPresetEditing();
  }, [stopPresetEditing]);

  const handleClearSelections = useCallback(() => {
    stopPresetEditing();
    resetContextSelections();
    if (useAsContext) {
      resetAllFilters();
    }
  }, [stopPresetEditing, resetContextSelections, useAsContext, resetAllFilters]);

  // --- Shortcut handlers ---

  const handleSelectShortcut = useCallback((shortcut: Shortcut) => {
    setInput(shortcut.instructions);
    if (shortcut.context) {
      setContextSelections(shortcut.context);
    }
    closeShortcutPopover();
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [setInput, setContextSelections, closeShortcutPopover, textareaRef]);

  const handleEditShortcutFromPopover = useCallback((shortcut: Shortcut) => {
    closeShortcutPopover();
    openShortcutEditDialog(shortcut);
  }, [closeShortcutPopover, openShortcutEditDialog]);

  const handleCreateShortcutFromPopover = useCallback(() => {
    closeShortcutPopover();
    openShortcutCreateDialog();
  }, [closeShortcutPopover, openShortcutCreateDialog]);

  const handleSaveShortcut = useCallback(
    (name: string, instructions: string, context: ContextSelections | null, presetId: string | null) => {
      if (editingShortcut) {
        updateShortcut(editingShortcut.id, { name, instructions, context, presetId });
      } else {
        addShortcut(name, instructions, context, presetId);
      }
      closeShortcutDialog();
    },
    [editingShortcut, updateShortcut, addShortcut, closeShortcutDialog],
  );

  const handleSaveShortcutAsNew = useCallback(
    (name: string, instructions: string, context: ContextSelections | null, presetId: string | null) => {
      addShortcut(name, instructions, context, presetId);
      closeShortcutDialog();
    },
    [addShortcut, closeShortcutDialog],
  );

  const handleSaveAsShortcutFromToolbar = useCallback(() => {
    openShortcutCreateDialog({
      instructions: input,
      context: hasContextSelections ? contextSelections : null,
    });
  }, [openShortcutCreateDialog, input, hasContextSelections, contextSelections]);

  // --- Quote handlers ---

  const handleAddQuote = useCallback(
    (text: string, messageId: string, sourceType: "ai" | "human") => {
      addQuote(text, messageId, sourceType);
      clearSelection();
    },
    [addQuote, clearSelection],
  );

  const handleScrollToQuoteSource = useCallback(
    (quote: { sourceMessageId: string; text: string }) => {
      const messageEl = messagesContainerRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${quote.sourceMessageId}"]`,
      );
      if (!messageEl) return;

      const walker = document.createTreeWalker(messageEl, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) textNodes.push(node as Text);

      let fullText = "";
      const segments: { node: Text; start: number; len: number }[] = [];
      for (const tn of textNodes) {
        const len = tn.textContent?.length ?? 0;
        segments.push({ node: tn, start: fullText.length, len });
        fullText += tn.textContent ?? "";
      }

      const matchStart = fullText.indexOf(quote.text);
      if (matchStart === -1) {
        messageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        messageEl.classList.add("quote-source-highlight");
        setTimeout(() => {
          document.addEventListener(
            "pointerdown",
            () => messageEl.classList.remove("quote-source-highlight"),
            { once: true },
          );
        }, 0);
        return;
      }

      const matchEnd = matchStart + quote.text.length;
      const marks: HTMLElement[] = [];
      const affected = segments
        .filter((s) => s.start < matchEnd && s.start + s.len > matchStart)
        .reverse();

      for (const seg of affected) {
        const hlStart = Math.max(0, matchStart - seg.start);
        const hlEnd = Math.min(seg.len, matchEnd - seg.start);
        const range = document.createRange();
        range.setStart(seg.node, hlStart);
        range.setEnd(seg.node, hlEnd);
        const mark = document.createElement("mark");
        mark.className = "quote-source-highlight-text";
        range.surroundContents(mark);
        marks.push(mark);
      }

      const scrollTarget = marks[marks.length - 1] ?? messageEl;
      scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });

      const removeMarks = () => {
        for (const m of marks) {
          const parent = m.parentNode;
          if (!parent) continue;
          while (m.firstChild) parent.insertBefore(m.firstChild, m);
          parent.removeChild(m);
          parent.normalize();
        }
        document.removeEventListener("pointerdown", removeMarks);
      };
      setTimeout(() => {
        document.addEventListener("pointerdown", removeMarks, { once: true });
      }, 0);
    },
    [messagesContainerRef],
  );

  // --- Submit handlers ---

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if ((input.trim().length === 0 && contentBlocks.length === 0) || stream.isLoading) return;

      const contextMeta = contextToMetadata();
      const quotesMeta = quotesToMetadata();
      const filterMeta = useAsContext ? filterToMetadata() : undefined;
      const combinedMeta = {
        ...(contextMeta ?? {}),
        ...(quotesMeta ?? {}),
        ...(filterMeta ? { filters: filterMeta } : {}),
      };
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [
          ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
          ...contentBlocks,
        ] as Message["content"],
        additional_kwargs:
          Object.keys(combinedMeta).length > 0 ? { context: combinedMeta } : {},
      };

      const toolMessages = ensureToolCallsHaveResponses(stream.messages);
      const mergedContext = {
        ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
        ...(contextMeta ?? {}),
        ...(quotesMeta ?? {}),
        ...(filterMeta ? { filters: filterMeta } : {}),
      };
      const context = Object.keys(mergedContext).length > 0 ? mergedContext : undefined;

      stream.submit(
        { messages: [...toolMessages, newHumanMessage], context },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
          optimisticValues: (prev: any) => ({
            ...prev,
            context,
            messages: [...(prev.messages ?? []), ...toolMessages, newHumanMessage],
          }),
        },
      );

      clearSuggestions();
      setInput("");
      setContentBlocks([]);
      clearQuotes();
      scrollToBottomRef.current?.();
    },
    [
      input, contentBlocks, stream, contextToMetadata, quotesToMetadata,
      useAsContext, filterToMetadata, artifactContext, clearSuggestions,
      setInput, setContentBlocks, clearQuotes, scrollToBottomRef,
    ],
  );

  const handleRegenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      stream.submit(undefined, {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
      });
    },
    [stream],
  );

  const handleSuggestionSelect = useCallback(
    (text: string) => {
      const contextMeta = contextToMetadata();
      const quotesMeta = quotesToMetadata();
      const combinedMeta = { ...(contextMeta ?? {}), ...(quotesMeta ?? {}) };
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text }] as Message["content"],
        additional_kwargs:
          Object.keys(combinedMeta).length > 0 ? { context: combinedMeta } : {},
      };
      const toolMessages = ensureToolCallsHaveResponses(stream.messages);
      const suggestionContext = {
        ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
        ...(contextMeta ?? {}),
        ...(quotesMeta ?? {}),
      };
      const context =
        Object.keys(suggestionContext).length > 0 ? suggestionContext : undefined;

      stream.submit(
        { messages: [...toolMessages, newHumanMessage], context },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
          optimisticValues: (prev: any) => ({
            ...prev,
            context,
            messages: [...(prev.messages ?? []), ...toolMessages, newHumanMessage],
          }),
        },
      );
      clearSuggestions();
      clearQuotes();
      scrollToBottomRef.current?.();
    },
    [clearSuggestions, clearQuotes, stream, contextToMetadata, quotesToMetadata, artifactContext, scrollToBottomRef],
  );

  const handleReuse = useCallback(
    (text: string, context?: Record<string, string[]>) => {
      setInput(text);
      if (context) {
        setContextSelections({
          countries: context.countries ?? [],
          platforms: context.platforms ?? [],
          region: context.region ?? [],
          category: context.category ?? [],
          brand: context.brand ?? [],
          page: [],
        });
        if (context.selected_text?.length) {
          setQuotesFromTexts(context.selected_text);
        } else {
          clearQuotes();
        }
      } else {
        resetContextSelections();
        clearQuotes();
      }
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
    [setInput, setContextSelections, resetContextSelections, setQuotesFromTexts, clearQuotes, textareaRef],
  );

  return {
    // Preset
    handleRenamePreset,
    handleConfirmRename,
    handleApplyPreset,
    handleEditPreset,
    handleDuplicatePreset,
    handleSavePreset,
    handleSaveAsNewPreset,
    handleConfirmNewPreset,
    handleDeactivatePreset,
    handleClearSelections,
    // Shortcut
    handleSelectShortcut,
    handleEditShortcutFromPopover,
    handleCreateShortcutFromPopover,
    handleSaveShortcut,
    handleSaveShortcutAsNew,
    handleSaveAsShortcutFromToolbar,
    // Quote
    handleAddQuote,
    handleScrollToQuoteSource,
    // Submit
    handleSubmit,
    handleRegenerate,
    handleSuggestionSelect,
    handleReuse,
  };
}
```

- [ ] **Step 2: Update index.tsx to use the hook**

In `thread/index.tsx`:
- Remove all the inline `useCallback` handler definitions (lines 242-750 approximately)
- Import: `import { useChatHandlers } from "./use-chat-handlers";`
- Call the hook after the state/hook setup, passing all deps
- Destructure the returned handlers

- [ ] **Step 3: Wire `useFilterSync` into index.tsx**

Replace the inline `CONTEXT_TO_FILTER_MAP` and `handleToggle*Synced` / `handleReset*Synced` / `handleClear*Synced` / `handleSelectAll*Synced` callbacks (lines 304-383) with:

```typescript
import { useFilterSync } from "@/hooks/use-filter-sync";

// Inside Thread():
const filterSync = useFilterSync({
  useAsContext,
  toggleItem,
  removeItem,
  resetSelections: resetContextSelections,
  setSelections: setContextSelections,
  toggleFilterItem,
  removeFilterItem,
  selectAllFilter,
  clearFilterCategory,
  resetAllFilters,
});
```

Then use `filterSync.handleToggleContextItem` instead of `handleToggleContextItem`, etc. in the JSX and handler deps.

- [ ] **Step 4: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 5: Commit**

```bash
git add agent-chat-ui/src/components/thread/use-chat-handlers.ts agent-chat-ui/src/components/thread/index.tsx
git commit -m "refactor: extract useChatHandlers and useFilterSync from thread/index.tsx"
```

---

### Task 7: Extract `chat-input.tsx`

**Files:**
- Create: `agent-chat-ui/src/components/thread/chat-input.tsx`
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Create chat-input.tsx**

Extract the entire input area from `index.tsx` — the filter toggle bar, the form with textarea, toolbar buttons, context/shortcut popovers, quote cards, context badges, and the glow wrapper. This is roughly lines 990-1304 in the current file.

The component should accept all handler functions, state, and refs as props. Define a clear `ChatInputProps` interface.

Key props needed:
- `input`, `setInput` — text state
- `chatStarted`, `isLoading` — UI state
- `useAsContext`, `setUseAsContext` — filter toggle
- `hasFilterSelections`, `filterSelections` — filter state
- `contentBlocks`, `removeBlock` — file upload
- `dragOver`, `handlePaste` — drag/paste
- `quotes`, `updateQuote`, `removeQuote`, `clearQuotes` — quotes
- `handleScrollToQuoteSource` — quote navigation
- `contextSelections`, `hasContextSelections` — context
- All popover/shortcut/preset handlers from `useChatHandlers`
- All popover open/close state from hooks
- `dropRef`, `inputBoxRef`, `textareaRef` — refs
- `showSuggestions`, `setShowSuggestions` — suggestion toggle
- `stream` — for stop/loading state

Replace the hardcoded `bg-[#4586F7]` send button with `bg-brand-accent` and `hover:bg-[#3a75e0]` with `hover:bg-brand-accent-hover`.

- [ ] **Step 2: Update index.tsx to use ChatInput**

Replace the entire input section in the render with `<ChatInput {...props} />`.

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/chat-input.tsx agent-chat-ui/src/components/thread/index.tsx
git commit -m "refactor: extract ChatInput from thread/index.tsx"
```

---

## Chunk 3: Split `mini-thread/mini-input.tsx`

### Task 8: Integrate `useFilterSync` into mini-input.tsx

**Files:**
- Modify: `agent-chat-ui/src/components/mini-thread/mini-input.tsx`

- [ ] **Step 1: Replace inline filter sync with shared hook**

Replace the `CONTEXT_TO_FILTER_MAP` constant and `handleToggleContextItemSynced`/`handleRemoveContextItemSynced` callbacks (lines 131-160) with:

```typescript
import { useFilterSync } from "@/hooks/use-filter-sync";

// Inside MiniInput():
const filterSync = useFilterSync({
  useAsContext,
  toggleItem,
  removeItem,
  resetSelections: resetContextSelections,
  setSelections: setContextSelections,
  toggleFilterItem,
  removeFilterItem,
  selectAllFilter: () => {}, // mini-input doesn't use selectAll
  clearFilterCategory: () => {}, // mini-input doesn't use clearCategory
  resetAllFilters,
});
```

Then replace `handleToggleContextItemSynced` with `filterSync.handleToggleContextItem` and `handleRemoveContextItemSynced` with `filterSync.handleRemoveContextItem` in the JSX.

Also replace the send button's `bg-[#4586F7]` with `bg-brand-accent` and `hover:bg-[#3a75e0]` with `hover:bg-brand-accent-hover` (line 727).

- [ ] **Step 2: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/mini-input.tsx
git commit -m "refactor: use shared useFilterSync hook in mini-input, fix hardcoded colors"
```

---

### Task 9: Update `mini-thread/index.tsx` scroll helpers

**Files:**
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

- [ ] **Step 1: Reuse scroll helpers from thread**

Replace the inline `StickyToBottomContent`, `ScrollToBottom`, `ScrollToBottomBridge` definitions (lines 84-135) with imports from the shared module:

```typescript
import {
  ScrollToBottomBridge,
  StickyToBottomContent,
  ScrollToBottom,
} from "../thread/scroll-helpers";
```

Note: The mini-thread `ScrollToBottom` has slightly different styling (icon-only, `size="icon"`, `h-8 w-8`). If the differences are minimal enough to parameterize via className, use the shared version. If not, keep the mini-thread version as a local override.

Check the differences:
- Thread `ScrollToBottom`: has animated arrows and "Scroll to bottom" text label
- Mini `ScrollToBottom`: icon-only with `size="icon"` and `h-8 w-8`

These differ enough to warrant keeping both. Only share `ScrollToBottomBridge` and `StickyToBottomContent`.

Replace `style={{ width: "100%", height: "100%" }}` in `StickyToBottomContent` with `className="w-full h-full"` if using the shared version.

- [ ] **Step 2: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "refactor: reuse shared scroll helpers in mini-thread"
```

---

## Chunk 4: Lazy Loading

### Task 10: Lazy load ShortcutDialog and ReportSheet

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Replace static imports with dynamic imports**

At the top of `index.tsx`, replace:
```typescript
import { ReportSheet } from "./report-sheet";
import { ShortcutDialog } from "./shortcut-dialog";
```

With:
```typescript
import dynamic from "next/dynamic";

const ReportSheet = dynamic(
  () => import("./report-sheet").then((mod) => ({ default: mod.ReportSheet })),
  { ssr: false },
);
const ShortcutDialog = dynamic(
  () => import("./shortcut-dialog").then((mod) => ({ default: mod.ShortcutDialog })),
  { ssr: false },
);
```

Both are already conditionally rendered (`open` prop controls visibility), so no JSX changes needed.

- [ ] **Step 2: Do the same in mini-input.tsx**

In `mini-thread/mini-input.tsx`, replace:
```typescript
import { ShortcutDialog } from "../thread/shortcut-dialog";
```

With:
```typescript
import dynamic from "next/dynamic";

const ShortcutDialog = dynamic(
  () => import("../thread/shortcut-dialog").then((mod) => ({ default: mod.ShortcutDialog })),
  { ssr: false },
);
```

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx agent-chat-ui/src/components/mini-thread/mini-input.tsx
git commit -m "perf: lazy load ShortcutDialog and ReportSheet with next/dynamic"
```

---

### Task 11: Lazy load ChartRenderer

**Files:**
- Modify: `agent-chat-ui/src/components/thread/markdown-text.tsx`

- [ ] **Step 1: Replace static import**

Replace:
```typescript
import { ChartRenderer } from "@/components/thread/chart-renderer";
```

With:
```typescript
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(
  () => import("@/components/thread/chart-renderer").then((mod) => ({ default: mod.ChartRenderer })),
  { ssr: false },
);
```

- [ ] **Step 2: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/components/thread/markdown-text.tsx
git commit -m "perf: lazy load ChartRenderer with next/dynamic"
```

---

### Task 12: Lazy load AISummary in demo page

**Files:**
- Modify: `agent-chat-ui/src/app/demo/page.tsx`

- [ ] **Step 1: Replace static import**

Replace:
```typescript
import {
  AISummary,
  getMockResponse,
  getSectionMockResponse,
} from "@/components/demo/ai-summary";
```

With:
```typescript
import dynamic from "next/dynamic";
import { getMockResponse, getSectionMockResponse } from "@/components/demo/ai-summary";

const AISummary = dynamic(
  () => import("@/components/demo/ai-summary").then((mod) => ({ default: mod.AISummary })),
  { ssr: false },
);
```

Note: `getMockResponse` and `getSectionMockResponse` are pure functions, not components — they must remain static imports.

Also fix the hardcoded `bg-[#F0F4FF] dark:bg-[#0D0D14]` on the demo page container (line 114):
Replace with `bg-surface-deep`.

- [ ] **Step 2: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/app/demo/page.tsx
git commit -m "perf: lazy load AISummary, fix hardcoded background color"
```

---

## Chunk 5: Styling Consistency Fixes

### Task 13: Fix remaining hardcoded colors

**Files:**
- Modify: `agent-chat-ui/src/components/filters/filter-sidebar.tsx`
- Modify: `agent-chat-ui/src/components/demo/app-sidebar.tsx`
- Modify: `agent-chat-ui/src/components/thread/messages/human.tsx`
- Modify: `agent-chat-ui/src/components/ui/switch.tsx`

- [ ] **Step 1: Fix filter-sidebar.tsx**

Line 89: Replace `!bg-[#F0F4FF] dark:!bg-[#0D0D14]` with `!bg-surface-deep`

Line 151: Replace `style={{ backgroundColor: "#4586F7", color: "#fff" }}` with `className="... bg-brand-accent text-white hover:bg-brand-accent-hover"` (remove the `style` prop, add to className)

Line 171: Same replacement as line 151.

- [ ] **Step 2: Fix app-sidebar.tsx**

Line 158: Replace `bg-[#F0F4FF] dark:bg-[#0D0D14]` with `bg-surface-deep`

- [ ] **Step 3: Fix human.tsx**

Line 182: Replace `bg-[#E4EFFE] dark:bg-[#1F356F]` with `bg-accent` (exact match with CSS variables: `--accent: #E4EFFE` light, `--accent: #1F356F` dark).

- [ ] **Step 4: Fix switch.tsx**

Line 14: Replace `data-[state=checked]:bg-[#4586F7]` with `data-[state=checked]:bg-brand-accent`

- [ ] **Step 5: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 6: Verify visually**

Run: `cd agent-chat-ui && npm run dev`
Check in browser:
- Send button color matches original (#4586F7)
- Filter sidebar background matches original
- Human message bubbles match original
- Switch toggle color matches original
- All elements correct in both light and dark mode

- [ ] **Step 7: Commit**

```bash
git add agent-chat-ui/src/components/filters/filter-sidebar.tsx agent-chat-ui/src/components/demo/app-sidebar.tsx agent-chat-ui/src/components/thread/messages/human.tsx agent-chat-ui/src/components/ui/switch.tsx
git commit -m "style: replace hardcoded hex colors with CSS variable-based Tailwind classes"
```

---

## Chunk 6: Memoization

### Task 14: Add React.memo to message components

**Files:**
- Modify: `agent-chat-ui/src/components/thread/messages/ai.tsx`
- Modify: `agent-chat-ui/src/components/thread/messages/human.tsx`

- [ ] **Step 1: Wrap AssistantMessage with React.memo**

In `ai.tsx`, change:
```typescript
export function AssistantMessage({
```
To:
```typescript
export const AssistantMessage = React.memo(function AssistantMessage({
```

And close the component with `});` instead of `}`.

Add `import React from "react";` if not already imported (it's imported as `{ useEffect, useMemo, useRef, useState }` — add `React` or use `import { memo } from "react"` and `memo(...)` instead).

Using `memo` from react:
```typescript
import { Fragment } from "react/jsx-runtime";
import { memo, useEffect, useMemo, useRef, useState } from "react";
```

Then:
```typescript
export const AssistantMessage = memo(function AssistantMessage({
  ...
}: {
  ...
}) {
  ...
});
```

- [ ] **Step 2: Wrap HumanMessage with React.memo**

In `human.tsx`, same pattern:
```typescript
import { memo, useState } from "react";

export const HumanMessage = memo(function HumanMessage({
  ...
}: {
  ...
}) {
  ...
});
```

- [ ] **Step 3: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/messages/ai.tsx agent-chat-ui/src/components/thread/messages/human.tsx
git commit -m "perf: wrap AssistantMessage and HumanMessage with React.memo"
```

---

### Task 15: Add useMemo for derived state in Thread

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

- [ ] **Step 1: Memoize filtered messages**

Replace:
```typescript
{messages
  .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
  .map((message, index) => ...
```

With a `useMemo` above the return:
```typescript
const filteredMessages = useMemo(
  () => messages.filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)),
  [messages],
);
```

Then use `filteredMessages.map(...)` in the JSX.

- [ ] **Step 2: Memoize visibleSuggestions**

Replace the inline computation:
```typescript
const visibleSuggestions = isComposingMessage
  ? []
  : !chatStarted
  ? INITIAL_SUGGESTIONS
  : isLoading
    ? []
    : suggestions;
```

With:
```typescript
const visibleSuggestions = useMemo(
  () =>
    isComposingMessage
      ? []
      : !chatStarted
        ? INITIAL_SUGGESTIONS
        : isLoading
          ? []
          : suggestions,
  [isComposingMessage, chatStarted, isLoading, suggestions],
);
```

- [ ] **Step 3: Memoize lastAiMessage and hasFirstAiToken**

```typescript
const lastAiMessage = useMemo(
  () =>
    [...messages].reverse().find(
      (m) => m.type === "ai" && !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX),
    ),
  [messages],
);

const hasFirstAiToken = useMemo(
  () => !!lastAiMessage && getContentString(lastAiMessage.content).trim().length > 0,
  [lastAiMessage],
);
```

- [ ] **Step 4: Add useMemo import if needed**

Ensure `useMemo` is in the React import statement.

- [ ] **Step 5: Verify build**

Run: `cd agent-chat-ui && npx next build`

- [ ] **Step 6: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "perf: memoize derived state in Thread component"
```

---

## Final Verification

### Task 16: Full build and cleanup

- [ ] **Step 1: Run full build**

Run: `cd agent-chat-ui && npx next build`
Expected: Build succeeds with no errors or warnings.

- [ ] **Step 2: Check for unused imports**

Run: `cd agent-chat-ui && npx next lint`
Fix any lint warnings about unused imports that resulted from the refactoring.

- [ ] **Step 3: Final commit if lint fixes needed**

```bash
git add -A
git commit -m "chore: clean up unused imports after refactoring"
```
