import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { X, Globe, Megaphone } from "lucide-react";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { cn } from "@/lib/utils";

interface ContextBadgesProps {
  selections: ContextSelections;
  onRemove?: (category: ContextCategory, item: string) => void;
  onClearAll?: () => void;
  className?: string;
}

const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
};

const CATEGORY_COLORS: Record<ContextCategory, string> = {
  countries:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  platforms:
    "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export const ContextBadges: React.FC<ContextBadgesProps> = ({
  selections,
  onRemove,
  onClearAll,
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
        "flex max-h-[80px] flex-wrap items-center gap-1.5 overflow-y-auto px-5 pt-3 pb-0",
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        {onClearAll && allBadges.length > 1 && (
          <motion.button
            key="clear-all"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            type="button"
            onClick={onClearAll}
            className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Clear all</span>
          </motion.button>
        )}
        {allBadges.map(({ category, item }) => (
          <motion.div
            key={`${category}-${item}`}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Badge
              variant="secondary"
              className={cn(
                "gap-1 rounded-full text-xs font-normal",
                onRemove && "pr-1",
                CATEGORY_COLORS[category],
              )}
            >
              {CATEGORY_ICON[category]}
              {item}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(category, item)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {item}</span>
                </button>
              )}
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
