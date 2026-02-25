import React from "react";
import { Badge } from "@/components/ui/badge";
import { X, Globe, Megaphone } from "lucide-react";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { cn } from "@/lib/utils";

interface ContextBadgesProps {
  selections: ContextSelections;
  onRemove: (category: ContextCategory, item: string) => void;
  className?: string;
}

const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
};

export const ContextBadges: React.FC<ContextBadgesProps> = ({
  selections,
  onRemove,
  className,
}) => {
  const allBadges: { category: ContextCategory; item: string }[] = [];
  for (const category of ["countries", "platforms"] as ContextCategory[]) {
    for (const item of selections[category]) {
      allBadges.push({ category, item });
    }
  }

  if (allBadges.length === 0) return null;

  return (
    <div
      className={cn(
        "flex max-h-[80px] flex-wrap gap-1.5 overflow-y-auto px-5 pt-3 pb-0",
        className,
      )}
    >
      {allBadges.map(({ category, item }) => (
        <Badge
          key={`${category}-${item}`}
          variant="secondary"
          className="gap-1 pr-1 text-xs font-normal"
        >
          {CATEGORY_ICON[category]}
          {item}
          <button
            type="button"
            onClick={() => onRemove(category, item)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {item}</span>
          </button>
        </Badge>
      ))}
    </div>
  );
};
