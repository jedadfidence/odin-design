# Odin Chat UI Redesign — Clean & Minimal

**Date**: 2026-02-25
**Status**: Approved

## Decisions

- **Feel**: Clean & minimal (ChatGPT/Claude style)
- **Theme**: System preference default + manual toggle override (sun/moon, 3 states)
- **Messages**: Bubble style — user right-aligned colored bubble, AI left-aligned plain
- **Sidebar**: Collapsible — visible by default, collapses to ~56px icon strip
- **Input**: Floating pill with shadow, centered max-w-3xl
- **Start screen**: Centered logo + greeting + suggestion cards
- **Artifact panel**: Split view (3fr/2fr when chart appears)
- **Header**: Minimal — sidebar toggle + logo left, action icons right
- **Components**: shadcn/ui for all UI components
- **Fonts**: Google Sans Flex (body), Google Sans Code (code/mono)

## Color Palette

Brand primary blues:

| Shade | Hex       | Usage                        |
|-------|-----------|------------------------------|
| 800   | `#1F356F` | Dark navy, primary-hover (light mode) |
| 500   | `#214DA5` | Medium blue, primary (light mode)     |
| 500   | `#4586F7` | Bright blue, primary (dark mode)      |
| 50    | `#D3E4FD` | Light blue, user bubbles (light mode) |
| 50    | `#E4EFFE` | Very light blue, surface-alt          |
| 50    | `#F0F0FF` | Lightest, surface fills               |

### Theme Tokens

| Token            | Light     | Dark      | Usage                          |
|------------------|-----------|-----------|--------------------------------|
| `background`     | `#FFFFFF` | `#111118` | Page background                |
| `surface`        | `#F0F0FF` | `#1A1A2E` | Cards, sidebar, input          |
| `surface-alt`    | `#E4EFFE` | `#1F356F` | Hover states, subtle fills     |
| `primary`        | `#214DA5` | `#4586F7` | Buttons, links, active states  |
| `primary-hover`  | `#1F356F` | `#214DA5` | Button hover                   |
| `primary-light`  | `#D3E4FD` | `#1F356F` | User message bubbles           |
| `foreground`     | `#111118` | `#F0F0FF` | Primary text                   |
| `muted`          | `#6B7280` | `#9CA3AF` | Secondary text                 |
| `border`         | `#E5E7EB` | `#2A2A3E` | Dividers, borders              |

## Layout

```
┌──────────────────────────────────────────────────┐
│ [≡] Logo  Assistant          [report] [+] [🌙]  │  Header (~48px)
├────────┬─────────────────────────┬───────────────┤
│        │                         │               │
│ Sidebar│     Chat messages       │   Artifact    │
│ (240px)│     (max-w-3xl)         │   panel       │
│        │                         │   (hidden     │
│ History│   [user bubble →]       │    until       │
│ items  │   [← ai message]       │    chart)      │
│        │                         │               │
│ [icons │  ┌─────────────────┐    │               │
│  when  │  │ Floating input  │    │               │
│  col-  │  │ pill + shadow   │    │               │
│  lapsed│  └─────────────────┘    │               │
│  ]     │                         │               │
└────────┴─────────────────────────┴───────────────┘
```

- Sidebar: 240px expanded, ~56px collapsed (icons only)
- Chat: centered max-w-3xl, scrollable
- Artifact: hidden default, splits 3fr/2fr on chart
- Mobile: sidebar hidden, hamburger toggle

## Components

### Messages
- User: right-aligned, `primary-light` bubble, rounded-2xl, max-w-80%
- AI: left-aligned, no bubble, plain text on background
- Tool calls: hidden by default, expandable row when toggled

### Sidebar (Collapsible)
- Expanded: thread list with titles + timestamps, active highlight
- Collapsed: icon strip with tooltips
- Toggle: chevron icon at top

### Input (Floating Pill)
- Centered, max-w-3xl, rounded-2xl, shadow-lg
- Surface background color
- Send button: primary color, pill-shaped
- File upload + hide-tool-calls in bottom row
- Loading: send becomes stop/cancel with spinner

### Start Screen
- Upper-third centered: logo + "Assistant"
- 2x2 suggestion card grid below
- Floating input pill at bottom

### Header (~48px)
- Left: sidebar toggle, logo + "Assistant"
- Right: report icon, new thread icon, theme toggle
- Pre-chat: minimal, sidebar toggle only
