import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { X, Globe, Megaphone, MapPin, Tag, Building2, Save, Bookmark, Pencil, Monitor, LineChart, Table, Hash } from "lucide-react";
import { CompactBadge } from "@/components/filters/compact-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { FilterCategory, FilterSelections, FILTER_CATEGORIES } from "@/lib/filter-data";
import { usePageWidgets, DashboardWidget } from "@/lib/dashboard-widgets";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

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
  // Filter badges (shown when toggle is ON)
  filterSelections?: FilterSelections;
  onRemoveFilter?: (category: FilterCategory, item: string) => void;
}

const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
  region: <MapPin className="h-3 w-3" />,
  category: <Tag className="h-3 w-3" />,
  brand: <Building2 className="h-3 w-3" />,
  page: <Monitor className="h-3 w-3" />,
};

const WIDGET_TYPE_ICON: Record<DashboardWidget["type"], React.ReactNode> = {
  kpi: <Hash className="h-3 w-3" />,
  chart: <LineChart className="h-3 w-3" />,
  table: <Table className="h-3 w-3" />,
};

const CATEGORY_COLORS: Record<ContextCategory, string> = {
  countries:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  platforms:
    "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  region:
    "border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  category:
    "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  brand:
    "border-transparent bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  page:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const FILTER_BADGE_COLOR = "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";

// Map filter category IDs to display labels
const FILTER_LABEL: Record<FilterCategory, string> = Object.fromEntries(
  FILTER_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<FilterCategory, string>;

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
  filterSelections,
  onRemoveFilter,
}) => {
  const pageWidgets = usePageWidgets();

  const allBadges: { category: ContextCategory; item: string }[] = [];
  for (const category of ["countries", "platforms", "region", "category", "brand", "page"] as ContextCategory[]) {
    for (const item of (selections[category] ?? [])) {
      allBadges.push({ category, item });
    }
  }

  // Count filter badges that aren't already shown via context (avoid duplicates for synced categories)
  const syncedFilterCategories = new Set(["platform", "country", "region", "category", "brand"]);
  const filterBadgeCategories = filterSelections
    ? (Object.entries(filterSelections) as [FilterCategory, string[]][]).filter(
        ([cat, items]) => items.length > 0 && !syncedFilterCategories.has(cat),
      )
    : [];
  const hasFilterBadges = filterBadgeCategories.length > 0;

  if (allBadges.length === 0 && !hasFilterBadges) return null;

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
                    <Save className="mr-2 h-3.5 w-3.5" /> Save current favorite
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSaveAsNew}>
                    <Bookmark className="mr-2 h-3.5 w-3.5" /> Save as new favorite
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
                <span className="sr-only">Save as favorite</span>
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
                <span className="sr-only">Rename favorite</span>
              </button>
              <button
                type="button"
                onClick={onDeactivatePreset}
                className="ml-0.5 rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800/40"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove favorite</span>
              </button>
            </Badge>
          </motion.div>
        )}
        {(["countries", "platforms", "region", "category", "brand", "page"] as ContextCategory[]).map((cat) => {
          const items = selections[cat] ?? [];
          if (items.length === 0) return null;
          const displayItems = cat === "page"
            ? items.map((id) => pageWidgets.find((w) => w.id === id)?.title ?? id)
            : items;
          return (
            <motion.div
              key={cat}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <CompactBadge
                items={displayItems}
                icon={CATEGORY_ICON[cat]}
                colorClass={CATEGORY_COLORS[cat]}
                onRemove={
                  onRemove
                    ? (item) => {
                        const original = cat === "page"
                          ? pageWidgets.find((w) => w.title === item)?.id ?? item
                          : item;
                        onRemove(cat, original);
                      }
                    : undefined
                }
              />
            </motion.div>
          );
        })}
        {/* Filter-only badges (not synced with context) */}
        {filterBadgeCategories.map(([cat, items]) => (
          <motion.div
            key={`filter-${cat}`}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <CompactBadge
              items={items}
              icon={<SlidersHorizontal className="h-3 w-3" />}
              colorClass={FILTER_BADGE_COLOR}
              onRemove={
                onRemoveFilter
                  ? (item) => onRemoveFilter(cat, item)
                  : undefined
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
