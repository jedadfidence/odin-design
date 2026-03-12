"use client";

import React from "react";
import { MoreVertical, Sparkles, FileText, Search, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIAction = "explain" | "summarize" | "analyze";

export interface WidgetMenuProps {
  onAIAction: (action: AIAction) => void;
  onChatAction: (action: AIAction) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Widget Menu Component
// ---------------------------------------------------------------------------

export function WidgetMenu({
  onAIAction,
  onChatAction,
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Quick insight</DropdownMenuLabel>
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

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Ask AI in chat</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onChatAction("explain")}>
          <MessageCircle className="h-4 w-4" />
          Explain in chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChatAction("summarize")}>
          <MessageCircle className="h-4 w-4" />
          Summarize in chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChatAction("analyze")}>
          <MessageCircle className="h-4 w-4" />
          Analyze in chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
