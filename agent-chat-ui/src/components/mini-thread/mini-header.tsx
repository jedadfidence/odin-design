"use client";

import { Menu, Maximize2, SquarePen, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { useStreamContext } from "@/providers/Stream";
import { useQueryState } from "nuqs";

interface MiniHeaderProps {
  onClose: () => void;
  onToggleSidebar: () => void;
}

export function MiniHeader({ onClose, onToggleSidebar }: MiniHeaderProps) {
  const stream = useStreamContext();
  const [, setThreadId] = useQueryState("threadId");

  const handleNewThread = () => {
    stream.stop();
    setThreadId(null);
  };

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleExpand = () => {
    const params = searchParams.toString();
    router.push(params ? `/?${params}` : "/");
  };

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-2">
      <div className="flex items-center gap-1">
        <TooltipIconButton
          tooltip="History"
          variant="ghost"
          className="h-7 w-7"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </TooltipIconButton>
        <span className="text-sm font-medium">AI Chat</span>
      </div>
      <div className="flex items-center gap-0.5">
        <TooltipIconButton
          tooltip="New chat"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleNewThread}
        >
          <SquarePen className="h-3.5 w-3.5" />
        </TooltipIconButton>
        <TooltipIconButton
          tooltip="Full screen"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleExpand}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </TooltipIconButton>
        <TooltipIconButton
          tooltip="Close"
          variant="ghost"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </TooltipIconButton>
      </div>
    </div>
  );
}
