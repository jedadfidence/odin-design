import React from "react";
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
import { Globe, Megaphone, ChevronRight, ChevronLeft } from "lucide-react";
import {
  ContextCategory,
  ContextSelections,
  CONTEXT_CATEGORIES,
} from "@/lib/context-selectors";

const CATEGORY_ICONS: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-4 w-4 text-muted-foreground" />,
  platforms: <Megaphone className="h-4 w-4 text-muted-foreground" />,
};

interface ContextPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCategory: ContextCategory | null;
  onCategorySelect: (category: ContextCategory | null) => void;
  selections: ContextSelections;
  onToggleItem: (category: ContextCategory, item: string) => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}

export const ContextPopover: React.FC<ContextPopoverProps> = ({
  open,
  onOpenChange,
  activeCategory,
  onCategorySelect,
  selections,
  onToggleItem,
  children,
  align = "start",
  side = "top",
}) => {
  const activeCategoryConfig = activeCategory
    ? CONTEXT_CATEGORIES.find((c) => c.id === activeCategory)
    : null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0"
        align={align}
        side={side}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          {!activeCategory ? (
            <>
              <CommandInput placeholder="Search context..." />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  {CONTEXT_CATEGORIES.map((cat) => {
                    const count = selections[cat.id].length;
                    return (
                      <CommandItem
                        key={cat.id}
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
              </CommandList>
            </>
          ) : (
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
              />
              <CommandList>
                <CommandEmpty>No items found.</CommandEmpty>
                <CommandGroup>
                  {activeCategoryConfig?.items.map((item) => {
                    const checked = selections[activeCategory].includes(item);
                    return (
                      <CommandItem
                        key={item}
                        onSelect={() => onToggleItem(activeCategory, item)}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={checked}
                          className="pointer-events-none"
                        />
                        <span>{item}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
