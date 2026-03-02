# Mini Chat Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a compact, floating chat widget (MiniThread) that provides near-parity with the full-page chat, anchored to the bottom-right corner of the page.

**Architecture:** A new `<MiniThread />` component with its own compact layout shell, reusing all existing message components, providers, and hooks. A `/demo` route renders a mock host page with the widget floating in the corner. Open/close animation via framer-motion. Vertical resize via drag handle. Inline artifacts instead of side panel.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, framer-motion, shadcn/ui, LangGraph SDK, nuqs, use-stick-to-bottom

**Design doc:** `docs/plans/2026-03-02-mini-chat-widget-design.md`

---

### Task 1: Create /demo Route with Mock Host Page

Create the demo page that stakeholders will use to preview the mini chat widget. Start with just the mock dashboard — the widget placeholder comes in Task 2.

**Files:**
- Create: `agent-chat-ui/src/app/demo/page.tsx`

**Step 1: Create the demo page**

```tsx
"use client";

import React from "react";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";

function MockDashboard() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0D0D14] text-foreground">
      {/* Top nav bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="text-lg font-semibold">Acme Analytics</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Dashboard</span>
          <span>Reports</span>
          <span>Settings</span>
          <Link
            href="/"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            Switch to Full Page AI
          </Link>
        </nav>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard Overview</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Stat cards */}
          {[
            { label: "Total Revenue", value: "$124,500", change: "+12.5%" },
            { label: "Active Users", value: "8,420", change: "+3.2%" },
            { label: "Conversion Rate", value: "4.8%", change: "-0.3%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-background p-6 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.change} vs last month
              </p>
            </div>
          ))}
        </div>

        {/* Placeholder chart area */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-64 rounded-xl border border-border bg-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Revenue Over Time
            </p>
            <div className="mt-4 flex h-40 items-end gap-2">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary/20"
                    style={{ height: `${h}%` }}
                  />
                ),
              )}
            </div>
          </div>
          <div className="h-64 rounded-xl border border-border bg-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              User Activity
            </p>
            <div className="mt-4 space-y-3">
              {["North America", "Europe", "Asia Pacific", "Latin America"].map(
                (region) => (
                  <div key={region} className="flex items-center gap-3">
                    <span className="w-32 text-sm">{region}</span>
                    <div className="h-3 flex-1 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-primary/40"
                        style={{
                          width: `${Math.floor(Math.random() * 60) + 30}%`,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Table placeholder */}
        <div className="mt-6 rounded-xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <p className="font-medium">Recent Transactions</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { name: "Subscription Renewal", amount: "$299", date: "Today" },
              { name: "New Enterprise Plan", amount: "$1,200", date: "Yesterday" },
              { name: "Add-on Purchase", amount: "$49", date: "2 days ago" },
              { name: "Annual License", amount: "$3,600", date: "3 days ago" },
            ].map((tx) => (
              <div
                key={tx.name}
                className="flex items-center justify-between px-6 py-3 text-sm"
              >
                <span>{tx.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{tx.date}</span>
                  <span className="font-medium">{tx.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <React.Suspense fallback={null}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <MockDashboard />
            {/* MiniThread widget will be added here in Task 2 */}
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
```

**Step 2: Verify it renders**

Run: `cd agent-chat-ui && pnpm dev`
Visit: `http://localhost:3000/demo`
Expected: A mock dashboard page with stat cards, charts, a table, and a "Switch to Full Page AI" link in the nav.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/app/demo/page.tsx
git commit -m "feat: add /demo route with mock dashboard for mini chat widget"
```

---

### Task 2: Create MiniThread Shell Component

Create the outer shell of the mini chat widget — the floating container with fixed positioning, the FAB (floating action button) to open/close it, and the framer-motion animation.

**Files:**
- Create: `agent-chat-ui/src/components/mini-thread/index.tsx`
- Modify: `agent-chat-ui/src/app/demo/page.tsx` (add `<MiniThread />`)

**Step 1: Create the MiniThread component**

Create `agent-chat-ui/src/components/mini-thread/index.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MINI_CHAT_WIDTH = 420;
const MINI_CHAT_DEFAULT_HEIGHT = 600;
const MINI_CHAT_MIN_HEIGHT = 400;
const MINI_CHAT_MAX_HEIGHT = 800;
const LS_HEIGHT_KEY = "mini-chat:height";

function getStoredHeight(): number {
  if (typeof window === "undefined") return MINI_CHAT_DEFAULT_HEIGHT;
  const stored = localStorage.getItem(LS_HEIGHT_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed >= MINI_CHAT_MIN_HEIGHT && parsed <= MINI_CHAT_MAX_HEIGHT) {
      return parsed;
    }
  }
  return MINI_CHAT_DEFAULT_HEIGHT;
}

export function MiniThread() {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(MINI_CHAT_DEFAULT_HEIGHT);

  // Load persisted height on mount
  useEffect(() => {
    setHeight(getStoredHeight());
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            initial={{ scale: 0.5, opacity: 0, originX: 1, originY: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
            )}
            style={{
              width: MINI_CHAT_WIDTH,
              height,
            }}
          >
            {/* Header placeholder */}
            <div className="flex h-10 items-center justify-between border-b border-border px-3">
              <span className="text-sm font-medium">Mini Chat</span>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message area placeholder */}
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Messages will render here
            </div>

            {/* Input placeholder */}
            <div className="border-t border-border p-3">
              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Input will render here
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => setIsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Add MiniThread to the demo page**

In `agent-chat-ui/src/app/demo/page.tsx`, add the import and render `<MiniThread />` after `<MockDashboard />`:

```tsx
import { MiniThread } from "@/components/mini-thread";
```

Replace the comment `{/* MiniThread widget will be added here in Task 2 */}` with:
```tsx
<MiniThread />
```

**Step 3: Verify**

Visit: `http://localhost:3000/demo`
Expected: Mock dashboard with a blue circular chat button in the bottom-right. Clicking it animates open a 420×600 chat window shell. Clicking X closes it with a reverse animation.

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/index.tsx agent-chat-ui/src/app/demo/page.tsx
git commit -m "feat: add MiniThread shell component with open/close animation"
```

---

### Task 3: Create Mini Header Component

Extract the header into its own component with sidebar toggle, logo, new-chat button, and close button.

**Files:**
- Create: `agent-chat-ui/src/components/mini-thread/mini-header.tsx`
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

**Step 1: Create mini-header**

Create `agent-chat-ui/src/components/mini-thread/mini-header.tsx`:

```tsx
import { Menu, SquarePen, X } from "lucide-react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { useStreamContext } from "@/providers/Stream";
import { useQueryState } from "nuqs";

interface MiniHeaderProps {
  onClose: () => void;
  onToggleSidebar: () => void;
}

export function MiniHeader({ onClose, onToggleSidebar }: MiniHeaderProps) {
  const stream = useStreamContext();
  const [, setThreadId] = useQueryState("threadId");

  const handleNewThread = () => {
    stream.stop();
    setThreadId(null);
    window.location.reload();
  };

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-2">
      <div className="flex items-center gap-1">
        <TooltipIconButton
          tooltip="History"
          variant="ghost"
          className="h-7 w-7"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </TooltipIconButton>
        <span className="text-sm font-medium">AI Chat</span>
      </div>
      <div className="flex items-center gap-0.5">
        <TooltipIconButton
          tooltip="New chat"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleNewThread}
        >
          <SquarePen className="h-3.5 w-3.5" />
        </TooltipIconButton>
        <TooltipIconButton
          tooltip="Close"
          variant="ghost"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </TooltipIconButton>
      </div>
    </div>
  );
}
```

**Step 2: Use MiniHeader in MiniThread**

In `agent-chat-ui/src/components/mini-thread/index.tsx`, replace the header placeholder div with:

```tsx
import { MiniHeader } from "./mini-header";
```

Replace the header placeholder:
```tsx
{/* Header placeholder */}
<div className="flex h-10 items-center justify-between border-b border-border px-3">
  <span className="text-sm font-medium">Mini Chat</span>
  <button ...>
    <X className="h-4 w-4" />
  </button>
</div>
```
With:
```tsx
<MiniHeader
  onClose={() => setIsOpen(false)}
  onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
/>
```

Add sidebar state to MiniThread:
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);
```

**Step 3: Verify**

Expected: The header now has a hamburger icon (History tooltip), "AI Chat" label, new-chat icon, and close button. All buttons have tooltips on hover.

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/mini-header.tsx agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "feat: add MiniHeader component with sidebar toggle and new chat"
```

---

### Task 4: Wire Up Message Rendering

Connect the MiniThread to the stream context and render messages using the existing `HumanMessage` and `AssistantMessage` components, plus the loading indicator.

**Files:**
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

**Step 1: Add message rendering**

Replace the message area placeholder in MiniThread with the actual message rendering. The key imports to add:

```tsx
import { useRef, useCallback, FormEvent } from "react";
import { useStreamContext } from "@/providers/Stream";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { HumanMessage } from "../thread/messages/human";
import { AssistantMessage, AssistantMessageLoading } from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { getContentString } from "../thread/utils";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { ArrowDown } from "lucide-react";
```

In the MiniThread component body, add these state/refs:

```tsx
const stream = useStreamContext();
const [threadId] = useQueryState("threadId");
const [hideToolCalls] = useQueryState("hideToolCalls", parseAsBoolean.withDefault(true));
const messages = stream.messages;
const isLoading = stream.isLoading;
const messagesContainerRef = useRef<HTMLDivElement>(null);
const scrollToBottomRef = useRef<(() => void) | null>(null);

const chatStarted = !!threadId || !!messages.length;

// Find the last AI message to determine loading state
const lastAiMessage = [...messages].reverse().find((m) => m.type === "ai");
const hasFirstAiToken = !!lastAiMessage && getContentString(lastAiMessage.content).trim().length > 0;

// Regenerate handler for AI messages
const handleRegenerate = useCallback(
  (parentCheckpoint: Checkpoint | null | undefined) => {
    if (!parentCheckpoint) return;
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  },
  [stream],
);
```

Add a `ScrollToBottomButton` sub-component inside the file:

```tsx
function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  if (isAtBottom) return null;
  return (
    <button
      onClick={() => scrollToBottom()}
      className="absolute bottom-2 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-muted transition-colors"
    >
      <ArrowDown className="h-3.5 w-3.5" />
    </button>
  );
}
```

Replace the message area placeholder with:

```tsx
<StickToBottom className="relative flex-1 overflow-hidden" resize="smooth" initial="smooth">
  <StickToBottom.Content
    className="absolute inset-0 overflow-y-auto px-3 [scrollbar-gutter:stable]"
    contentClassName="py-4 flex flex-col gap-3 w-full"
    content={
      <div ref={messagesContainerRef} className="relative">
        {!chatStarted && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">How can I help you?</p>
          </div>
        )}

        {messages
          .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
          .map((message) =>
            message.type === "human" ? (
              <HumanMessage
                key={message.id}
                message={message}
                isLoading={isLoading}
              />
            ) : message.type === "ai" ? (
              <AssistantMessage
                key={message.id}
                message={message}
                isLoading={isLoading}
                handleRegenerate={handleRegenerate}
              />
            ) : null,
          )}

        {isLoading && !hasFirstAiToken && <AssistantMessageLoading />}
      </div>
    }
    footer={null}
  />
  <ScrollToBottomButton />
</StickToBottom>
```

Note: `StickToBottom.Content` is the named export `StickyToBottomContent` re-exported. Check if the project uses `StickyToBottomContent` or `StickToBottom.Content`. Looking at the imports in `thread/index.tsx`, it destructures `{ StickToBottom }` and uses the child component directly via `use-stick-to-bottom`. Check the exact API — the thread uses a render-prop pattern with `content` and `footer` props. Replicate the same pattern.

**Step 2: Verify**

Visit `/demo`, open the mini chat, configure the API connection if prompted (same as full page). Send a message. Messages should render in the compact window.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "feat: wire up message rendering in MiniThread"
```

---

### Task 5: Create Mini Input Component

Build the compact input area with icons-only toolbar, reusing ContextPopover and ShortcutPopover.

**Files:**
- Create: `agent-chat-ui/src/components/mini-thread/mini-input.tsx`
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

**Step 1: Create mini-input**

Create `agent-chat-ui/src/components/mini-thread/mini-input.tsx`. This component needs the same hooks as the full Thread's input area but renders a compact version.

```tsx
"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { SendHorizontal, LoaderCircle, Lightbulb, XIcon } from "lucide-react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { useContextSelectors } from "@/hooks/use-context-selectors";
import { useTextQuotes } from "@/hooks/use-text-quotes";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { ContextPopover } from "../thread/context-popover";
import { ContextBadges } from "../thread/context-badges";
import { ShortcutPopover } from "../thread/shortcut-popover";
import { ShortcutDialog } from "../thread/shortcut-dialog";
import { QuoteCards } from "../thread/quote-cards";
import { ContentBlocksPreview } from "../thread/ContentBlocksPreview";
import { useArtifactContext } from "../thread/artifact";

interface MiniInputProps {
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  onSubmit: () => void;
  clearSuggestions: () => void;
  scrollToBottom: () => void;
}

export function MiniInput({
  showSuggestions,
  onToggleSuggestions,
  onSubmit: onSubmitCallback,
  clearSuggestions,
  scrollToBottom,
}: MiniInputProps) {
  const stream = useStreamContext();
  const isLoading = stream.isLoading;
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);

  const artifactContext = useArtifactContext();

  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();

  const {
    selections,
    setSelections,
    popoverOpen,
    activeCategory,
    setActiveCategory,
    triggerSource,
    toggleItem,
    removeItem,
    resetSelections,
    hasSelections: hasContextSelections,
    toMetadata: contextToMetadata,
    openPopover: openContextPopover,
    closePopover: closeContextPopover,
  } = useContextSelectors();

  const {
    quotes,
    addQuote,
    updateQuote,
    removeQuote,
    clearQuotes,
    hasQuotes,
    toMetadata: quotesToMetadata,
  } = useTextQuotes();

  const {
    shortcuts,
    popoverOpen: shortcutPopoverOpen,
    triggerSource: shortcutTriggerSource,
    dialogOpen: shortcutDialogOpen,
    editingShortcut,
    prefill,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    duplicate: duplicateShortcut,
    openPopover: openShortcutPopover,
    closePopover: closeShortcutPopover,
    openCreateDialog,
    openEditDialog,
    closeDialog: closeShortcutDialog,
  } = useShortcuts();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading) return;

    const contextMeta = contextToMetadata();
    const quotesMeta = quotesToMetadata();
    const combinedMeta = { ...(contextMeta ?? {}), ...(quotesMeta ?? {}) };

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text" as const, text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
      additional_kwargs: Object.keys(combinedMeta).length > 0
        ? { context: combinedMeta }
        : {},
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    const mergedContext = {
      ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
      ...(contextMeta ?? {}),
      ...(quotesMeta ?? {}),
    };
    const context = Object.keys(mergedContext).length > 0 ? mergedContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
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
    scrollToBottom();
    onSubmitCallback();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // @ trigger for context popover
    if (e.key === "@") {
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const textBefore = input.slice(0, pos);
        if (pos === 0 || /\s$/.test(textBefore)) {
          e.preventDefault();
          openContextPopover(undefined, "keyboard");
        }
      }
    }

    // / trigger for shortcut popover
    if (e.key === "/") {
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const textBefore = input.slice(0, pos);
        if (pos === 0 || /\s$/.test(textBefore)) {
          e.preventDefault();
          openShortcutPopover();
        }
      }
    }

    // Enter to submit (no Shift)
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      form?.requestSubmit();
    }
  };

  // Handle shortcut selection — fill input with shortcut text + context
  const handleShortcutSelect = useCallback(
    (shortcut: { text: string; context?: Record<string, string[]> }) => {
      setInput(shortcut.text);
      // If shortcut has context, apply it
      // This replicates the logic from the full Thread
    },
    [],
  );

  return (
    <div className="shrink-0 border-t border-border">
      <div
        ref={(node) => {
          (inputBoxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (dropRef && typeof dropRef === "function") dropRef(node);
          else if (dropRef && typeof dropRef === "object") (dropRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "relative",
          dragOver && "bg-primary/5",
        )}
      >
        <form onSubmit={handleSubmit} className="grid grid-rows-[1fr_auto]">
          <ContentBlocksPreview
            blocks={contentBlocks}
            onRemove={removeBlock}
          />
          <AnimatePresence>
            {hasQuotes && (
              <QuoteCards
                quotes={quotes}
                onUpdate={updateQuote}
                onRemove={removeQuote}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {hasContextSelections && (
              <ContextBadges
                selections={selections}
                onRemove={removeItem}
                className="px-3 pt-2"
              />
            )}
          </AnimatePresence>

          <ContextPopover
            open={popoverOpen && triggerSource === "keyboard"}
            onOpenChange={(open) => !open && closeContextPopover()}
            selections={selections}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onToggle={toggleItem}
            onReset={resetSelections}
            anchorRef={inputBoxRef}
            triggerSource={triggerSource}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="field-sizing-content max-h-32 w-full resize-none border-none bg-transparent px-3 pt-3 pb-0 text-sm text-foreground shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
            />
          </ContextPopover>

          {/* Icons-only toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-2">
            <TooltipIconButton
              tooltip={showSuggestions ? "Hide suggestions" : "Show suggestions"}
              variant="ghost"
              className="h-7 w-7"
              onClick={onToggleSuggestions}
            >
              <Lightbulb className={cn("h-3.5 w-3.5", showSuggestions && "text-primary")} />
            </TooltipIconButton>

            <ShortcutPopover
              open={shortcutPopoverOpen && shortcutTriggerSource === "icon"}
              onOpenChange={(open) => !open && closeShortcutPopover()}
              shortcuts={shortcuts}
              onSelect={(s) => {
                setInput(s.text);
                closeShortcutPopover();
              }}
              onEdit={openEditDialog}
              onCreate={openCreateDialog}
              onDuplicate={duplicateShortcut}
              onDelete={deleteShortcut}
              triggerSource={shortcutTriggerSource}
            >
              <TooltipIconButton
                tooltip="Shortcuts"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => openShortcutPopover("icon")}
              >
                <span className="text-xs font-medium">/</span>
              </TooltipIconButton>
            </ShortcutPopover>

            <ContextPopover
              open={popoverOpen && triggerSource === "icon"}
              onOpenChange={(open) => !open && closeContextPopover()}
              selections={selections}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onToggle={toggleItem}
              onReset={resetSelections}
              triggerSource={triggerSource}
            >
              <TooltipIconButton
                tooltip="Add context"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => openContextPopover(undefined, "icon")}
              >
                <span className="text-xs font-medium">@</span>
              </TooltipIconButton>
            </ContextPopover>

            {/* Submit / Stop button */}
            <div className="ml-auto">
              {isLoading ? (
                <TooltipIconButton
                  tooltip="Stop"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => stream.stop()}
                >
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                </TooltipIconButton>
              ) : (
                <button
                  type="submit"
                  disabled={input.trim().length === 0 && contentBlocks.length === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4586F7] text-white shadow-sm hover:bg-[#3a75e0] disabled:opacity-40 disabled:hover:bg-[#4586F7] transition-colors"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Keyboard-triggered shortcut popover (no visible trigger) */}
          <ShortcutPopover
            open={shortcutPopoverOpen && shortcutTriggerSource === "keyboard"}
            onOpenChange={(open) => !open && closeShortcutPopover()}
            shortcuts={shortcuts}
            onSelect={(s) => {
              setInput(s.text);
              closeShortcutPopover();
            }}
            onEdit={openEditDialog}
            onCreate={openCreateDialog}
            onDuplicate={duplicateShortcut}
            onDelete={deleteShortcut}
            anchorRef={inputBoxRef}
            triggerSource={shortcutTriggerSource}
          />
        </form>
      </div>

      <ShortcutDialog
        open={shortcutDialogOpen}
        onOpenChange={(open) => !open && closeShortcutDialog()}
        shortcut={editingShortcut}
        prefill={prefill}
        onSave={(data) => {
          if (editingShortcut) {
            updateShortcut(editingShortcut.id, data);
          } else {
            addShortcut(data);
          }
          closeShortcutDialog();
        }}
        onDelete={(id) => {
          deleteShortcut(id);
          closeShortcutDialog();
        }}
        allShortcuts={shortcuts}
      />
    </div>
  );
}
```

**Important notes:** The exact prop interfaces for `ContextPopover`, `ShortcutPopover`, `ContentBlocksPreview`, `ContextBadges`, `QuoteCards`, and `ShortcutDialog` must be verified against the actual component signatures in the codebase. The code above is a best approximation — the implementer should read each component's props and adjust as needed. The key pattern is: reuse the exact same components from `thread/`, just in a tighter layout with smaller spacing classes (`px-3` instead of `px-5`, `h-7 w-7` instead of `h-9 w-9`, `text-sm` on the textarea, etc.).

**Step 2: Wire MiniInput into MiniThread**

In `agent-chat-ui/src/components/mini-thread/index.tsx`, replace the input placeholder with `<MiniInput />`. The MiniThread needs to own suggestion state and pass callbacks down:

```tsx
import { MiniInput } from "./mini-input";
import { useSuggestions, INITIAL_SUGGESTIONS } from "@/hooks/use-suggestions";
import { SuggestionCards } from "../thread/suggestion-cards";
```

Add to MiniThread body:

```tsx
const [showSuggestions, setShowSuggestions] = useState(true);
const { suggestions, isFetchingSuggestions, fetchSuggestions, clearSuggestions } = useSuggestions();
```

Render suggestions above the input and swap the input placeholder:

```tsx
{/* Suggestions */}
{showSuggestions && visibleSuggestions.length > 0 && (
  <div className="shrink-0 px-3 pb-2">
    <SuggestionCards
      suggestions={visibleSuggestions}
      onSelect={(text) => {/* set input text and submit */}}
      compact
    />
  </div>
)}

<MiniInput
  showSuggestions={showSuggestions}
  onToggleSuggestions={() => setShowSuggestions((prev) => !prev)}
  onSubmit={() => {}}
  clearSuggestions={clearSuggestions}
  scrollToBottom={() => scrollToBottomRef.current?.()}
/>
```

**Note:** `SuggestionCards` may not have a `compact` prop yet. The implementer should check the component and either add a `compact` variant or render a simpler layout for mini mode (e.g., wrap suggestions in a `flex-wrap gap-1.5` container with `text-xs` pills instead of full cards).

**Step 3: Verify**

Open the mini chat, type a message, send it. The input should work identically to the full page: `@` triggers context popover, `/` triggers shortcuts, Enter submits, suggestions appear after AI responds.

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/mini-input.tsx agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "feat: add MiniInput with icons-only toolbar and full feature parity"
```

---

### Task 6: Create Mini Sidebar (Slide-over Thread History)

Add a slide-over panel that shows thread history, overlaying the message area.

**Files:**
- Create: `agent-chat-ui/src/components/mini-thread/mini-sidebar.tsx`
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

**Step 1: Create mini-sidebar**

Create `agent-chat-ui/src/components/mini-thread/mini-sidebar.tsx`:

```tsx
import { motion, AnimatePresence } from "framer-motion";
import ThreadHistory from "../thread/history";

interface MiniSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MiniSidebar({ open, onClose }: MiniSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-30 bg-black/20"
            onClick={onClose}
          />
          {/* Sidebar panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 z-40 w-64 border-r border-border bg-background shadow-lg"
          >
            <div className="flex h-10 items-center justify-between border-b border-border px-3">
              <span className="text-sm font-medium">History</span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
            <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
              <ThreadHistory collapsed={false} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Add MiniSidebar to MiniThread**

In `agent-chat-ui/src/components/mini-thread/index.tsx`, add inside the chat window `motion.div`, after the header:

```tsx
import { MiniSidebar } from "./mini-sidebar";
```

Render after `<MiniHeader />`:

```tsx
<MiniSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
```

Make sure the parent container has `relative` in its className (it already should from the rounded-2xl container).

**Step 3: Verify**

Click the hamburger icon in the mini header. The sidebar should slide in from the left over the message area with a dimmed backdrop. Click the backdrop or × to close.

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/mini-sidebar.tsx agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "feat: add slide-over thread history sidebar for mini chat"
```

---

### Task 7: Add Vertical Resize

Add a drag handle on the top edge of the mini chat window that allows the user to resize it vertically.

**Files:**
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

**Step 1: Add resize handle and drag logic**

Add a resize handle at the top of the chat window and pointer-event-based drag logic:

```tsx
const [isResizing, setIsResizing] = useState(false);
const resizeStartY = useRef(0);
const resizeStartHeight = useRef(0);

const handleResizeStart = useCallback(
  (e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = height;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  },
  [height],
);

const handleResizeMove = useCallback(
  (e: React.PointerEvent) => {
    if (!isResizing) return;
    // Dragging up increases height (clientY decreases)
    const delta = resizeStartY.current - e.clientY;
    const newHeight = Math.min(
      MINI_CHAT_MAX_HEIGHT,
      Math.max(MINI_CHAT_MIN_HEIGHT, resizeStartHeight.current + delta),
    );
    setHeight(newHeight);
  },
  [isResizing],
);

const handleResizeEnd = useCallback(() => {
  if (!isResizing) return;
  setIsResizing(false);
  localStorage.setItem(LS_HEIGHT_KEY, String(height));
}, [isResizing, height]);
```

Add the resize handle as the first child inside the chat window `motion.div`:

```tsx
{/* Resize handle */}
<div
  onPointerDown={handleResizeStart}
  onPointerMove={handleResizeMove}
  onPointerUp={handleResizeEnd}
  onPointerCancel={handleResizeEnd}
  className="absolute -top-1 left-0 right-0 z-50 flex h-3 cursor-ns-resize items-center justify-center"
>
  <div className="h-1 w-10 rounded-full bg-border opacity-0 transition-opacity hover:opacity-100" />
</div>
```

Make sure the chat window `motion.div` has `position: relative` (add `relative` to className).

**Step 2: Verify**

Hover over the top edge of the mini chat. A small drag handle bar should appear. Drag up to make the window taller, drag down to shrink it. Release and refresh — the height should persist.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "feat: add vertical resize with drag handle for mini chat"
```

---

### Task 8: Add Inline Artifacts

Make artifacts render inline within assistant messages in mini mode, instead of the side panel.

**Files:**
- Modify: `agent-chat-ui/src/components/mini-thread/index.tsx`

**Step 1: Assess artifact rendering**

The artifact panel in the full Thread is controlled by `useArtifactOpen()` and renders `<ArtifactContent />` in a side panel. In mini mode, we need artifacts to render inline.

Check how `ArtifactContent` and `ArtifactTitle` work. If they render via a portal or context, we may need to render them differently. The approach:

1. Wrap the message area with the same `ArtifactProvider` (already done at the page level).
2. When an artifact is triggered in mini mode, instead of opening a side panel, render `<ArtifactContent />` inline after the AI message that triggered it.

The simplest approach: add a collapsible artifact section below the message area that shows the artifact content when active, with a "Close" button.

```tsx
import { useArtifactOpen, ArtifactContent, ArtifactTitle } from "../thread/artifact";

// Inside MiniThread:
const [artifactOpen, setArtifactOpen] = useArtifactOpen();
```

Add after the `StickToBottom` and before `MiniInput`:

```tsx
{/* Inline artifact */}
<AnimatePresence>
  {artifactOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "40%", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="shrink-0 overflow-hidden border-t border-border"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <ArtifactTitle className="truncate text-xs font-medium" />
          <button
            onClick={() => setArtifactOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
        <ArtifactContent className="flex-1 overflow-auto" />
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Note:** The implementer must verify how `useArtifactOpen` works — it may return `[boolean, (open: boolean) => void]` or a different shape. Check `agent-chat-ui/src/components/thread/artifact.tsx` for the exact API.

**Step 2: Verify**

Trigger an artifact (e.g., ask the AI to create a chart). It should expand inline below the messages instead of opening a side panel.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/components/mini-thread/index.tsx
git commit -m "feat: add inline artifact rendering for mini chat"
```

---

### Task 9: Add "Try Mini Mode" Link to Full Page

Add a link in the full-page chat header to navigate to the `/demo` page.

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

**Step 1: Add link to header**

In the header section of the full-page Thread component, add a link to `/demo`. Find the header row (around line ~200-250) and add a `Link` import and button:

```tsx
import Link from "next/link";
```

Add near the other header buttons (before the theme toggle):

```tsx
<Link href="/demo">
  <TooltipIconButton tooltip="Try Mini Mode" variant="ghost" className="h-8 w-8">
    <MessageCircle className="h-4 w-4" />
  </TooltipIconButton>
</Link>
```

Import `MessageCircle` from `lucide-react` (add to existing import).

**Step 2: Verify**

On the full page (`/`), there should be a new icon button in the header that navigates to `/demo`.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat: add 'Try Mini Mode' link to full-page chat header"
```

---

### Task 10: Polish and Integration Testing

Final pass: verify all features work end-to-end, fix any visual issues, and ensure smooth switching between modes.

**Files:**
- Modify: Various files as needed for fixes

**Step 1: End-to-end testing checklist**

Test each of these manually:

1. `/demo` loads with mock dashboard and floating chat button
2. Clicking the button opens mini chat with animation
3. Clicking X closes with reverse animation
4. Messages send and stream correctly in mini chat
5. `@` triggers context popover, selections show as badges
6. `/` triggers shortcut popover, selecting a shortcut fills input
7. Suggestions appear after AI response
8. Lightbulb toggles suggestion visibility
9. Hamburger opens slide-over sidebar with thread history
10. Clicking a thread in sidebar loads that conversation
11. Sidebar backdrop click closes sidebar
12. New chat button creates a new thread
13. Vertical resize works (drag top edge)
14. Resize persists across page refresh
15. Artifacts render inline (if applicable)
16. "Switch to Full Page AI" link navigates to `/`
17. "Try Mini Mode" link on full page navigates to `/demo`
18. Thread started in mini chat appears in full-page thread list
19. Thread started in full page appears in mini chat sidebar
20. Dark mode works correctly in mini chat

**Step 2: Fix any issues found**

Address visual spacing, overflow, z-index, or functionality issues discovered during testing.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: polish mini chat widget and fix integration issues"
```
