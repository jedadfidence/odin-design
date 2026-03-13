# Settings Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a macOS-style split-pane settings modal with centralized preferences, and promote `AppSidebar` to a shared layout element.

**Architecture:** A new `SettingsProvider` context stores all user preferences in localStorage and exposes them via `useSettings()`. A `SettingsModal` component renders a two-column dialog (category list + content pane) triggered from the AppSidebar user dropdown. Existing scattered toggles in `chat-header`, `chat-input`, and `thread/index` are removed and replaced with reads from `useSettings()`.

**Tech Stack:** React 19, Radix UI Dialog, Tailwind CSS v4, next-themes, localStorage

---

## Chunk 1: Foundation — SettingsProvider and Shared Layout

### Task 1: Create SettingsProvider

**Files:**
- Create: `agent-chat-ui/src/providers/Settings.tsx`

- [ ] **Step 1: Create the SettingsProvider with localStorage persistence**

```tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

export interface Settings {
  navSidebarVisible: boolean;
  chatHistoryVisible: boolean;
  filterSidebarVisible: boolean;
  showToolCalls: boolean;
  showSuggestions: boolean;
  theme: "light" | "dark" | "system";
}

const DEFAULT_SETTINGS: Settings = {
  navSidebarVisible: true,
  chatHistoryVisible: true,
  filterSidebarVisible: true,
  showToolCalls: false,
  showSuggestions: true,
  theme: "system",
};

const STORAGE_KEY = "odin-settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fall through
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { setTheme } = useTheme();

  // Persist to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Sync theme with next-themes
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Keyboard shortcut: Cmd+, (Mac) or Ctrl+, (Windows/Linux) opens settings
  // This ensures settings remain accessible even if the nav sidebar is hidden
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, settingsOpen, openSettings, closeSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify file compiles**

Run: `cd agent-chat-ui && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to Settings.tsx

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/providers/Settings.tsx
git commit -m "feat: add SettingsProvider with localStorage persistence"
```

---

### Task 2: Promote AppSidebar to Root Layout

**Files:**
- Create: `agent-chat-ui/src/app/client-providers.tsx`
- Modify: `agent-chat-ui/src/app/layout.tsx`
- Modify: `agent-chat-ui/src/app/page.tsx` (the main chat page — currently renders AppSidebar + SidebarProvider)
- Modify: `agent-chat-ui/src/app/demo/page.tsx`

- [ ] **Step 1: Create a ClientProviders wrapper and update layout.tsx**

Keep `layout.tsx` as a **server component** to preserve the `export const metadata` static export. Extract all client-side providers into a new `client-providers.tsx` wrapper.

Create `agent-chat-ui/src/app/client-providers.tsx`:

```tsx
"use client";

import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/demo/app-sidebar";
import { SettingsProvider } from "@/providers/Settings";
import { SettingsModal } from "@/components/settings/settings-modal";
import { useSettings } from "@/providers/Settings";

function ConditionalSidebar() {
  const { settings } = useSettings();
  if (!settings.navSidebarVisible) return null;
  return <AppSidebar />;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NuqsAdapter>
        <SettingsProvider>
          <SidebarProvider>
            <ConditionalSidebar />
            <SettingsModal />
            {children}
          </SidebarProvider>
        </SettingsProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
```

Then update `layout.tsx` to use the wrapper (keeping it as a server component with metadata):

```tsx
import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { ClientProviders } from "./client-providers";

export const metadata: Metadata = {
  title: "Agent Chat",
  description: "Agent Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&family=Google+Sans+Code:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

**Important:** `ConditionalSidebar` is defined here so that when `navSidebarVisible` is toggled off, the sidebar disappears. However, this creates a **usability dead-end** — the user can't reopen settings if the sidebar is hidden. To solve this, add a keyboard shortcut (Ctrl/Cmd+,) that opens settings regardless of sidebar visibility. Add this to the `SettingsProvider` (see Task 1 code — add a `useEffect` with a keydown listener for `Cmd+,` / `Ctrl+,` that calls `openSettings()`).

- [ ] **Step 2: Remove SidebarProvider and AppSidebar from page.tsx (main chat page)**

Current page.tsx at lines 8-9 imports `SidebarProvider` and `AppSidebar`, and lines 18-19 and 27 render them. Remove those imports and the wrapping `<SidebarProvider><AppSidebar />...` from the JSX.

The page currently renders:
```tsx
<SidebarProvider>
  <AppSidebar />
  <ThreadProvider>
    <StreamProvider>
      <ArtifactProvider>
        <Thread />
      </ArtifactProvider>
    </StreamProvider>
  </ThreadProvider>
</SidebarProvider>
```

Change to:
```tsx
<ThreadProvider>
  <StreamProvider>
    <ArtifactProvider>
      <Thread />
    </ArtifactProvider>
  </StreamProvider>
</ThreadProvider>
```

Remove the `SidebarProvider` and `AppSidebar` imports.

- [ ] **Step 3: Remove SidebarProvider and AppSidebar from demo/page.tsx**

Current demo/page.tsx at lines 23-24 imports them, and lines 536-537 render them. Remove the imports and the `<SidebarProvider><AppSidebar />...` wrapping from the `DemoPage` component (around lines 536-543).

Change the DemoPage function from:
```tsx
<SidebarProvider>
  <AppSidebar />
  <MockDashboard />
  <DemoFilterSidebar />
</SidebarProvider>
```
To:
```tsx
<>
  <MockDashboard />
  <DemoFilterSidebar />
</>
```

Remove the `SidebarProvider` and `AppSidebar` imports.

- [ ] **Step 4: Verify both pages render with shared sidebar**

Run: `cd agent-chat-ui && npm run build 2>&1 | tail -20`
Expected: Build succeeds. Both `/` and `/demo` should show the AppSidebar from the layout.

- [ ] **Step 5: Commit**

```bash
git add agent-chat-ui/src/app/layout.tsx agent-chat-ui/src/app/client-providers.tsx agent-chat-ui/src/app/page.tsx agent-chat-ui/src/app/demo/page.tsx
git commit -m "feat: promote AppSidebar to shared root layout"
```

---

## Chunk 2: Settings Modal Shell and General Pane

### Task 3: Create the Settings Modal Shell

**Files:**
- Create: `agent-chat-ui/src/components/settings/settings-modal.tsx`

- [ ] **Step 1: Create the split-pane modal component**

This is the macOS-style two-column dialog. Left column has category buttons, right column renders the active pane.

```tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSettings } from "@/providers/Settings";
import { Settings as SettingsIcon, Zap, Bookmark } from "lucide-react";
import { GeneralPane } from "./general-pane";
import { ShortcutsPane } from "./shortcuts-pane";
import { PresetsPane } from "./presets-pane";

type SettingsCategory = "general" | "shortcuts" | "presets";

const CATEGORIES: { id: SettingsCategory; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "shortcuts", label: "Shortcuts", icon: Zap },
  { id: "presets", label: "Presets", icon: Bookmark },
];

export function SettingsModal() {
  const { settingsOpen, closeSettings } = useSettings();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => { if (!open) closeSettings(); }}>
      <DialogContent className="max-w-[700px] h-[500px] p-0 gap-0 flex overflow-hidden">
        {/* Left sidebar */}
        <nav className="w-[180px] shrink-0 border-r border-border bg-surface-deep p-3 flex flex-col gap-1">
          <h2 className="px-2 pb-2 text-sm font-semibold text-foreground">Settings</h2>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left w-full",
                activeCategory === cat.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeCategory === "general" && <GeneralPane />}
          {activeCategory === "shortcuts" && <ShortcutsPane />}
          {activeCategory === "presets" && <PresetsPane />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify file compiles (will fail until panes exist — expected)**

Continue to next task to create panes.

---

### Task 4: Create the General Pane

**Files:**
- Create: `agent-chat-ui/src/components/settings/general-pane.tsx`

- [ ] **Step 1: Create the General settings pane with all toggles**

```tsx
"use client";

import React from "react";
import { useSettings } from "@/providers/Settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-4 first:pt-0 pb-1">
      {title}
    </h3>
  );
}

export function GeneralPane() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-1">
      <SectionHeader title="Appearance" />
      <SettingRow label="Theme" description="Choose your preferred color scheme">
        <Select
          value={settings.theme}
          onValueChange={(val) => updateSetting("theme", val as "light" | "dark" | "system")}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SectionHeader title="Layout" />
      <SettingRow label="Navigation sidebar" description="Show the left navigation menu">
        <Switch
          checked={settings.navSidebarVisible}
          onCheckedChange={(checked) => updateSetting("navSidebarVisible", checked)}
        />
      </SettingRow>
      <SettingRow label="Chat history panel" description="Show the chat history sidebar">
        <Switch
          checked={settings.chatHistoryVisible}
          onCheckedChange={(checked) => updateSetting("chatHistoryVisible", checked)}
        />
      </SettingRow>
      <SettingRow label="Filter sidebar" description="Show the right-side filter panel">
        <Switch
          checked={settings.filterSidebarVisible}
          onCheckedChange={(checked) => updateSetting("filterSidebarVisible", checked)}
        />
      </SettingRow>

      <SectionHeader title="Chat" />
      <SettingRow label="Show tool calls" description="Display tool call details in messages">
        <Switch
          checked={settings.showToolCalls}
          onCheckedChange={(checked) => updateSetting("showToolCalls", checked)}
        />
      </SettingRow>
      <SettingRow label="Show suggestions" description="Display suggestion cards after AI responses">
        <Switch
          checked={settings.showSuggestions}
          onCheckedChange={(checked) => updateSetting("showSuggestions", checked)}
        />
      </SettingRow>
    </div>
  );
}
```

**Note:** This uses a `Select` component. Check if `@/components/ui/select.tsx` exists:

Run: `ls agent-chat-ui/src/components/ui/select.tsx 2>/dev/null || echo "MISSING"`

If MISSING, create `agent-chat-ui/src/components/ui/select.tsx` with a Radix UI Select primitive matching the project's styling conventions (uses `@radix-ui/react-select`). Install the dependency first if needed: `cd agent-chat-ui && npm install @radix-ui/react-select`. Then create the file following the same pattern as the existing `switch.tsx` component — a thin wrapper around the Radix primitive with Tailwind classes using CSS variables.

- [ ] **Step 2: Verify Select component exists, add if needed**

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/components/settings/
git commit -m "feat: add settings modal shell and general pane"
```

---

### Task 5: Create Shortcuts Pane

**Files:**
- Create: `agent-chat-ui/src/components/settings/shortcuts-pane.tsx`

- [ ] **Step 1: Create the Shortcuts pane with inline editing**

This pane uses the existing `useShortcuts` hook. Each shortcut card can be expanded inline for editing.

```tsx
"use client";

import React, { useState } from "react";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Shortcut } from "@/lib/shortcuts";

interface EditingState {
  id: string | "new";
  name: string;
  instructions: string;
}

export function ShortcutsPane() {
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();
  const [editing, setEditing] = useState<EditingState | null>(null);

  const handleStartEdit = (shortcut: Shortcut) => {
    setEditing({
      id: shortcut.id,
      name: shortcut.name,
      instructions: shortcut.instructions,
    });
  };

  const handleStartCreate = () => {
    setEditing({ id: "new", name: "", instructions: "" });
  };

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;
    if (editing.id === "new") {
      addShortcut(editing.name.trim(), editing.instructions, null, null);
    } else {
      updateShortcut(editing.id, {
        name: editing.name.trim(),
        instructions: editing.instructions,
      });
    }
    setEditing(null);
  };

  const handleCancel = () => {
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Shortcuts</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleStartCreate}
          disabled={editing?.id === "new"}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      <div className="space-y-2">
        {/* New shortcut form (at top) */}
        {editing?.id === "new" && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            <Input
              value={editing.name}
              onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              placeholder="Shortcut name"
              autoFocus
            />
            <Textarea
              value={editing.instructions}
              onChange={(e) => setEditing((prev) => prev ? { ...prev, instructions: e.target.value } : prev)}
              placeholder="Enter prompt instructions..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!editing.name.trim()}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Existing shortcuts */}
        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="rounded-lg border border-border">
            {editing?.id === shortcut.id ? (
              /* Inline edit form */
              <div className="p-3 space-y-3">
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Shortcut name"
                  autoFocus
                />
                <Textarea
                  value={editing.instructions}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, instructions: e.target.value } : prev)}
                  placeholder="Enter prompt instructions..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!editing.name.trim()}>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              /* Display mode */
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{shortcut.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {shortcut.instructions}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleStartEdit(shortcut)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteShortcut(shortcut.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {shortcuts.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No shortcuts yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add agent-chat-ui/src/components/settings/shortcuts-pane.tsx
git commit -m "feat: add shortcuts pane with inline editing"
```

---

### Task 6: Create Presets Pane

**Files:**
- Create: `agent-chat-ui/src/components/settings/presets-pane.tsx`

- [ ] **Step 1: Create the Presets pane with inline editing**

Similar structure to shortcuts. Uses `useContextPresets`. Editing is limited to renaming (modifying filter selections requires the filter sidebar flow).

```tsx
"use client";

import React, { useState } from "react";
import { useContextPresets } from "@/hooks/use-context-presets";
import { presetSummary } from "@/lib/context-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";

export function PresetsPane() {
  const { presets, renamePreset, deletePreset } = useContextPresets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSave = () => {
    if (!editingId || !editName.trim()) return;
    renamePreset(editingId, editName.trim());
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Presets</h3>
        <p className="text-xs text-muted-foreground">
          Create presets from the filter sidebar
        </p>
      </div>

      <div className="space-y-2">
        {presets.map((preset) => (
          <div key={preset.id} className="rounded-lg border border-border">
            {editingId === preset.id ? (
              <div className="flex items-center gap-2 p-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Preset name"
                  autoFocus
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" className="h-7 w-7" onClick={handleSave} disabled={!editName.trim()}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {presetSummary(preset)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleStartEdit(preset.id, preset.name)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deletePreset(preset.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {presets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No presets yet. Create one from the filter sidebar by selecting filters and saving.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify all settings components compile**

Run: `cd agent-chat-ui && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors in settings/ files

- [ ] **Step 3: Commit**

```bash
git add agent-chat-ui/src/components/settings/presets-pane.tsx
git commit -m "feat: add presets pane with inline rename"
```

---

## Chunk 3: Wiring — Connect Modal, Remove Old Toggles

### Task 7: Wire Settings Modal into AppSidebar

**Files:**
- Modify: `agent-chat-ui/src/components/demo/app-sidebar.tsx:101-148`
- Modify: `agent-chat-ui/src/app/layout.tsx`

- [ ] **Step 1: Update SidebarUser to trigger settings modal**

In `app-sidebar.tsx`, import `useSettings` and update the Settings dropdown item at line 137-139 to call `openSettings()`:

```tsx
// Add import at top:
import { useSettings } from "@/providers/Settings";

// In SidebarUser function, add:
const { openSettings } = useSettings();

// Change the Settings DropdownMenuItem (line 137-139) from:
<DropdownMenuItem>
  <Settings className="mr-2 size-4" />
  Settings
</DropdownMenuItem>

// To:
<DropdownMenuItem onClick={openSettings}>
  <Settings className="mr-2 size-4" />
  Settings
</DropdownMenuItem>
```

**Note:** `SettingsModal` and `ConditionalSidebar` are already rendered in `client-providers.tsx` (created in Task 2). No additional layout changes needed here.

- [ ] **Step 2: Verify settings modal opens from sidebar**

Run: `cd agent-chat-ui && npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add agent-chat-ui/src/components/demo/app-sidebar.tsx agent-chat-ui/src/app/layout.tsx
git commit -m "feat: wire settings modal to AppSidebar dropdown"
```

---

### Task 8: Replace Scattered Toggles with useSettings

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx:57-76` (remove toggle states)
- Modify: `agent-chat-ui/src/components/thread/index.tsx:336-604` (use settings values)
- Modify: `agent-chat-ui/src/components/thread/chat-header.tsx` (remove toggle buttons)
- Modify: `agent-chat-ui/src/components/thread/chat-input.tsx:330-342` (remove suggestions toggle)
- Modify: `agent-chat-ui/src/components/thread/messages/ai.tsx:113-116` (replace useQueryState with useSettings)
- Modify: `agent-chat-ui/src/app/demo/page.tsx` (wrap DemoFilterSidebar with setting check)

- [ ] **Step 1: Update thread/index.tsx to read from useSettings**

In `thread/index.tsx`:

1. Add import: `import { useSettings } from "@/providers/Settings";`

2. Inside the `Thread` function, add: `const { settings } = useSettings();`

3. Remove/keep these `useQueryState` / `useState` lines (lines 58-76):
   - **KEEP** `sidebarCollapsed` / `setSidebarCollapsed` (lines 58-61) — controls collapse width of chat history sidebar, separate from hiding
   - **KEEP** `chatHistoryOpen` / `setChatHistoryOpen` (lines 62-64) — controls the mobile chat history sheet, not a persistent setting
   - **REMOVE** `hideToolCalls` / `setHideToolCalls` (lines 66-69) — replace reads with `!settings.showToolCalls`
   - **REMOVE** `historyVisible` / `setHistoryVisible` (lines 70-73) — replace with `settings.chatHistoryVisible`
   - **REMOVE** `showSuggestions` / `setShowSuggestions` (line 76) — replace with `settings.showSuggestions`

4. Update JSX references:
   - Line 339: `{historyVisible !== false && (` → `{settings.chatHistoryVisible && (`
   - Line 357-366: Remove `hideToolCalls`, `onToggleToolCalls`, `historyVisible`, `onToggleHistoryVisible` props from ChatHeader. **Keep** `onToggleChatHistory` — it controls the mobile hamburger menu.
   - Line 375: `showSuggestions &&` → `settings.showSuggestions &&`
   - Line 447: `{showSuggestions &&` → `{settings.showSuggestions &&`
   - Lines 532-533: Remove `showSuggestions` and `setShowSuggestions` props from ChatInput

5. Remove `hideToolCalls` and `historyVisible` `useQueryState` imports. Keep `parseAsBoolean` if `sidebarCollapsed` or `chatHistoryOpen` still use it.

- [ ] **Step 2: Simplify ChatHeader — remove toggle buttons**

Update `chat-header.tsx`:

1. Remove from the interface: `hideToolCalls`, `onToggleToolCalls`, `historyVisible`, `onToggleHistoryVisible`
2. Remove the corresponding props from the destructured parameters
3. Remove the `TooltipIconButton` for history toggle (lines 72-79)
4. Remove the `TooltipIconButton` for tool calls toggle (lines 80-87)
5. Remove the `<ThemeToggle />` at line 99 and its import
6. Remove unused imports: `Wrench`, `PanelLeft`, `PanelLeftClose`, `ThemeToggle`

The simplified ChatHeader only keeps: report button, new thread button, minimize button, and mobile menu.

- [ ] **Step 3: Remove suggestions toggle from ChatInput**

In `chat-input.tsx`:

1. Remove from `ChatInputProps` interface (lines 97-98): `showSuggestions` and `setShowSuggestions`
2. Remove from destructured props (lines 158-159)
3. Remove the `TooltipIconButton` for suggestions toggle (lines 330-342) — the Lightbulb button
4. Remove `Lightbulb` from the lucide-react import

- [ ] **Step 4: Update messages/ai.tsx — replace useQueryState with useSettings**

In `agent-chat-ui/src/components/thread/messages/ai.tsx`, the `AssistantMessage` component reads `hideToolCalls` directly from `useQueryState` (lines 113-116). This must be updated to use `useSettings()` instead:

Replace:
```tsx
const [hideToolCalls] = useQueryState(
  "hideToolCalls",
  parseAsBoolean.withDefault(true),
);
```

With:
```tsx
const { settings } = useSettings();
const hideToolCalls = !settings.showToolCalls;
```

Add import: `import { useSettings } from "@/providers/Settings";`
Remove the `useQueryState` and `parseAsBoolean` imports if no longer used in this file.

**Important:** The polarity is inverted — `showToolCalls: false` (default) maps to `hideToolCalls: true` (previous default). This preserves the existing behavior.

- [ ] **Step 5: Update FilterSidebar visibility in thread/index.tsx and demo/page.tsx**

In `thread/index.tsx`, wrap the `<FilterSidebar>` component (lines 558-574) with a settings check:

```tsx
{settings.filterSidebarVisible && (
  <FilterSidebar ... />
)}
```

In `agent-chat-ui/src/app/demo/page.tsx`, wrap the `<DemoFilterSidebar />` (line 539) the same way. Import `useSettings` and read the setting:

```tsx
// In DemoPage function:
const { settings } = useSettings();

// In JSX:
{settings.filterSidebarVisible && <DemoFilterSidebar />}
```

- [ ] **Step 6: Verify build succeeds**

Run: `cd agent-chat-ui && npm run build 2>&1 | tail -30`
Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx agent-chat-ui/src/components/thread/chat-header.tsx agent-chat-ui/src/components/thread/chat-input.tsx agent-chat-ui/src/components/thread/messages/ai.tsx agent-chat-ui/src/app/demo/page.tsx
git commit -m "refactor: replace scattered toggles with centralized useSettings"
```

---

### Task 9: Final Cleanup and Lint

**Files:**
- Possibly: various files with unused imports

- [ ] **Step 1: Run lint and fix**

Run: `cd agent-chat-ui && npm run lint 2>&1 | head -40`

Fix any unused import warnings in the modified files.

- [ ] **Step 2: Run build to verify everything works end-to-end**

Run: `cd agent-chat-ui && npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Manual verification checklist**

Verify these behaviors work:
- AppSidebar appears on both `/` and `/demo` pages
- Clicking Settings in user dropdown opens the modal
- General pane: all toggles work and UI updates live behind the modal
- Shortcuts pane: shows existing shortcuts, inline edit works, create/delete works
- Presets pane: shows existing presets, rename works, delete works
- Toggling "Navigation sidebar" off hides the AppSidebar
- Toggling "Chat history panel" off hides the chat history sidebar
- Toggling "Filter sidebar" off hides the filter panel
- Toggling "Show tool calls" updates message display
- Toggling "Show suggestions" shows/hides suggestion cards
- Theme dropdown changes the theme live
- Settings persist across page refresh (localStorage)

- [ ] **Step 4: Commit any cleanup**

```bash
git add -u
git commit -m "chore: lint cleanup after settings modal integration"
```
