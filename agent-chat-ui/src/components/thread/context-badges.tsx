import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { X, Globe, Megaphone, BarChart3, Save, Bookmark, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { cn } from "@/lib/utils";

interface ContextBadgesProps {
  selections: ContextSelections;
  onRemove?: (category: ContextCategory, item: string) => void;
  onClearAll?: () => void;
  onSave?: () => void;
  onSaveAsNew?: () => void;
  activePresetName?: string | null;
  onDeactivatePreset?: () => void;
  onRenameActivePreset?: () => void;
  className?: string;
}

const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
  metrics: <BarChart3 className="h-3 w-3" />,
};

const CATEGORY_COLORS: Record<ContextCategory, string> = {
  countries:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  platforms:
    "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  metrics:
    "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export const ContextBadges: React.FC<ContextBadgesProps> = ({
  selections,
  onRemove,
  onClearAll,
  onSave,
  onSaveAsNew,
  activePresetName,
  onDeactivatePreset,
  onRenameActivePreset,
  className,
}) => {
  const allBadges: { category: ContextCategory; item: string }[] = [];
  for (const category of ["countries", "platforms", "metrics"] as ContextCategory[]) {
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
        {(onSave || onSaveAsNew) && (
          <motion.div
            key="save-preset"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {activePresetName && onSave && onSaveAsNew ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-auto whitespace-nowrap">
                  <DropdownMenuItem onClick={onSave}>
                    <Save className="mr-2 h-3.5 w-3.5" /> Save current preset
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSaveAsNew}>
                    <Bookmark className="mr-2 h-3.5 w-3.5" /> Save as new
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={onSaveAsNew}
                className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="sr-only">Save as preset</span>
              </button>
            )}
          </motion.div>
        )}
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
        {activePresetName && (
          <motion.div
            key="active-preset-tag"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Badge
              variant="outline"
              className="gap-1 rounded-full text-xs font-normal border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300 pr-1"
            >
              <Bookmark className="h-3 w-3" />
              {activePresetName}
              <button
                type="button"
                onClick={onRenameActivePreset}
                className="ml-0.5 rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800/40"
              >
                <Pencil className="h-2.5 w-2.5" />
                <span className="sr-only">Rename preset</span>
              </button>
              <button
                type="button"
                onClick={onDeactivatePreset}
                className="ml-0.5 rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800/40"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Deactivate preset</span>
              </button>
            </Badge>
          </motion.div>
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
