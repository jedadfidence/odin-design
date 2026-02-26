# Shortcuts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reusable prompt shortcuts that pre-fill the input box with saved text and context filters, triggered via `/` in the textarea.

**Architecture:** New `useShortcuts` hook + `ShortcutPopover` + `ShortcutDialog` components, all following existing patterns (mirrors presets system). Data persisted in localStorage. No backend changes.

**Tech Stack:** React, TypeScript, Radix UI (Dialog, Popover, DropdownMenu), cmdk, framer-motion, Tailwind CSS, lucide-react icons.

**Design doc:** `docs/plans/2026-02-26-shortcuts-design.md`

---

### Task 1: Shortcut Data Layer (`src/lib/shortcuts.ts`)

**Files:**
- Create: `agent-chat-ui/src/lib/shortcuts.ts`

**Step 1: Create the shortcuts data module**

```ts
import { ContextSelections } from "./context-selectors";

export interface Shortcut {
  id: string;
  name: string;
  instructions: string;
  context: ContextSelections | null;
  presetId: string | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "odin-shortcuts";

const DEFAULT_SHORTCUTS: Omit<Shortcut, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Performance Analysis",
    instructions:
      "Analyze the performance of my campaigns. Break down results by key metrics, identify top and bottom performers, and highlight any significant trends or anomalies. Summarize with actionable takeaways.",
    context: null,
    presetId: null,
  },
  {
    name: "Low-Hanging Fruits",
    instructions:
      "Identify quick-win optimization opportunities across my campaigns. Look for underperforming ads with high potential, wasted spend, bid inefficiencies, and targeting gaps that could be fixed with minimal effort for maximum impact.",
    context: null,
    presetId: null,
  },
  {
    name: "Competitor Benchmark",
    instructions:
      "Compare my campaign performance against industry benchmarks and competitive positioning. Highlight where I'm outperforming, where I'm falling behind, and what strategies competitors might be leveraging that I'm not.",
    context: null,
    presetId: null,
  },
  {
    name: "Budget Optimizer",
    instructions:
      "Evaluate my current budget allocation across campaigns and platforms. Recommend how to redistribute spend to maximize ROI. Identify over-funded underperformers and underfunded high-potential campaigns.",
    context: null,
    presetId: null,
  },
  {
    name: "Weekly Digest",
    instructions:
      "Generate a concise weekly summary of my advertising performance. Include week-over-week changes, top highlights, areas of concern, and a prioritized list of recommended actions for the coming week.",
    context: null,
    presetId: null,
  },
];

function generateId(): string {
  return crypto.randomUUID();
}

function makeShortcut(data: Omit<Shortcut, "id" | "createdAt" | "updatedAt">): Shortcut {
  const now = Date.now();
  return { ...data, id: generateId(), createdAt: now, updatedAt: now };
}

export function loadShortcuts(): Shortcut[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed defaults
  }
  // First load — seed defaults
  const defaults = DEFAULT_SHORTCUTS.map(makeShortcut);
  saveShortcuts(defaults);
  return defaults;
}

export function saveShortcuts(shortcuts: Shortcut[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function createShortcut(
  name: string,
  instructions: string,
  context: ContextSelections | null,
  presetId: string | null,
): Shortcut {
  const now = Date.now();
  return { id: generateId(), name, instructions, context, presetId, createdAt: now, updatedAt: now };
}

export function duplicateShortcut(shortcut: Shortcut): Shortcut {
  const now = Date.now();
  return {
    ...shortcut,
    id: generateId(),
    name: `Copy of ${shortcut.name}`,
    context: shortcut.context ? { ...shortcut.context } : null,
    createdAt: now,
    updatedAt: now,
  };
}
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/lib/shortcuts.ts
git commit -m "feat(shortcuts): add data layer with types, defaults, and localStorage persistence"
```

---

### Task 2: Shortcuts Hook (`src/hooks/use-shortcuts.ts`)

**Files:**
- Create: `agent-chat-ui/src/hooks/use-shortcuts.ts`

**Step 1: Create the hook**

This mirrors `use-context-presets.ts` but adds popover state management.

```ts
import { useState, useCallback, useEffect } from "react";
import {
  Shortcut,
  loadShortcuts,
  saveShortcuts,
  createShortcut,
  duplicateShortcut,
} from "@/lib/shortcuts";
import { ContextSelections } from "@/lib/context-selectors";

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => loadShortcuts());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  // Pre-fill data when opening dialog from "save as shortcut" button
  const [prefill, setPrefill] = useState<{
    instructions: string;
    context: ContextSelections | null;
  } | null>(null);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const addShortcut = useCallback(
    (
      name: string,
      instructions: string,
      context: ContextSelections | null,
      presetId: string | null,
    ) => {
      const shortcut = createShortcut(name, instructions, context, presetId);
      setShortcuts((prev) => [...prev, shortcut]);
      return shortcut;
    },
    [],
  );

  const updateShortcut = useCallback(
    (
      id: string,
      updates: Partial<Pick<Shortcut, "name" | "instructions" | "context" | "presetId">>,
    ) => {
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
        ),
      );
    },
    [],
  );

  const deleteShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicate = useCallback((id: string): Shortcut | undefined => {
    let newShortcut: Shortcut | undefined;
    setShortcuts((prev) => {
      const original = prev.find((s) => s.id === id);
      if (!original) return prev;
      newShortcut = duplicateShortcut(original);
      return [...prev, newShortcut];
    });
    return newShortcut;
  }, []);

  const openPopover = useCallback(() => {
    setPopoverOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const openCreateDialog = useCallback(
    (prefillData?: { instructions: string; context: ContextSelections | null }) => {
      setEditingShortcut(null);
      setPrefill(prefillData ?? null);
      setDialogOpen(true);
    },
    [],
  );

  const openEditDialog = useCallback((shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setPrefill(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingShortcut(null);
    setPrefill(null);
  }, []);

  return {
    shortcuts,
    popoverOpen,
    dialogOpen,
    editingShortcut,
    prefill,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    duplicate,
    openPopover,
    closePopover,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };
}
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/hooks/use-shortcuts.ts
git commit -m "feat(shortcuts): add useShortcuts hook with CRUD and dialog state"
```

---

### Task 3: Shortcut Popover (`src/components/thread/shortcut-popover.tsx`)

**Files:**
- Create: `agent-chat-ui/src/components/thread/shortcut-popover.tsx`

**Context:** This mirrors the `ContextPopover` pattern — Radix Popover + cmdk Command. Anchored to the input box via `virtualRef`, opened by `/` key.

**Step 1: Create the popover component**

```tsx
import React, { useState, useCallback } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Zap, Plus, Pencil } from "lucide-react";
import { Shortcut } from "@/lib/shortcuts";

interface ShortcutPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
  onSelectShortcut: (shortcut: Shortcut) => void;
  onEditShortcut: (shortcut: Shortcut) => void;
  onCreateNew: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export const ShortcutPopover: React.FC<ShortcutPopoverProps> = ({
  open,
  onOpenChange,
  shortcuts,
  onSelectShortcut,
  onEditShortcut,
  onCreateNew,
  anchorRef,
}) => {
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(
          "[data-shortcut-popover] [cmdk-input]",
        );
        input?.focus();
      });
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
      <PopoverContent
        data-shortcut-popover
        className="w-[220px] border-border/60 bg-background/80 p-0 shadow-lg backdrop-blur-sm"
        align="start"
        side="top"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          e.stopPropagation();
          handleKeyDown(e);
        }}
      >
        <Command shouldFilter={true} className="bg-transparent">
          <CommandInput
            placeholder="Search shortcuts..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No shortcuts found.</CommandEmpty>
            <CommandGroup>
              {shortcuts.map((shortcut) => (
                <CommandItem
                  key={shortcut.id}
                  value={shortcut.name}
                  onSelect={() => onSelectShortcut(shortcut)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{shortcut.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditShortcut(shortcut);
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value="create-new-shortcut"
                onSelect={onCreateNew}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>Create new shortcut</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/components/thread/shortcut-popover.tsx
git commit -m "feat(shortcuts): add ShortcutPopover with cmdk search and edit icons"
```

---

### Task 4: Shortcut Dialog (`src/components/thread/shortcut-dialog.tsx`)

**Files:**
- Create: `agent-chat-ui/src/components/thread/shortcut-dialog.tsx`

**Context:** Centered Radix Dialog modal. Has name input, instructions textarea, collapsible Advanced section with "Add filter" + preset picker, and Save/Delete/Duplicate footer. This is the largest single component.

**Step 1: Create the dialog component**

The component accepts these props:
- `open` / `onOpenChange` — dialog visibility
- `shortcut` — the shortcut being edited (null = create mode)
- `prefill` — pre-fill data from "save as shortcut" button
- `presets` — list of context presets for the "Apply preset" dropdown
- `onSave(name, instructions, context, presetId)` — save/create callback
- `onSaveAsNew(name, instructions, context, presetId)` — save-as-new callback (edit mode only)
- `onDelete(id)` — delete callback (edit mode only)
- `onDuplicate(id)` — duplicate callback (edit mode only)

```tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Copy,
} from "lucide-react";
import { Shortcut } from "@/lib/shortcuts";
import { ContextPreset } from "@/lib/context-presets";
import {
  ContextCategory,
  ContextSelections,
  CONTEXT_CATEGORIES,
  EMPTY_SELECTIONS,
} from "@/lib/context-selectors";

interface ShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcut: Shortcut | null; // null = create mode
  prefill?: { instructions: string; context: ContextSelections | null } | null;
  presets: ContextPreset[];
  onSave: (
    name: string,
    instructions: string,
    context: ContextSelections | null,
    presetId: string | null,
  ) => void;
  onSaveAsNew: (
    name: string,
    instructions: string,
    context: ContextSelections | null,
    presetId: string | null,
  ) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export const ShortcutDialog: React.FC<ShortcutDialogProps> = ({
  open,
  onOpenChange,
  shortcut,
  prefill,
  presets,
  onSave,
  onSaveAsNew,
  onDelete,
  onDuplicate,
}) => {
  const isEditing = !!shortcut;

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ContextCategory[]>([]);
  const [context, setContext] = useState<ContextSelections>(EMPTY_SELECTIONS);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [addFilterOpen, setAddFilterOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (shortcut) {
      setName(shortcut.name);
      setInstructions(shortcut.instructions);
      setContext(shortcut.context ?? { ...EMPTY_SELECTIONS });
      setSelectedPresetId(shortcut.presetId);
      // Auto-open Advanced and show active filter categories
      const cats: ContextCategory[] = [];
      if (shortcut.context) {
        if (shortcut.context.countries.length > 0) cats.push("countries");
        if (shortcut.context.platforms.length > 0) cats.push("platforms");
        if (shortcut.context.metrics.length > 0) cats.push("metrics");
      }
      setActiveFilters(cats);
      setAdvancedOpen(cats.length > 0 || !!shortcut.presetId);
    } else if (prefill) {
      setName("");
      setInstructions(prefill.instructions);
      setContext(prefill.context ?? { ...EMPTY_SELECTIONS });
      setSelectedPresetId(null);
      const cats: ContextCategory[] = [];
      if (prefill.context) {
        if (prefill.context.countries.length > 0) cats.push("countries");
        if (prefill.context.platforms.length > 0) cats.push("platforms");
        if (prefill.context.metrics.length > 0) cats.push("metrics");
      }
      setActiveFilters(cats);
      setAdvancedOpen(cats.length > 0);
    } else {
      setName("");
      setInstructions("");
      setContext({ ...EMPTY_SELECTIONS });
      setSelectedPresetId(null);
      setActiveFilters([]);
      setAdvancedOpen(false);
    }
    setAddFilterOpen(false);
  }, [open, shortcut, prefill]);

  const handleAddFilter = (category: ContextCategory) => {
    if (!activeFilters.includes(category)) {
      setActiveFilters((prev) => [...prev, category]);
    }
    setAddFilterOpen(false);
  };

  const handleRemoveFilter = (category: ContextCategory) => {
    setActiveFilters((prev) => prev.filter((c) => c !== category));
    setContext((prev) => ({ ...prev, [category]: [] }));
  };

  const handleToggleItem = (category: ContextCategory, item: string) => {
    setContext((prev) => {
      const current = prev[category];
      const next = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [category]: next };
    });
  };

  const handleApplyPreset = (preset: ContextPreset) => {
    setSelectedPresetId(preset.id);
    setContext(preset.selections);
    // Auto-add categories that the preset has values for
    const cats: ContextCategory[] = [...activeFilters];
    if (preset.selections.countries.length > 0 && !cats.includes("countries"))
      cats.push("countries");
    if (preset.selections.platforms.length > 0 && !cats.includes("platforms"))
      cats.push("platforms");
    if (preset.selections.metrics.length > 0 && !cats.includes("metrics"))
      cats.push("metrics");
    setActiveFilters(cats);
  };

  const getContextToSave = (): ContextSelections | null => {
    const hasAny =
      context.countries.length > 0 ||
      context.platforms.length > 0 ||
      context.metrics.length > 0;
    return hasAny ? context : null;
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave(trimmedName, instructions, getContextToSave(), selectedPresetId);
    onOpenChange(false);
  };

  const handleSaveAsNew = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSaveAsNew(trimmedName, instructions, getContextToSave(), selectedPresetId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Shortcut" : "Create Shortcut"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shortcut name"
              autoFocus
              className="mt-1"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="text-sm font-medium">Instructions</label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter your prompt..."
              rows={4}
              className="mt-1 resize-none"
            />
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((p) => !p)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {advancedOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Advanced
            </button>

            {advancedOpen && (
              <div className="mt-3 space-y-3 rounded-md border border-border/60 p-3">
                {/* Add filter button */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddFilterOpen((p) => !p)}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add filter
                  </Button>
                  {addFilterOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-md border border-border bg-background shadow-lg">
                      {CONTEXT_CATEGORIES.map((cat) => {
                        const isAdded = activeFilters.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddFilter(cat.id)}
                            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>{cat.label}</span>
                            {isAdded && (
                              <span className="text-xs text-muted-foreground">Added</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active filter categories */}
                {activeFilters.map((catId) => {
                  const cat = CONTEXT_CATEGORIES.find((c) => c.id === catId);
                  if (!cat) return null;
                  return (
                    <div key={catId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFilter(catId)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map((item) => {
                          const checked = context[catId].includes(item);
                          return (
                            <label
                              key={item}
                              className="flex items-center gap-1.5 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() =>
                                  handleToggleItem(catId, item)
                                }
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Preset picker */}
                {presets.length > 0 && (
                  <div className="border-t border-border/60 pt-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Apply preset
                    </label>
                    <select
                      value={selectedPresetId ?? ""}
                      onChange={(e) => {
                        const preset = presets.find(
                          (p) => p.id === e.target.value,
                        );
                        if (preset) handleApplyPreset(preset);
                      }}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a preset...</option>
                      {presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {/* Left side: Delete + Duplicate (edit mode only) */}
          <div className="flex gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(shortcut!.id);
                  onOpenChange(false);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            {isEditing && onDuplicate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDuplicate(shortcut!.id);
                  onOpenChange(false);
                }}
              >
                <Copy className="mr-1 h-3.5 w-3.5" />
                Duplicate
              </Button>
            )}
          </div>

          {/* Right side: Cancel + Save */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {isEditing ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!name.trim()}>
                    Save
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSave}>
                    Save current shortcut
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveAsNew}>
                    Save as new shortcut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleSave} disabled={!name.trim()}>
                Save Shortcut
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Step 2: Commit**

```bash
git add agent-chat-ui/src/components/thread/shortcut-dialog.tsx
git commit -m "feat(shortcuts): add ShortcutDialog with name, instructions, advanced filters, and split save"
```

---

### Task 5: Wire Everything into Thread (`src/components/thread/index.tsx`)

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx`

**Context:** This is the integration task. We need to:
1. Import and initialize `useShortcuts`
2. Add `/` key handler to the textarea `onKeyDown`
3. Render `ShortcutPopover` (anchored to `inputBoxRef`)
4. Render `ShortcutDialog`
5. Add "Save as shortcut" `Bookmark` icon in the toolbar
6. Wire handler functions for select, edit, create, save, delete, duplicate

**Step 1: Add imports**

At the top of the file, after the existing imports (around line 64), add:

```tsx
import { useShortcuts } from "@/hooks/use-shortcuts";
import { ShortcutPopover } from "./shortcut-popover";
import { ShortcutDialog } from "./shortcut-dialog";
import { Bookmark } from "lucide-react";
```

Note: `Bookmark` is already imported (line 18), so just add the other three imports.

**Step 2: Initialize `useShortcuts` hook**

Inside `Thread()`, after the `useContextPresets()` destructuring (around line 195), add:

```tsx
const {
  shortcuts,
  popoverOpen: shortcutPopoverOpen,
  dialogOpen: shortcutDialogOpen,
  editingShortcut,
  prefill: shortcutPrefill,
  addShortcut,
  updateShortcut,
  deleteShortcut: deleteShortcutFn,
  duplicate: duplicateShortcutFn,
  openPopover: openShortcutPopover,
  closePopover: closeShortcutPopover,
  openCreateDialog: openShortcutCreateDialog,
  openEditDialog: openShortcutEditDialog,
  closeDialog: closeShortcutDialog,
} = useShortcuts();
```

**Step 3: Add handler functions**

After the preset handlers (around line 253), add:

```tsx
const handleSelectShortcut = useCallback(
  (shortcut: import("@/lib/shortcuts").Shortcut) => {
    setInput(shortcut.instructions);
    if (shortcut.context) {
      setContextSelections(shortcut.context);
    }
    closeShortcutPopover();
    requestAnimationFrame(() => textareaRef.current?.focus());
  },
  [setContextSelections, closeShortcutPopover],
);

const handleEditShortcutFromPopover = useCallback(
  (shortcut: import("@/lib/shortcuts").Shortcut) => {
    closeShortcutPopover();
    openShortcutEditDialog(shortcut);
  },
  [closeShortcutPopover, openShortcutEditDialog],
);

const handleCreateShortcutFromPopover = useCallback(() => {
  closeShortcutPopover();
  openShortcutCreateDialog();
}, [closeShortcutPopover, openShortcutCreateDialog]);

const handleSaveShortcut = useCallback(
  (
    name: string,
    instructions: string,
    context: import("@/lib/context-selectors").ContextSelections | null,
    presetId: string | null,
  ) => {
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
  (
    name: string,
    instructions: string,
    context: import("@/lib/context-selectors").ContextSelections | null,
    presetId: string | null,
  ) => {
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
```

**Step 4: Add `/` key handler to textarea `onKeyDown`**

In the textarea's `onKeyDown` handler (around line 901), add the `/` handler after the `@` handler block:

```tsx
if (e.key === "/") {
  const val = (e.target as HTMLTextAreaElement).value;
  const pos = (e.target as HTMLTextAreaElement).selectionStart;
  if (pos === 0 || val[pos - 1] === " " || val[pos - 1] === "\n") {
    e.preventDefault();
    openShortcutPopover();
  }
}
```

**Step 5: Render ShortcutPopover**

Right before the closing `</form>` tag (around line 1095), add:

```tsx
<ShortcutPopover
  open={shortcutPopoverOpen}
  onOpenChange={(open) => {
    if (!open) closeShortcutPopover();
  }}
  shortcuts={shortcuts}
  onSelectShortcut={handleSelectShortcut}
  onEditShortcut={handleEditShortcutFromPopover}
  onCreateNew={handleCreateShortcutFromPopover}
  anchorRef={inputBoxRef}
/>
```

**Step 6: Render ShortcutDialog**

Right after the `<PresetNameDialog>` component (around line after the preset name dialogs), add:

```tsx
<ShortcutDialog
  open={shortcutDialogOpen}
  onOpenChange={(open) => {
    if (!open) closeShortcutDialog();
  }}
  shortcut={editingShortcut}
  prefill={shortcutPrefill}
  presets={presets}
  onSave={handleSaveShortcut}
  onSaveAsNew={handleSaveShortcutAsNew}
  onDelete={deleteShortcutFn}
  onDuplicate={(id) => {
    duplicateShortcutFn(id);
    closeShortcutDialog();
  }}
/>
```

**Step 7: Add "Save as shortcut" icon in toolbar**

In the toolbar row (around line 927, the `<div className="flex items-center gap-6 px-4 py-3">`), add the Bookmark button after the Lightbulb toggle and before the Globe context popover:

```tsx
{input.trim().length > 0 && (
  <TooltipIconButton
    tooltip="Save as shortcut"
    variant="ghost"
    size="sm"
    onClick={handleSaveAsShortcutFromToolbar}
    className="h-8 w-8 text-muted-foreground"
  >
    <Bookmark className="h-4 w-4" />
  </TooltipIconButton>
)}
```

**Step 8: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat(shortcuts): wire popover, dialog, and save button into Thread"
```

---

### Task 6: Manual Testing and Polish

**Files:**
- May modify any of the files created in Tasks 1-5

**Step 1: Run the dev server**

```bash
cd agent-chat-ui && npm run dev
```

**Step 2: Test these scenarios:**

1. **Default shortcuts load** — Open the app, type `/` in the input box. Verify 5 default shortcuts appear.
2. **Select a shortcut** — Click "Performance Analysis". Verify input box fills with the prompt text. Press Enter to send.
3. **Edit a shortcut** — Type `/`, click the pencil icon on any shortcut. Verify dialog opens with pre-filled values. Modify the name, click "Save current shortcut". Reopen `/` popover to verify changes persisted.
4. **Create new shortcut** — Type `/`, click "Create new shortcut". Fill in name + instructions. Click "Save Shortcut". Verify it appears in the list.
5. **Advanced section** — Edit a shortcut, open Advanced, click "Add filter", add Countries, select some countries. Save. Reopen edit — verify selections persisted and Advanced auto-opens.
6. **Apply preset** — In the dialog's Advanced section, select a preset from the dropdown. Verify filter categories auto-populate.
7. **Save as shortcut from toolbar** — Type some text in the input, select some context via `@`. Click the Bookmark icon. Verify dialog opens pre-filled with both text and context.
8. **Duplicate** — Edit a shortcut, click Duplicate. Verify "Copy of ..." appears in the list.
9. **Delete** — Edit a shortcut, click Delete. Verify it's removed.
10. **Save as new** — Edit a shortcut, change the name, use the split save button to "Save as new shortcut". Verify both the original and new one exist.
11. **Search** — Type `/`, then type a partial shortcut name. Verify filtering works.
12. **Keyboard navigation** — Type `/`, use arrow keys to navigate, press Enter to select. Press Escape to close.
13. **Persistence** — Create/edit shortcuts, refresh the page, type `/`. Verify all changes survived.

**Step 3: Fix any issues found during testing**

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(shortcuts): polish from manual testing"
```

---

## Summary of Deliverables

| # | Task | Output |
|---|---|---|
| 1 | Data layer | `src/lib/shortcuts.ts` — types, defaults, localStorage |
| 2 | Hook | `src/hooks/use-shortcuts.ts` — CRUD, state |
| 3 | Popover | `src/components/thread/shortcut-popover.tsx` — `/` trigger UI |
| 4 | Dialog | `src/components/thread/shortcut-dialog.tsx` — create/edit modal |
| 5 | Integration | `src/components/thread/index.tsx` — wiring |
| 6 | Testing | Manual QA of all flows |
