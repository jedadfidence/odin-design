import { Button } from "../ui/button";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ThreadHistory from "./history";

interface ChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ collapsed, onToggle }: ChatSidebarProps) {
  return (
    <div
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className={cn(
        "flex items-center p-2",
        collapsed ? "justify-center" : "justify-between",
      )}>
        {!collapsed && (
          <span className="text-sm font-medium text-sidebar-foreground pl-2">History</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ThreadHistory collapsed={collapsed} />
      </div>
    </div>
  );
}
