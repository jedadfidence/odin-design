import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { ContextPreset } from "@/lib/context-presets";

interface FilterPresetsProps {
  presets: ContextPreset[];
  onApply: (preset: ContextPreset) => void;
  onDelete: (id: string) => void;
  activePresetName?: string | null;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  onApply,
  onDelete,
  activePresetName,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 w-full rounded-full shadow-none"
        >
          <Bookmark className="h-3.5 w-3.5" />
          {activePresetName ?? "Presets"}
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {presets.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            No saved presets
          </div>
        ) : (
          presets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              className="flex items-center justify-between text-xs"
              onClick={() => onApply(preset)}
            >
              <span className="truncate">{preset.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(preset.id);
                }}
                className="ml-2 rounded p-0.5 hover:bg-muted-foreground/20"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
