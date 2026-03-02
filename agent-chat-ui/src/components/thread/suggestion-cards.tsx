"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionCardsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  loading?: boolean;
  compact?: boolean;
}

const ICONS = [Sparkles, TrendingUp, BarChart3, MessageSquare];

function SuggestionCardsInner({
  suggestions,
  onSelect,
  loading = false,
  compact = false,
}: SuggestionCardsProps) {
  if (!loading && suggestions.length === 0) return null;
  const placeholderCount = 4;
  const placeholders = Array.from({ length: placeholderCount }, (_, i) => i);

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {loading
          ? placeholders.map((i) => (
              <SuggestionPlaceholder key={`compact-placeholder-${i}`} index={i} compact />
            ))
          : suggestions.map((text, i) => (
              <SuggestionCard
                key={text}
                text={text}
                icon={ICONS[i % ICONS.length]}
                onSelect={onSelect}
                compact
              />
            ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2">
      {/* Desktop: 2x2 grid */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-2">
        {loading
          ? placeholders.map((i) => (
              <SuggestionPlaceholder key={`desktop-placeholder-${i}`} index={i} />
            ))
          : suggestions.map((text, i) => (
              <SuggestionCard
                key={text}
                text={text}
                icon={ICONS[i % ICONS.length]}
                onSelect={onSelect}
              />
            ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="flex sm:hidden overflow-x-auto gap-2 snap-x snap-mandatory pb-1 scrollbar-none">
        {loading
          ? placeholders.map((i) => (
              <SuggestionPlaceholder
                key={`mobile-placeholder-${i}`}
                index={i}
                mobile
              />
            ))
          : suggestions.map((text, i) => (
              <SuggestionCard
                key={text}
                text={text}
                icon={ICONS[i % ICONS.length]}
                onSelect={onSelect}
                mobile
              />
            ))}
      </div>
    </div>
  );
}

function SuggestionPlaceholder({
  index,
  mobile,
  compact,
}: {
  index: number;
  mobile?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm",
        "text-left text-card-foreground/70",
        compact ? "gap-2 px-3 py-1.5 text-xs" : "px-4 py-3 text-sm",
        mobile && "min-w-[260px] snap-start flex-shrink-0",
      )}
    >
      <div className={cn("rounded-full bg-primary/30", compact ? "size-3" : "size-4")} />
      <div className="flex items-center">
        <LoadingDots />
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-primary/70"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </span>
  );
}

function SuggestionCard({
  text,
  icon: Icon,
  onSelect,
  mobile,
  compact,
}: {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: (text: string) => void;
  mobile?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      data-testid="suggestion-card"
      onClick={() => onSelect(text)}
      className={cn(
        "group flex items-center rounded-full border border-border/60 bg-background/60",
        "text-left text-card-foreground/90",
        "backdrop-blur-sm transition-all",
        "hover:border-primary/40 hover:bg-primary/5",
        "active:scale-[0.98]",
        "cursor-pointer",
        compact ? "gap-2 px-3 py-1.5 text-xs" : "gap-3 px-4 py-3 text-sm",
        mobile && "min-w-[260px] snap-start flex-shrink-0",
      )}
    >
      <Icon className={cn("flex-shrink-0 text-primary opacity-70 group-hover:opacity-100 transition-opacity", compact ? "size-3" : "size-4")} />
      <span className="truncate">{text}</span>
    </button>
  );
}

export const SuggestionCards = memo(
  SuggestionCardsInner,
  (prev, next) =>
    prev.loading === next.loading &&
    prev.compact === next.compact &&
    prev.suggestions.length === next.suggestions.length &&
    prev.suggestions.every((s, i) => s === next.suggestions[i]),
);
