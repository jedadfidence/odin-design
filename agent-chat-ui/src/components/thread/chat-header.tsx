import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  FileBarChart,
  SquarePen,
  PanelBottomClose,
  Menu,
} from "lucide-react";

interface ChatHeaderProps {
  chatStarted: boolean;
  onNewThread: () => void;
  onOpenReport: () => void;
  onToggleChatHistory: () => void;
}

export function ChatHeader({
  chatStarted,
  onNewThread,
  onOpenReport,
  onToggleChatHistory,
}: ChatHeaderProps) {
  const searchParams = useSearchParams();

  return (
    <header className="flex h-12 items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleChatHistory}
        >
          <Menu />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        {chatStarted && (
          <>
            <TooltipIconButton
              tooltip="Generate report"
              variant="ghost"
              onClick={onOpenReport}
              data-testid="report-btn"
            >
              <FileBarChart />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="New thread"
              variant="ghost"
              onClick={onNewThread}
            >
              <SquarePen />
            </TooltipIconButton>
          </>
        )}
        <Link
          href={`/demo${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
        >
          <TooltipIconButton
            tooltip="Minimize chat"
            variant="ghost"
            className="h-8 w-8"
          >
            <PanelBottomClose className="h-4 w-4" />
          </TooltipIconButton>
        </Link>
      </div>
    </header>
  );
}
