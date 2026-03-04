import React, { useState, useEffect, useRef } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Plus, X, Trash2, Copy } from "lucide-react";
import { Shortcut } from "@/lib/shortcuts";
import { ContextPreset } from "@/lib/context-presets";
import {
  ContextCategory,
  ContextSelections,
  CONTEXT_CATEGORIES,
  EMPTY_SELECTIONS,
} from "@/lib/context-selectors";

// Multi-select dropdown for a single filter category
function FilterSelect({
  category,
  items,
  selected,
  onToggle,
  onRemove,
  container,
}: {
  category: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onRemove: () => void;
  container?: HTMLElement | null;
}) {
  const [open, setOpen] = useState(false);

  const label =
    selected.length === 0
      ? "Select..."
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-sm font-medium">{category}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-8 min-w-0 flex-1 items-center justify-between gap-1 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted truncate"
          >
            <span className="truncate text-left">{label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[240px] p-0"
          align="start"
          container={container}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput placeholder={`Search ${category.toLowerCase()}...`} />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const checked = selected.includes(item);
                  return (
                    <CommandItem
                      key={item}
                      value={item}
                      onSelect={() => onToggle(item)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <span>{item}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcut: Shortcut | null;
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

function getActiveCategories(selections: ContextSelections | null): ContextCategory[] {
  if (!selections) return [];
  return (["countries", "platforms", "metrics"] as ContextCategory[]).filter(
    (c) => selections[c].length > 0,
  );
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
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ContextCategory[]>([]);
  const [context, setContext] = useState<ContextSelections>(EMPTY_SELECTIONS);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (shortcut) {
      setName(shortcut.name);
      setInstructions(shortcut.instructions);
      setContext(shortcut.context ?? { ...EMPTY_SELECTIONS });
      setSelectedPresetId(shortcut.presetId);
      const cats = getActiveCategories(shortcut.context);
      setActiveFilters(cats);
      setAdvancedOpen(cats.length > 0 || !!shortcut.presetId);
    } else if (prefill) {
      setName("");
      setInstructions(prefill.instructions);
      setContext(prefill.context ?? { ...EMPTY_SELECTIONS });
      setSelectedPresetId(null);
      const cats = getActiveCategories(prefill.context);
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
  }, [open, shortcut, prefill]);

  const handleAddFilter = (category: ContextCategory) => {
    if (!activeFilters.includes(category)) {
      setActiveFilters((prev) => [...prev, category]);
    }
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
    setContext({
      countries: [...preset.selections.countries],
      platforms: [...preset.selections.platforms],
      metrics: [...preset.selections.metrics],
      page: [...(preset.selections.page ?? [])],
    });
    const presetCats = getActiveCategories(preset.selections);
    const merged = [...new Set([...activeFilters, ...presetCats])];
    setActiveFilters(merged);
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
      <DialogContent ref={dialogContentRef} className="sm:max-w-[480px]">
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
                {/* Active filter rows */}
                {activeFilters.map((catId) => {
                  const cat = CONTEXT_CATEGORIES.find((c) => c.id === catId);
                  if (!cat) return null;
                  return (
                    <FilterSelect
                      key={catId}
                      category={cat.label}
                      items={cat.items}
                      selected={context[catId]}
                      onToggle={(item) => handleToggleItem(catId, item)}
                      onRemove={() => handleRemoveFilter(catId)}
                      container={dialogContentRef.current}
                    />
                  );
                })}

                {/* Add filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {CONTEXT_CATEGORIES.map((cat) => {
                      const isAdded = activeFilters.includes(cat.id);
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          disabled={isAdded}
                          onClick={() => handleAddFilter(cat.id)}
                        >
                          <span>{cat.label}</span>
                          {isAdded && (
                            <span className="ml-auto text-xs text-muted-foreground">Added</span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Preset picker */}
                {presets.length > 0 && (
                  <div className="border-t border-border/60 pt-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Apply preset
                    </label>
                    <select
                      value={selectedPresetId ?? ""}
                      onChange={(e) => {
                        const preset = presets.find((p) => p.id === e.target.value);
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
                }}
              >
                <Copy className="mr-1 h-3.5 w-3.5" />
                Duplicate
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
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
