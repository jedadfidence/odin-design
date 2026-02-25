import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TextQuote } from "@/hooks/use-text-quotes";
import { X, TextSelect } from "lucide-react";
import { cn } from "@/lib/utils";

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  const mid = Math.floor(maxLength / 2);
  return text.slice(0, mid).trimEnd() + "..." + text.slice(-mid + 3).trimStart();
}

interface QuoteCardProps {
  quote: TextQuote;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

function QuoteCard({ quote, onUpdate, onRemove }: QuoteCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="group/card flex min-w-0 max-w-[280px] cursor-pointer items-center gap-2 rounded-lg bg-muted/80 px-3 py-2 text-xs transition-colors hover:bg-muted">
          <TextSelect className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight">
              {truncateText(quote.text)}
            </p>
            <p className="text-muted-foreground text-[10px] leading-tight">
              Selected Text
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(quote.id);
            }}
            className="flex-shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted-foreground/20 hover:text-foreground group-hover/card:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Remove quote</span>
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        align="start"
        side="top"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Edit quoted text
          </label>
          <textarea
            value={quote.text}
            onChange={(e) => onUpdate(quote.id, e.target.value)}
            className="field-sizing-content min-h-[60px] max-h-[200px] w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface QuoteCardsProps {
  quotes: TextQuote[];
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export const QuoteCards: React.FC<QuoteCardsProps> = ({
  quotes,
  onUpdate,
  onRemove,
  onClearAll,
  className,
}) => {
  if (quotes.length === 0) return null;

  return (
    <div
      className={cn(
        "flex max-h-[140px] flex-wrap items-center gap-2 overflow-y-auto px-5 pt-3 pb-0",
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        {onClearAll && quotes.length > 1 && (
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
            <span className="sr-only">Clear all quotes</span>
          </motion.button>
        )}
        {quotes.map((quote) => (
          <motion.div
            key={quote.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <QuoteCard
              quote={quote}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
