# Demo Dashboard Left Navigation Sidebar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible left navigation sidebar with icon-only mode to the demo dashboard, replacing the top header bar.

**Architecture:** Use shadcn/ui `Sidebar` component (`collapsible="icon"`) wrapped in `SidebarProvider`. The sidebar gets glassmorphic styling matching existing dashboard cards. A new `AppSidebar` component in `src/components/demo/` encapsulates all sidebar logic.

**Tech Stack:** shadcn/ui Sidebar, Radix UI DropdownMenu, lucide-react icons, Tailwind CSS, Next.js Image

---

### Task 1: Install shadcn Sidebar component

**Files:**
- Modify: `agent-chat-ui/src/components/ui/` (new files added by CLI)

**Step 1: Install the sidebar component**

Run from the `agent-chat-ui` directory:
```bash
cd /Users/jed/Downloads/odin-dev/agent-chat-ui && npx shadcn@latest add sidebar --yes
```

This installs `sidebar.tsx` and any missing dependencies (`scroll-area`, `sheet`, `input`, `skeleton`, `separator` — some already exist).

**Step 2: Verify the installation**

Run: `ls src/components/ui/sidebar.tsx`
Expected: File exists.

**Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "chore: install shadcn sidebar component"
```

---

### Task 2: Create the AppSidebar component

**Files:**
- Create: `agent-chat-ui/src/components/demo/app-sidebar.tsx`

**Step 1: Create the sidebar component file**

Write `agent-chat-ui/src/components/demo/app-sidebar.tsx` with this content:

```tsx
"use client";

import {
  Home,
  FileText,
  Shield,
  Zap,
  FlaskConical,
  TrendingUp,
  BarChart3,
  ClipboardCheck,
  ChevronsUpDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { title: "Home", icon: Home, active: true },
  { title: "Naming Convention", icon: FileText },
  { title: "Brand Safety", icon: Shield },
  { title: "Media Productivity", icon: Zap },
  { title: "Testing", icon: FlaskConical },
  { title: "ROI", icon: TrendingUp },
  { title: "Media Metrics", icon: BarChart3 },
  { title: "QA Workflow", icon: ClipboardCheck },
] as const;

function SidebarLogo() {
  const { open } = useSidebar();

  return (
    <div className="flex items-center gap-2 px-2">
      <div className="relative h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
        <Image
          src="/adfidence-logo.svg"
          alt="Adfidence"
          width={24}
          height={24}
          className="object-contain"
        />
      </div>
      {open && (
        <span className="text-sm font-semibold truncate">Adfidence AI</span>
      )}
    </div>
  );
}

function SidebarUser() {
  const { open } = useSidebar();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              JD
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">John Doe</span>
              <span className="truncate text-xs text-muted-foreground">
                john@acme.com
              </span>
            </div>
          )}
          {open && <ChevronsUpDown className="ml-auto size-4" />}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        side="top"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuItem>
          <User className="mr-2 size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={{
        ["--sidebar-background" as string]: "rgba(255, 255, 255, 0.08)",
      }}
    >
      <SidebarHeader className="p-4">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    tooltip={item.title}
                  >
                    <a href="#">
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator className="mx-2" />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarUser />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

**Step 2: Verify the file compiles**

Run: `cd /Users/jed/Downloads/odin-dev/agent-chat-ui && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `app-sidebar.tsx`.

**Step 3: Commit**

```bash
git add src/components/demo/app-sidebar.tsx
git commit -m "feat: create AppSidebar component for demo dashboard"
```

---

### Task 3: Integrate sidebar into demo page layout

**Files:**
- Modify: `agent-chat-ui/src/app/demo/page.tsx`

**Step 1: Update DemoPage to wrap in SidebarProvider and add AppSidebar**

In `src/app/demo/page.tsx`, make these changes:

1. Add imports at the top:
```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/demo/app-sidebar";
```

2. In `MockDashboard`, remove the entire `<header>` block (lines 60-76 — from `<header className=` through `</header>`).

3. Add a `SidebarTrigger` + title bar at the top of `<main>`, replacing the existing `<h1>`:
```tsx
<main className="flex-1 overflow-auto p-6">
  <div className="mb-6 flex items-center gap-2">
    <SidebarTrigger />
    <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
  </div>
```

4. Remove `max-w-6xl mx-auto` from `<main>` (the sidebar constrains the width now — use `flex-1 overflow-auto` instead).

5. In the `MockDashboard` root div, change the className to include flex layout for sidebar:
```tsx
<div className="flex min-h-screen bg-[#EAECF5] dark:bg-[#0D0D14] text-foreground">
```

6. Wrap `DemoPage` return in `SidebarProvider`:
```tsx
export default function DemoPage() {
  return (
    <React.Suspense fallback={null}>
      <PageWidgetsContext.Provider value={DEMO_WIDGETS}>
        <Toaster />
        <SidebarProvider>
          <AppSidebar />
          <MockDashboard />
        </SidebarProvider>
        <MiniThread />
      </PageWidgetsContext.Provider>
    </React.Suspense>
  );
}
```

Note: `<MiniThread />` stays outside `SidebarProvider` since it's a fixed-position floating overlay.

**Step 2: Verify the page renders**

Run: `cd /Users/jed/Downloads/odin-dev/agent-chat-ui && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No type errors.

Then verify visually by running `npm run dev` and opening `http://localhost:3000/demo`.

**Step 3: Commit**

```bash
git add src/app/demo/page.tsx
git commit -m "feat: integrate sidebar nav into demo dashboard layout"
```

---

### Task 4: Apply glassmorphic styling to sidebar

**Files:**
- Modify: `agent-chat-ui/src/components/demo/app-sidebar.tsx`
- Possibly modify: `agent-chat-ui/src/app/globals.css` (if CSS variable overrides needed)

**Step 1: Style the sidebar with glassmorphic appearance**

The shadcn Sidebar uses CSS variables for theming. We need to override these to get the glassmorphic look. In the `AppSidebar` component, update the `Sidebar` element's `style` prop:

```tsx
<Sidebar
  collapsible="icon"
  className="border-r-0"
  style={{
    ["--sidebar-background" as string]: "rgba(255, 255, 255, 0.08)",
    ["--sidebar-border" as string]: "rgba(245, 249, 255, 0.3)",
  }}
>
```

If the CSS variable approach doesn't work cleanly with the shadcn Sidebar internals, fall back to adding a custom className and overriding in globals.css:

```css
.demo-sidebar [data-sidebar] {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 20px 0 rgba(255, 255, 255, 0.20) inset,
    0 0 0 0.5px rgba(255, 255, 255, 0.20) inset;
}
```

**Step 2: Style nav item active state**

Ensure the active nav item ("Home") has a subtle glassmorphic highlight. The `isActive` prop on `SidebarMenuButton` applies `data-[active=true]` styling. Verify the default shadcn active style looks good; if not, add:

```css
[data-sidebar="menu-button"][data-active="true"] {
  background: rgba(255, 255, 255, 0.15);
}
```

**Step 3: Verify visually**

Run dev server and check:
- Sidebar appears with frosted glass effect
- Active item is visually distinct
- Collapsed mode shows just icons
- Expanded mode shows icons + labels
- User dropdown works at bottom

**Step 4: Commit**

```bash
git add -A
git commit -m "style: apply glassmorphic styling to demo sidebar"
```

---

### Task 5: Final polish and visual QA

**Files:**
- Possibly modify: `agent-chat-ui/src/components/demo/app-sidebar.tsx`
- Possibly modify: `agent-chat-ui/src/app/demo/page.tsx`

**Step 1: Visual QA checklist**

Run dev server (`npm run dev`) and verify at `http://localhost:3000/demo`:

- [ ] Sidebar visible on load (expanded state)
- [ ] Logo displays correctly in header
- [ ] All 8 nav items visible with correct icons
- [ ] "Home" shows as active/selected
- [ ] Clicking SidebarTrigger collapses to icon-only mode
- [ ] Tooltips appear on hover in collapsed mode
- [ ] User profile dropdown at bottom works (opens menu with Profile/Settings/Log out)
- [ ] Avatar shows "JD" fallback in both expanded and collapsed states
- [ ] Dashboard content area fills remaining space
- [ ] MiniThread floating chat still works correctly (not clipped by sidebar)
- [ ] Glassmorphic styling consistent with dashboard cards
- [ ] No horizontal scrollbar or layout overflow

**Step 2: Fix any issues found**

Address any visual or functional issues discovered during QA.

**Step 3: Final commit**

```bash
git add -A
git commit -m "polish: final adjustments to demo sidebar navigation"
```
