"use client";

import React from "react";
import { MoreVertical, Sparkles, FileText, Search, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIAction = "explain" | "summarize" | "analyze";

export interface WidgetMenuProps {
  onAIAction: (action: AIAction) => void;
  onAddToContext: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Widget Menu Component
// ---------------------------------------------------------------------------

export function WidgetMenu({
  onAIAction,
  onAddToContext,
  className,
}: WidgetMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
          aria-label="Widget options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onAIAction("explain")}>
          <Sparkles className="h-4 w-4" />
          Explain
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAIAction("summarize")}>
          <FileText className="h-4 w-4" />
          Summarize
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAIAction("analyze")}>
          <Search className="h-4 w-4" />
          Analyze
        </DropdownMenuItem>

        <div className="-mx-1 my-1 h-px bg-border" />

        <DropdownMenuItem onClick={onAddToContext}>
          <Plus className="h-4 w-4" />
          Add to context
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
