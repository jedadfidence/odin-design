# UI Redesign — Clean & Minimal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Odin chat UI to a clean, minimal aesthetic with dark mode, blue brand accents, bubble messages, collapsible sidebar, and floating input pill.

**Architecture:** Tailwind CSS v4 theme tokens for colors, `next-themes` ThemeProvider for dark/light/system toggle, shadcn/ui components throughout. All hardcoded colors replaced with semantic tokens. Layout restructured via CSS grid.

**Tech Stack:** Next.js 15, Tailwind CSS 4, shadcn/ui, next-themes, framer-motion, lucide-react, Google Sans Flex/Code fonts.

**Design doc:** `docs/plans/2026-02-25-ui-redesign-design.md`

---

### Task 1: Color System — Replace CSS Tokens

**Files:**
- Modify: `agent-chat-ui/src/app/globals.css`

**Step 1: Replace the `:root` and `.dark` token blocks**

Replace the existing `:root` color variables with the new brand palette. Replace the `.dark` block with dark mode equivalents. Update the `@theme inline` block to wire new tokens.

```css
:root {
  --background: #FFFFFF;
  --foreground: #111118;
  --card: #FFFFFF;
  --card-foreground: #111118;
  --popover: #FFFFFF;
  --popover-foreground: #111118;
  --primary: #214DA5;
  --primary-foreground: #FFFFFF;
  --primary-hover: #1F356F;
  --primary-light: #D3E4FD;
  --secondary: #F0F0FF;
  --secondary-foreground: #111118;
  --muted: #F0F0FF;
  --muted-foreground: #6B7280;
  --accent: #E4EFFE;
  --accent-foreground: #111118;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #E5E7EB;
  --input: #E5E7EB;
  --ring: #214DA5;
  --surface: #F0F0FF;
  --surface-alt: #E4EFFE;
  --chart-1: #214DA5;
  --chart-2: #4586F7;
  --chart-3: #1F356F;
  --chart-4: #D3E4FD;
  --chart-5: #E4EFFE;
  --radius: 0.625rem;
  --sidebar: #F0F0FF;
  --sidebar-foreground: #111118;
  --sidebar-primary: #214DA5;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E4EFFE;
  --sidebar-accent-foreground: #111118;
  --sidebar-border: #E5E7EB;
  --sidebar-ring: #214DA5;
}

.dark {
  --background: #111118;
  --foreground: #F0F0FF;
  --card: #1A1A2E;
  --card-foreground: #F0F0FF;
  --popover: #1A1A2E;
  --popover-foreground: #F0F0FF;
  --primary: #4586F7;
  --primary-foreground: #FFFFFF;
  --primary-hover: #214DA5;
  --primary-light: #1F356F;
  --secondary: #1A1A2E;
  --secondary-foreground: #F0F0FF;
  --muted: #1A1A2E;
  --muted-foreground: #9CA3AF;
  --accent: #1F356F;
  --accent-foreground: #F0F0FF;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #2A2A3E;
  --input: #2A2A3E;
  --ring: #4586F7;
  --surface: #1A1A2E;
  --surface-alt: #1F356F;
  --chart-1: #4586F7;
  --chart-2: #214DA5;
  --chart-3: #D3E4FD;
  --chart-4: #1F356F;
  --chart-5: #E4EFFE;
  --radius: 0.625rem;
  --sidebar: #1A1A2E;
  --sidebar-foreground: #F0F0FF;
  --sidebar-primary: #4586F7;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #1F356F;
  --sidebar-accent-foreground: #F0F0FF;
  --sidebar-border: #2A2A3E;
  --sidebar-ring: #4586F7;
}
```

Also add `--color-surface` and `--color-surface-alt` to the `@theme inline` block, and add `--color-primary-light` for user bubbles.

**Step 2: Verify the page still renders**

Run: Open http://localhost:3000 in browser.
Expected: Colors should shift to the new blue-based palette.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/app/globals.css
git commit -m "feat(ui): replace color tokens with blue brand palette + dark mode"
```

---

### Task 2: Dark Mode — Wire ThemeProvider + Toggle

**Files:**
- Modify: `agent-chat-ui/src/app/layout.tsx`
- Create: `agent-chat-ui/src/components/ui/theme-toggle.tsx`
- Modify: `agent-chat-ui/src/components/thread/index.tsx` (add toggle to header)

**Step 1: Add ThemeProvider to layout.tsx**

Wrap `<NuqsAdapter>` children with `<ThemeProvider>` from `next-themes`:

```tsx
import { ThemeProvider } from "next-themes";

// In the return:
<body className="font-sans">
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <NuqsAdapter>{children}</NuqsAdapter>
  </ThemeProvider>
</body>
```

**Step 2: Create the theme toggle component**

Use context7 to look up the latest shadcn/ui dropdown-menu docs. Install the dropdown-menu component:

```bash
cd agent-chat-ui && npx shadcn@latest add dropdown-menu
```

Then create `theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 3: Add ThemeToggle to the header in thread/index.tsx**

Import `ThemeToggle` and place it after the "New thread" button in the header actions `div`:

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

// In the header actions div (around line 392-412):
<div className="flex items-center gap-2">
  <TooltipIconButton ... tooltip="Generate report" ... />
  <TooltipIconButton ... tooltip="New thread" ... />
  <ThemeToggle />
</div>
```

Also add `<ThemeToggle />` to the pre-chat header (around line 333-349).

**Step 4: Remove all hardcoded `bg-white`**

Search thread/index.tsx for `bg-white` and replace with `bg-background`:
- Line ~283: sidebar `bg-white` → `bg-background`
- Line ~462: footer `bg-white` → `bg-background`

**Step 5: Verify dark mode works**

Run: Open http://localhost:3000, click the theme toggle, switch between light/dark/system.
Expected: Colors switch properly, no white flashes.

**Step 6: Commit**

```bash
git add agent-chat-ui/src/app/layout.tsx agent-chat-ui/src/components/ui/theme-toggle.tsx agent-chat-ui/src/components/ui/dropdown-menu.tsx agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat(ui): add dark mode with system default + manual toggle"
```

---

### Task 3: Collapsible Sidebar

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`
- Modify: `agent-chat-ui/src/components/thread/history/index.tsx`

**Step 1: Restructure the sidebar layout in thread/index.tsx**

Replace the current `motion.div` overlay sidebar (absolute positioned, 300px) with a flex-based collapsible sidebar:

- Default state: expanded at 240px
- Collapsed state: 56px icon strip
- Toggle: `ChevronsLeft`/`ChevronsRight` icon button at top of sidebar
- Rename `chatHistoryOpen` query param to `sidebarCollapsed` (boolean, default false)
- Use `transition-all duration-300` instead of framer-motion spring for the sidebar width
- Sidebar background: `bg-sidebar` (uses the CSS token)
- Border: `border-r border-sidebar-border`

The outer layout becomes:

```tsx
<div className="flex h-screen w-full overflow-hidden">
  {/* Sidebar — always rendered on lg+, Sheet on mobile */}
  <div
    className={cn(
      "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
      sidebarCollapsed ? "w-14" : "w-60"
    )}
  >
    {/* Toggle button at top */}
    <div className="flex items-center justify-end p-2">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </Button>
    </div>
    {/* Thread history — pass collapsed state */}
    <ThreadHistory collapsed={sidebarCollapsed} />
  </div>

  {/* Main content area */}
  <div className={cn("grid flex-1 ...", artifactOpen && "grid-cols-[3fr_2fr]")}>
    ...
  </div>
</div>
```

**Step 2: Update ThreadHistory to support collapsed mode**

Modify `history/index.tsx` to accept a `collapsed?: boolean` prop:

- When `collapsed=true`: render each thread as a `MessageSquare` icon with a `Tooltip` showing the thread title
- When `collapsed=false`: render current thread list (titles + timestamps)
- Add a "New thread" icon button that works in both states

**Step 3: Remove the framer-motion marginLeft animation from the main chat area**

The main chat `motion.div` currently animates `marginLeft` when the sidebar opens. Since the sidebar is now in the flex flow (not absolute), remove the `animate={{ marginLeft: ... }}` prop. Replace `motion.div` with a plain `div`.

**Step 4: Verify sidebar collapse/expand**

Run: Open http://localhost:3000, verify sidebar is visible at 240px, click collapse, verify it shrinks to 56px with icons, click expand again.
Expected: Smooth transition, thread icons show tooltips when collapsed.

**Step 5: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx agent-chat-ui/src/components/thread/history/index.tsx
git commit -m "feat(ui): collapsible sidebar with icon strip"
```

---

### Task 4: Message Bubbles — User Messages

**Files:**
- Modify: `agent-chat-ui/src/components/thread/messages/human.tsx`

**Step 1: Restyle user messages as right-aligned brand bubbles**

Change the human message container from `bg-muted rounded-3xl` to:

```tsx
<div className="bg-primary-light text-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] shadow-sm">
```

Where `bg-primary-light` maps to `#D3E4FD` (light) / `#1F356F` (dark).

Add `primary-light` to the `@theme inline` block in globals.css:
```css
--color-primary-light: var(--primary-light);
```

The outer flex container should be `justify-end` (right-aligned):

```tsx
<div className="flex w-full justify-end">
  <div className="flex flex-col items-end gap-1 max-w-[80%]">
    {/* bubble */}
    <div className="bg-primary-light text-foreground rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
      {/* message content */}
    </div>
    {/* branch switcher + command bar below, right-aligned */}
  </div>
</div>
```

**Step 2: Verify user message styling**

Run: Open http://localhost:3000, send a message.
Expected: User message appears as a right-aligned blue bubble, dark mode version uses darker blue.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/components/thread/messages/human.tsx agent-chat-ui/src/app/globals.css
git commit -m "feat(ui): right-aligned brand-colored user message bubbles"
```

---

### Task 5: Message Styling — AI Messages

**Files:**
- Modify: `agent-chat-ui/src/components/thread/messages/ai.tsx`

**Step 1: Style AI messages as clean left-aligned text**

AI messages should be left-aligned, no background, with comfortable padding:

```tsx
<div className="flex w-full justify-start">
  <div className="max-w-[85%] py-2">
    {/* markdown content — no background, just clean text on page bg */}
    <MarkdownText ... />
  </div>
</div>
```

**Step 2: Update the loading state bubble**

Change `AssistantMessageLoading` from `bg-muted` to `bg-surface` (maps to `--surface`):

Add `--color-surface` to `@theme inline` if not already done in Task 1.

```tsx
<div className="bg-surface rounded-2xl px-4 py-3">
  {/* animated loading dots */}
</div>
```

**Step 3: Verify AI messages**

Run: Open http://localhost:3000, send a message, observe AI response.
Expected: AI text is plain left-aligned, loading bubble uses surface color.

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/messages/ai.tsx
git commit -m "feat(ui): clean left-aligned AI messages with surface loading state"
```

---

### Task 6: Floating Input Pill

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

**Step 1: Restyle the input area as a floating pill**

Replace the current input container styling (around line 486-580) from:

```tsx
className="bg-muted relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl shadow-xs ..."
```

To:

```tsx
className="bg-surface relative z-10 mx-auto mb-6 w-full max-w-3xl rounded-2xl shadow-lg border border-border ..."
```

**Step 2: Restyle the Send button**

Change the Send button from default variant to use primary color:

```tsx
<Button
  type="submit"
  className="ml-auto bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl shadow-md transition-all"
  disabled={...}
>
  Send
</Button>
```

**Step 3: Update the sticky footer background**

Change the footer wrapper from `bg-white` to `bg-background` (should already be done in Task 2, but double check):

```tsx
<div className="sticky bottom-0 flex flex-col items-center gap-8 bg-background">
```

**Step 4: Verify floating input**

Run: Open http://localhost:3000.
Expected: Input is a floating pill with visible shadow, primary-colored Send button.

**Step 5: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat(ui): floating input pill with shadow and primary send button"
```

---

### Task 7: Header Bar

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

**Step 1: Restructure the header**

Replace both header variants (pre-chat and post-chat) with a single consistent header:

```tsx
<header className="flex h-12 items-center justify-between border-b border-border px-3">
  <div className="flex items-center gap-2">
    {/* Sidebar toggle only shown on mobile (lg:hidden) since desktop sidebar is always visible */}
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={toggleMobileSidebar}
    >
      <Menu className="h-5 w-5" />
    </Button>
    <button onClick={() => setThreadId(null)} className="flex items-center gap-2">
      <img src="/adfidence-logo.svg" alt="Adfidence" className="h-6 w-auto" />
      <span className="text-lg font-semibold tracking-tight">Assistant</span>
    </button>
  </div>
  <div className="flex items-center gap-1">
    <TooltipIconButton tooltip="Generate report" variant="ghost" onClick={() => setReportSheetOpen(true)}>
      <FileBarChart className="h-4 w-4" />
    </TooltipIconButton>
    <TooltipIconButton tooltip="New thread" variant="ghost" onClick={() => setThreadId(null)}>
      <SquarePen className="h-4 w-4" />
    </TooltipIconButton>
    <ThemeToggle />
  </div>
</header>
```

**Step 2: Remove the gradient overlay**

Delete the `from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b` div.

**Step 3: Verify header**

Run: Open http://localhost:3000.
Expected: Clean 48px header with logo left, icons + theme toggle right.

**Step 4: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat(ui): minimal header with theme toggle"
```

---

### Task 8: Replace Hardcoded Brand Colors

**Files:**
- Modify: `agent-chat-ui/src/components/thread/suggestion-cards.tsx`
- Modify: `agent-chat-ui/src/components/thread/report-sheet.tsx`
- Modify: `agent-chat-ui/src/components/thread/messages/tool-calls.tsx`
- Modify: `agent-chat-ui/src/components/ui/button.tsx`

**Step 1: Replace `#2F6868` in suggestion-cards.tsx**

Search for `#2F6868` and replace with `text-primary` / `bg-primary` / `border-primary` as appropriate.

**Step 2: Replace `#2F6868` in report-sheet.tsx**

Same — replace all hardcoded teal with semantic `primary` token classes.

**Step 3: Replace hardcoded grays in tool-calls.tsx**

Replace `bg-gray-50`, `border-gray-200`, `text-gray-900` etc. with semantic tokens:
- `bg-gray-50` → `bg-muted`
- `border-gray-200` → `border-border`
- `text-gray-900` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`

**Step 4: Update the `brand` variant in button.tsx**

Change the `brand` variant from `bg-[#2F6868]` to `bg-primary text-primary-foreground hover:bg-primary-hover`.

**Step 5: Verify all colors are semantic**

Run: Toggle dark mode on http://localhost:3000.
Expected: All elements switch colors properly, no hardcoded white/gray/teal remnants.

**Step 6: Commit**

```bash
git add agent-chat-ui/src/components/thread/suggestion-cards.tsx agent-chat-ui/src/components/thread/report-sheet.tsx agent-chat-ui/src/components/thread/messages/tool-calls.tsx agent-chat-ui/src/components/ui/button.tsx
git commit -m "feat(ui): replace all hardcoded colors with semantic tokens"
```

---

### Task 9: Start Screen

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

**Step 1: Restyle the empty/start state**

The start screen (when `!chatStarted`) should center the logo + "Assistant" in the upper third, with suggestion cards in a 2x2 grid below, and the floating input at the bottom.

Update the `!chatStarted` section:

```tsx
{!chatStarted && (
  <div className="flex flex-col items-center justify-center gap-6 pt-[20vh]">
    <div className="flex items-center gap-3">
      <img src="/adfidence-logo.svg" alt="Adfidence" className="h-10 w-auto" />
      <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
    </div>
    <p className="text-muted-foreground text-sm">How can I help you today?</p>
  </div>
)}
```

Suggestion cards and input pill remain in the footer section (already styled in Tasks 6).

**Step 2: Verify start screen**

Run: Open http://localhost:3000 (no thread selected).
Expected: Centered logo + greeting, suggestion cards below, floating input at bottom.

**Step 3: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat(ui): clean start screen with centered logo and greeting"
```

---

### Task 10: Dark Mode Polish — Markdown & Charts

**Files:**
- Modify: `agent-chat-ui/src/components/thread/markdown-styles.css`
- Modify: `agent-chat-ui/src/components/thread/markdown-text.tsx`
- Modify: `agent-chat-ui/src/components/thread/chart-renderer.tsx`

**Step 1: Update markdown-styles.css for dark mode**

Replace hardcoded colors with CSS variables:

```css
.markdown-content a { color: var(--primary); }
.markdown-content blockquote { border-left: 4px solid var(--border); color: var(--muted-foreground); }
.markdown-content th { background-color: var(--muted); }
.markdown-content tr:nth-child(even) { background-color: var(--surface); }
.markdown-content th, .markdown-content td { border: 1px solid var(--border); }
.markdown-content code:not(pre code) { background-color: var(--surface); }
```

**Step 2: Update markdown-text.tsx inline styles**

Check for any hardcoded hex colors in the React markdown component overrides and replace with Tailwind classes using semantic tokens.

**Step 3: Fix chart-renderer.tsx Polish string**

Replace `"Renderowanie wykresu…"` with `"Rendering chart…"`.

**Step 4: Verify dark mode rendering**

Run: Open http://localhost:3000, trigger an AI response with markdown tables, code blocks, and a chart. Toggle dark mode.
Expected: All markdown elements respect dark mode. Charts render cleanly.

**Step 5: Commit**

```bash
git add agent-chat-ui/src/components/thread/markdown-styles.css agent-chat-ui/src/components/thread/markdown-text.tsx agent-chat-ui/src/components/thread/chart-renderer.tsx
git commit -m "feat(ui): dark mode support for markdown, tables, and charts"
```

---

### Task 11: Final Sweep — Verify Full Integration

**Step 1: Full visual QA checklist**

Open http://localhost:3000 and verify all of these:

- [ ] Start screen: logo centered, greeting, suggestions, floating input
- [ ] Light mode: white background, blue accents, light blue user bubbles
- [ ] Dark mode: dark background, bright blue accents, navy user bubbles
- [ ] System mode: matches OS preference
- [ ] Theme toggle: 3 options work (light/dark/system)
- [ ] Sidebar expanded: 240px, thread list with titles
- [ ] Sidebar collapsed: 56px, icons with tooltips
- [ ] User message: right-aligned blue bubble
- [ ] AI message: left-aligned, clean text, no background
- [ ] Loading state: surface-colored bubble with animated dots
- [ ] Input pill: floating, shadow, primary send button
- [ ] Header: logo left, report + new thread + theme right
- [ ] Suggestions: appear after AI response, semantic colors
- [ ] Report sheet: opens, colors are semantic
- [ ] Tool calls: hidden by default, expandable, dark mode works
- [ ] Artifact panel: splits view when chart appears
- [ ] No hardcoded `#2F6868`, `bg-white`, `bg-gray-*` remnants

**Step 2: Fix any issues found in QA**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(ui): final polish and QA fixes for redesign"
```
