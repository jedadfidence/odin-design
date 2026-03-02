# Mini Chat Widget Design

**Date:** 2026-03-02
**Status:** Approved

## Overview

Add a compact, floating chat widget (mini chat) that provides near-parity with the existing full-page AI chat experience. The mini chat appears as a button in the bottom-right corner of the host page and expands into a small chat window. Both modes share the same backend, thread history, and provider stack.

## Goals

- Provide a compact chat experience that floats over existing SaaS pages
- Near-parity with full-page features: text, suggestions, context selectors, shortcuts, quotes, inline artifacts
- Shared thread history — conversations started in either mode are accessible from both
- Stakeholder-ready demo with easy switching between full-page and mini modes

## Architecture

### Approach: Separate MiniThread Component

A new `<MiniThread />` component with its own compact layout shell, reusing all existing message components and providers. The existing `<Thread />` stays untouched.

### Component Structure

```
src/components/mini-thread/
  index.tsx          — MiniThread: compact chat shell + open/close state
  mini-header.tsx    — Compact header (sidebar toggle, logo, new chat, close)
  mini-input.tsx     — Compact input area (icons-only toolbar)
  mini-sidebar.tsx   — Slide-over thread history panel
```

### Provider Stack (shared with full-page)

```
<ThreadProvider>
  <StreamProvider>
    <MiniThread />
  </StreamProvider>
</ThreadProvider>
```

### Reused Components

- `HumanMessage`, `AssistantMessage`, `AssistantMessageLoading` — rendered as-is with tighter max-width
- `SuggestionCards` — compact chip layout
- `ContextPopover`, `ShortcutPopover` — reused, popovers portal to body
- `SelectionPopup` — text-quote-to-context
- `QuoteCards`, `ContextBadges`, `ContentBlocksPreview` — in the input area

### Excluded from Mini Mode

- Report sheet
- Config/wrench menu in header

## Layout Design

### Closed State

A floating circular button (48px) fixed to bottom-right (`bottom: 24px; right: 24px`) with logo/chat icon. Click to open.

### Open State

```
┌─────────────────────────────────┐  420px wide, ~600px default height
│  Header (h-10)                  │  resizable vertically (drag top edge)
│  [☰] [Logo] Mini Chat  [+] [×] │  fixed to bottom-right (24px margin)
├─────────────────────────────────┤  rounded-xl, shadow-xl
│                                 │
│  Message scroll area            │
│  ┌─ HumanMessage ────────────┐  │
│  └───────────────────────────┘  │
│  ┌─ AssistantMessage ────────┐  │
│  │  (incl. inline artifacts) │  │
│  └───────────────────────────┘  │
│  ┌─ AssistantMessageLoading ─┐  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─ Suggestion chips ────────┐  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Input area                     │
│  [Context badges] [Quote cards] │
│  [textarea                    ] │
│  [💡] [/] [@]           [Send] │  ← icons only, no text labels
└─────────────────────────────────┘
```

### Sidebar (Slide-over)

Thread history slides in from the left edge of the mini chat window, overlaying the message area. Shows recent threads using the same list component. A backdrop dims the chat behind it.

### Inline Artifacts

Charts/code artifacts render inline within `AssistantMessage`, constrained to container width (~380px usable). A small "Open full view" link jumps to the full-page version.

### Open/Close Animation

Framer-motion scale+fade animation: button morphs into chat window (scale 0.5→1, opacity 0→1, origin: bottom-right). Close reverses. ~200ms duration.

## Demo Setup

### `/demo` Route

`agent-chat-ui/src/app/demo/page.tsx` renders:

1. A **mock host page** — simple fake dashboard (placeholder cards, nav bar, dummy content) to simulate the real SaaS app
2. The **MiniThread widget** floating in the bottom-right
3. A **"Switch to Full Page"** button in the mock nav bar → navigates to `/`

The existing full-page at `/` gets a reciprocal "Try Mini Mode" link → navigates to `/demo`.

Stakeholders can switch between both modes, with shared thread history across both.

## State Management

### Backend Connection

MiniThread reuses the exact same provider stack:
- `StreamProvider` → same LangGraph streaming connection, same `useStream()` hook
- `ThreadProvider` → same thread list fetching
- `useStreamContext()` → messages, submit, branch switching

No new API layer needed.

### Thread Continuity

LangGraph stores threads server-side. The `threadId` URL query param (via `nuqs`) persists across route navigation. Any thread is accessible from either mode.

### Mini-Specific Local State

- `isOpen: boolean` — chat window visibility (starts closed)
- `height: number` — resizable window height, persisted to `localStorage`

All other state (context selections, shortcuts, presets, suggestions) uses the same hooks and localStorage keys.

## Feature Parity Table

| Feature            | Full Page              | Mini Chat              |
|--------------------|------------------------|------------------------|
| Toolbar labels     | Text + icon            | Icons only             |
| Sidebar            | Persistent collapsible | Slide-over overlay     |
| Artifacts          | Side panel             | Inline in messages     |
| Reports            | Sheet overlay          | Not included           |
| Config/wrench menu | Header button          | Not included           |
| Suggestions        | Full-width cards       | Compact chips          |
| Resize             | N/A (full viewport)    | Vertical drag handle   |
| Context selectors  | Full                   | Full (portaled popover)|
| Shortcuts          | Full                   | Full (portaled popover)|
| Quotes             | Full                   | Full                   |
| File uploads       | Full                   | Full                   |
