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

  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ContextCategory[]>([]);
  const [context, setContext] = useState<ContextSelections>(EMPTY_SELECTIONS);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  // Reset form when dialog opens
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
    });
    // Auto-add categories that the preset has values for
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
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
