import React, { useState, useCallback } from "react";
import {
  Popover,
  PopoverAnchor,
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
import { Globe, Megaphone, BarChart3, ChevronRight, ChevronLeft } from "lucide-react";
import { Bookmark, MoreHorizontal, Pencil, Copy, Trash2, Type } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextPreset, presetSummary } from "@/lib/context-presets";
import {
  ContextCategory,
  ContextSelections,
  CONTEXT_CATEGORIES,
} from "@/lib/context-selectors";

const CATEGORY_ICONS: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-4 w-4 text-muted-foreground" />,
  platforms: <Megaphone className="h-4 w-4 text-muted-foreground" />,
  metrics: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
};

interface ContextPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCategory: ContextCategory | null;
  onCategorySelect: (category: ContextCategory | null) => void;
  selections: ContextSelections;
  onToggleItem: (category: ContextCategory, item: string) => void;
  children: React.ReactNode;
  anchorRef?: React.RefObject<HTMLElement | null>;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  presets?: ContextPreset[];
  onApplyPreset?: (preset: ContextPreset) => void;
  onEditPreset?: (preset: ContextPreset) => void;
  onDuplicatePreset?: (presetId: string) => void;
  onDeletePreset?: (presetId: string) => void;
  onRenamePreset?: (presetId: string, currentName: string) => void;
  onSavePreset?: () => void;
  hasSelections?: boolean;
  isEditing?: boolean;
}

export const ContextPopover: React.FC<ContextPopoverProps> = ({
  open,
  onOpenChange,
  activeCategory,
  onCategorySelect,
  selections,
  onToggleItem,
  children,
  anchorRef,
  align = "start",
  side = "top",
  presets = [],
  onApplyPreset,
  onEditPreset,
  onDuplicatePreset,
  onDeletePreset,
  onRenamePreset,
  onSavePreset,
  hasSelections = false,
  isEditing = false,
}) => {
  const [search, setSearch] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const activeCategoryConfig = activeCategory
    ? CONTEXT_CATEGORIES.find((c) => c.id === activeCategory)
    : null;

  // Reset search and refocus command input when popover opens/closes or category changes
  React.useEffect(() => {
    setSearch("");
    if (open) {
      // After React renders the new page, move focus to the cmdk input
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>("[cmdk-input]");
        input?.focus();
      });
    }
    if (!open) setShowPresets(false);
  }, [open, activeCategory, showPresets]);

  /** Get the cmdk-highlighted item's value */
  const getSelectedValue = useCallback((): string | null => {
    const el = document.querySelector("[cmdk-item][data-selected=true]");
    return el?.getAttribute("data-value") ?? null;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (!activeCategory && !showPresets && !search) {
          // On category page with no search — drill into highlighted category
          const value = getSelectedValue();
          if (value === "presets-drilldown") {
            e.preventDefault();
            setShowPresets(true);
          } else {
            const cat = CONTEXT_CATEGORIES.find((c) => c.id === value);
            if (cat) {
              e.preventDefault();
              onCategorySelect(cat.id);
            }
          }
        }
        // On items page or search results, ArrowRight does nothing special
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeCategory) {
          // On items page — go back to categories
          onCategorySelect(null);
        } else if (showPresets) {
          // On presets page — go back to categories
          setShowPresets(false);
        } else {
          // On category page — close popover
          onOpenChange(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (activeCategory) {
          // On items page — go back to categories
          onCategorySelect(null);
        } else if (showPresets) {
          // On presets page — go back to categories
          setShowPresets(false);
        } else {
          // On category page — close popover
          onOpenChange(false);
        }
      }
    },
    [activeCategory, showPresets, search, getSelectedValue, onCategorySelect, onOpenChange],
  );

  /** Root page: cross-category search results */
  const renderCrossCategorySearch = () => (
    <>
      {CONTEXT_CATEGORIES.map((cat) => (
        <CommandGroup key={cat.id} heading={cat.label}>
          {cat.items.map((item) => {
            const checked = selections[cat.id].includes(item);
            return (
              <CommandItem
                key={`${cat.id}-${item}`}
                value={`${cat.id}-${item}`}
                onSelect={() => { onToggleItem(cat.id, item); setSearch(""); }}
                className="flex items-center gap-2"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span>{item}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      ))}
    </>
  );

  /** Root page: category list (no search) */
  const renderCategoryList = () => (
    <CommandGroup>
      {CONTEXT_CATEGORIES.map((cat) => {
        const count = selections[cat.id].length;
        return (
          <CommandItem
            key={cat.id}
            value={cat.id}
            onSelect={() => onCategorySelect(cat.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[cat.id]}
              <span>{cat.label}</span>
              {count > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({count})
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CommandItem>
        );
      })}
    </CommandGroup>
  );

  /** Items page: single category with checkboxes */
  const renderItemsList = () => (
    <>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          aria-label="Back to categories"
          className="flex items-center gap-1 rounded px-1 py-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {activeCategoryConfig?.label}
        </span>
      </div>
      <CommandInput
        placeholder={`Search ${activeCategoryConfig?.label?.toLowerCase()}...`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No items found.</CommandEmpty>
        <CommandGroup>
          {activeCategoryConfig?.items.map((item) => {
            const checked = selections[activeCategory!].includes(item);
            return (
              <CommandItem
                key={item}
                value={item}
                onSelect={() => { onToggleItem(activeCategory!, item); setSearch(""); }}
                className="flex items-center gap-2"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span>{item}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </>
  );

  /** Root page: drillable Presets row (only if presets exist or can save) */
  const renderPresetsCategory = () => {
    if (presets.length === 0 && !hasSelections) return null;
    return (
      <CommandGroup>
        <CommandItem
          value="presets-drilldown"
          onSelect={() => setShowPresets(true)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-muted-foreground" />
            <span>Presets</span>
            {presets.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({presets.length})
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CommandItem>
      </CommandGroup>
    );
  };

  /** Presets drill-in page */
  const renderPresetsPage = () => (
    <>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <button
          type="button"
          onClick={() => setShowPresets(false)}
          aria-label="Back to categories"
          className="flex items-center gap-1 rounded px-1 py-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">Presets</span>
      </div>
      <CommandInput
        placeholder="Search presets..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No presets found.</CommandEmpty>
        <CommandGroup>
          {presets.map((preset) => (
            <CommandItem
              key={preset.id}
              value={`preset-${preset.name}`}
              onSelect={() => { onApplyPreset?.(preset); }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <span className="block truncate text-sm">{preset.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {presetSummary(preset)}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right" className="w-36">
                  <DropdownMenuItem onClick={() => onEditPreset?.(preset)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRenamePreset?.(preset.id, preset.name)}>
                    <Type className="mr-2 h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicatePreset?.(preset.id)}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeletePreset?.(preset.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CommandItem>
          ))}
          {hasSelections && !isEditing && (
            <CommandItem
              value="save-current-preset"
              onSelect={() => { onSavePreset?.(); }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Bookmark className="h-4 w-4" />
              <span>Save current as preset</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </>
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {anchorRef ? (
        <>
          <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
          {children}
        </>
      ) : (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      )}
      <PopoverContent
        className="w-[220px] border-border/60 bg-background/80 p-0 shadow-lg backdrop-blur-sm"
        align={align}
        side={side}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          // Prevent all keystrokes from leaking to textarea
          e.stopPropagation();
          handleKeyDown(e);
        }}
      >
        <Command shouldFilter={true} className="bg-transparent">
          {showPresets ? (
            renderPresetsPage()
          ) : !activeCategory ? (
            <>
              <CommandInput
                placeholder="Search context..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {search ? renderCrossCategorySearch() : (
                  <>
                    {renderPresetsCategory()}
                    {renderCategoryList()}
                  </>
                )}
              </CommandList>
            </>
          ) : (
            renderItemsList()
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
