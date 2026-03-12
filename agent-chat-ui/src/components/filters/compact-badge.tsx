import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactBadgeProps {
  items: string[];
  colorClass?: string;
  icon?: React.ReactNode;
  onRemove?: (item: string) => void;
  maxVisible?: number;
}

export const CompactBadge: React.FC<CompactBadgeProps> = ({
  items,
  colorClass = "",
  icon,
  onRemove,
  maxVisible = 3,
}) => {
  if (items.length === 0) return null;

  if (items.length <= maxVisible) {
    return (
      <>
        {items.map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className={cn("gap-1 rounded-full text-xs font-normal", onRemove && "pr-1", colorClass)}
          >
            {icon}
            {item}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </>
    );
  }

  const remaining = items.length - 1;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn("gap-1 rounded-full text-xs font-normal cursor-default", colorClass)}
          >
            {icon}
            {items[0]} +{remaining}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px] p-2">
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className={cn(
                  "gap-1 rounded-full text-xs font-normal",
                  onRemove && "pr-1",
                  colorClass,
                )}
              >
                {item}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
