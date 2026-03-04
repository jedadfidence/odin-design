# Demo Dashboard Left Navigation Panel Design

**Date:** 2026-03-04
**Status:** Approved

## Summary

Add a collapsible left navigation sidebar to the demo dashboard (`/demo`) using the official shadcn/ui Sidebar component. Replaces the existing top header bar. Supports icon-only collapsed mode and full expanded mode with glassmorphic styling.

## Approach

Use shadcn/ui `Sidebar` component (`collapsible="icon"`) with `SidebarProvider`, applying glassmorphic styles to match the existing dashboard aesthetic.

## Layout

```
SidebarProvider (collapsible="icon")
├── Sidebar (glassmorphic, ~240px expanded / ~48px collapsed)
│   ├── SidebarHeader → Logo (adfidence-logo.svg)
│   ├── SidebarContent → SidebarGroup → SidebarMenu
│   │   ├── Home (Home icon) — active/selected
│   │   ├── Naming Convention (FileText icon)
│   │   ├── Brand Safety (Shield icon)
│   │   ├── Media Productivity (Zap icon)
│   │   ├── Testing (FlaskConical icon)
│   │   ├── ROI (TrendingUp icon)
│   │   ├── Media Metrics (BarChart3 icon)
│   │   └── QA Workflow (ClipboardCheck icon)
│   ├── Separator
│   └── SidebarFooter → DropdownMenu (user avatar + name)
│       ├── Profile (dead link)
│       ├── Settings (dead link)
│       └── Log out (dead link)
└── Main Content Area
    ├── Top bar: SidebarTrigger + page title
    └── Existing dashboard widgets (unchanged)
```

## Decisions

- **Sidebar style:** Collapsible with icon-only mode
- **Top header:** Removed entirely; logo moves to sidebar header, collapse trigger in content area
- **Styling:** Glassmorphic (`rgba(255,255,255,0.08)`, inset shadows, `border-[#F5F9FF]`)
- **All nav items:** Dead links (`href="#"`) for now; "Home" styled as active
- **User profile:** `DropdownMenuTrigger` in sidebar footer; shows avatar+name expanded, avatar-only collapsed
- **Logo:** Use `adfidence-logo.svg` from `/public/`

## Components to Install

- `npx shadcn@latest add sidebar` (installs Sidebar + dependencies like `scroll-area`, `sheet`, `input`, `skeleton`)

## Files to Create/Modify

- **Create:** `src/components/demo/app-sidebar.tsx` — the sidebar component
- **Modify:** `src/app/demo/page.tsx` — wrap layout in SidebarProvider, remove header, add SidebarTrigger
