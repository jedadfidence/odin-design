import React, { useState, useMemo } from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterCategoryProps {
  id: string;
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onSelectAll: (items: string[]) => void;
  onClear: () => void;
}

export const FilterCategory: React.FC<FilterCategoryProps> = ({
  id,
  label,
  items,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}) => {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(
    () =>
      search
        ? items.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
        : items,
    [items, search],
  );

  const summaryText =
    selected.length === 0
      ? null
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected[0]} +${selected.length - 1}`;

  return (
    <AccordionItem value={id} className="border-b-0">
      <AccordionTrigger className="px-3 py-2.5 text-sm font-medium hover:no-underline">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {summaryText && (
            <Badge
              variant="secondary"
              className="rounded-full text-[10px] font-normal px-1.5 py-0"
            >
              {summaryText}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => onSelectAll(filteredItems)}
              className="hover:text-foreground"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onClear}
              className="hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <ScrollArea className={cn(filteredItems.length > 6 && "h-[168px]")}>
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.includes(item)}
                    onCheckedChange={() => onToggle(item)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs">{item}</span>
                </label>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No results
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
