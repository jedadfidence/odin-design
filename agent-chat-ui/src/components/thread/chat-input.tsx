import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  LoaderCircle,
  SendHorizontal,
  Lightbulb,
  Bookmark,
} from "lucide-react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import { ContextBadges } from "./context-badges";
import { ContextPopover } from "./context-popover";
import { QuoteCards } from "./quote-cards";
import { ShortcutPopover } from "./shortcut-popover";
import { toast } from "sonner";
import { ContentBlock } from "@langchain/core/messages";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { ContextPreset } from "@/lib/context-presets";
import { Shortcut } from "@/lib/shortcuts";
import { FilterCategory, FilterSelections } from "@/lib/filter-data";
import { TextQuote } from "@/hooks/use-text-quotes";
import { useStreamContext } from "@/providers/Stream";

export interface ChatInputProps {
  // Input state
  input: string;
  setInput: (val: string) => void;
  chatStarted: boolean;

  // Stream
  stream: ReturnType<typeof useStreamContext>;

  // Filter toggle
  useAsContext: boolean;
  setUseAsContext: (checked: boolean) => void;
  hasFilterSelections: boolean;

  // File upload
  contentBlocks: ContentBlock.Multimodal.Data[];
  removeBlock: (index: number) => void;
  dropRef: React.MutableRefObject<HTMLDivElement | null>;
  dragOver: boolean;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;

  // Quotes
  quotes: TextQuote[];
  updateQuote: (id: string, text: string) => void;
  removeQuote: (id: string) => void;
  clearQuotes: () => void;
  handleScrollToQuoteSource: (quote: { sourceMessageId: string; text: string }) => void;

  // Context
  contextSelections: ContextSelections;
  hasContextSelections: boolean;
  contextPopoverOpen: boolean;
  activeCategory: ContextCategory | null;
  setActiveCategory: (cat: ContextCategory | null) => void;
  triggerSource: "icon" | "keyboard" | null;
  openContextPopover: (cat?: ContextCategory, source?: "icon" | "keyboard") => void;
  closeContextPopover: () => void;
  handleToggleContextItem: (cat: ContextCategory, item: string) => void;
  handleRemoveContextItem: (cat: ContextCategory, item: string) => void;
  handleClearSelections: () => void;

  // Presets
  presets: ContextPreset[];
  presetEditing: { presetId: string; presetName: string } | null;
  handleApplyPreset: (preset: ContextPreset) => void;
  handleEditPreset: (preset: ContextPreset) => void;
  handleDuplicatePreset: (presetId: string) => void;
  deletePreset: (id: string) => void;
  handleRenamePreset: (id: string, name: string) => void;
  handleSavePreset: () => void;
  handleSaveAsNewPreset: () => void;
  handleDeactivatePreset: () => void;

  // Filter badges
  filterSelections?: FilterSelections;
  removeFilterItem?: (cat: FilterCategory, item: string) => void;

  // Shortcuts
  shortcuts: Shortcut[];
  shortcutPopoverOpen: boolean;
  shortcutTriggerSource: "icon" | "keyboard" | null;
  openShortcutPopover: (source?: "icon" | "keyboard") => void;
  closeShortcutPopover: () => void;
  handleSelectShortcut: (shortcut: Shortcut) => void;
  handleEditShortcutFromPopover: (shortcut: Shortcut) => void;
  handleCreateShortcutFromPopover: () => void;
  handleSaveAsShortcutFromToolbar: () => void;

  // Suggestions
  showSuggestions: boolean;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;

  // Form
  handleSubmit: (e: React.FormEvent) => void;

  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  inputBoxRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function ChatInput({
  input,
  setInput,
  chatStarted,
  stream,
  useAsContext,
  setUseAsContext,
  hasFilterSelections,
  contentBlocks,
  removeBlock,
  dropRef,
  dragOver,
  handlePaste,
  quotes,
  updateQuote,
  removeQuote,
  clearQuotes,
  handleScrollToQuoteSource,
  contextSelections,
  hasContextSelections,
  contextPopoverOpen,
  activeCategory,
  setActiveCategory,
  triggerSource,
  openContextPopover,
  closeContextPopover,
  handleToggleContextItem,
  handleRemoveContextItem,
  handleClearSelections,
  presets,
  presetEditing,
  handleApplyPreset,
  handleEditPreset,
  handleDuplicatePreset,
  deletePreset,
  handleRenamePreset,
  handleSavePreset,
  handleSaveAsNewPreset,
  handleDeactivatePreset,
  filterSelections,
  removeFilterItem,
  shortcuts,
  shortcutPopoverOpen,
  shortcutTriggerSource,
  openShortcutPopover,
  closeShortcutPopover,
  handleSelectShortcut,
  handleEditShortcutFromPopover,
  handleCreateShortcutFromPopover,
  handleSaveAsShortcutFromToolbar,
  showSuggestions,
  setShowSuggestions,
  handleSubmit,
  textareaRef,
  inputBoxRef,
}: ChatInputProps) {
  const isLoading = stream.isLoading;

  return (
    <div
      className={cn(
        "relative mx-auto mb-6 w-full max-w-[816px]",
        !chatStarted && "input-glow-wrapper",
      )}
    >
      <div className="flex items-center gap-2.5 rounded-t-2xl border border-b-0 border-border bg-background/60 backdrop-blur-sm px-4 py-2">
        <Switch
          id="use-filters"
          checked={useAsContext}
          onCheckedChange={(checked) => {
            setUseAsContext(checked);
            toast(
              checked
                ? "AI will now use your selected filters as context"
                : "AI will no longer use your filters",
            );
          }}
          className="scale-[0.85]"
        />
        <Label htmlFor="use-filters" className="text-xs text-muted-foreground cursor-pointer select-none">
          Include filters with your conversation
        </Label>
        {useAsContext && !hasFilterSelections && (
          <span className="text-[11px] text-muted-foreground/60">
            — select filters in the panel
          </span>
        )}
      </div>
      <div
        ref={(el) => {
          dropRef.current = el;
          inputBoxRef.current = el;
        }}
        className={cn(
          "bg-background/80 backdrop-blur-sm relative z-10 w-full rounded-b-2xl rounded-t-none transition-all",
          dragOver
            ? "border-primary border-2 border-dotted"
            : "border border-border",
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-rows-[1fr_auto]"
        >
          <ContentBlocksPreview
            blocks={contentBlocks}
            onRemove={removeBlock}
          />
          <AnimatePresence initial={false}>
            {quotes.length > 0 && (
              <motion.div
                key="quote-cards"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ overflow: "clip" }}
              >
                <QuoteCards
                  quotes={quotes}
                  onUpdate={updateQuote}
                  onRemove={removeQuote}
                  onScrollToSource={handleScrollToQuoteSource}
                  onClearAll={clearQuotes}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {(hasContextSelections || (useAsContext && hasFilterSelections)) && (
              <motion.div
                key="context-badges"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ overflow: "clip" }}
              >
                <ContextBadges
                  selections={contextSelections}
                  onRemove={handleRemoveContextItem}
                  onClearAll={handleClearSelections}
                  onSave={presetEditing && (hasContextSelections || hasFilterSelections) ? handleSavePreset : undefined}
                  onSaveAsNew={(hasContextSelections || hasFilterSelections) ? handleSaveAsNewPreset : undefined}
                  activePresetName={presetEditing?.presetName ?? null}
                  onDeactivatePreset={handleDeactivatePreset}
                  onRenameActivePreset={presetEditing ? () => handleRenamePreset(presetEditing.presetId, presetEditing.presetName) : undefined}
                  filterSelections={useAsContext ? filterSelections : undefined}
                  onRemoveFilter={useAsContext ? removeFilterItem : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <ContextPopover
            open={contextPopoverOpen && triggerSource === "keyboard"}
            onOpenChange={(open) => {
              if (!open) {
                closeContextPopover();
                textareaRef.current?.focus();
              }
            }}
            activeCategory={activeCategory}
            onCategorySelect={setActiveCategory}
            selections={contextSelections}
            onToggleItem={handleToggleContextItem}
            anchorRef={inputBoxRef}
            align="start"
            side="top"
            presets={presets}
            onApplyPreset={handleApplyPreset}
            onEditPreset={handleEditPreset}
            onDuplicatePreset={handleDuplicatePreset}
            onDeletePreset={deletePreset}
            onRenamePreset={handleRenamePreset}
            onSavePreset={handleSavePreset}
            hasSelections={hasContextSelections}
            isEditing={!!presetEditing}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "@") {
                  const val = (e.target as HTMLTextAreaElement).value;
                  const pos = (e.target as HTMLTextAreaElement).selectionStart;
                  if (pos === 0 || val[pos - 1] === " " || val[pos - 1] === "\n") {
                    e.preventDefault();
                    openContextPopover(undefined, "keyboard");
                  }
                }
                if (e.key === "/") {
                  const val = (e.target as HTMLTextAreaElement).value;
                  const pos = (e.target as HTMLTextAreaElement).selectionStart;
                  if (pos === 0 || val[pos - 1] === " " || val[pos - 1] === "\n") {
                    e.preventDefault();
                    openShortcutPopover();
                  }
                }
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.metaKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  const el = e.target as HTMLElement | undefined;
                  const form = el?.closest("form");
                  form?.requestSubmit();
                }
              }}
              placeholder="Type your message..."
              className="field-sizing-content w-full resize-none border-none bg-transparent px-5 pt-4 pb-0 text-foreground shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
            />
          </ContextPopover>

          <div className="flex items-center gap-1 px-4 py-3">
            <TooltipIconButton
              tooltip={showSuggestions ? "Hide suggestions" : "Show suggestions"}
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions((p) => !p)}
              className={cn(
                "h-8 w-8",
                showSuggestions && "text-primary",
                !showSuggestions && "text-muted-foreground",
              )}
            >
              <Lightbulb className="h-4 w-4" />
            </TooltipIconButton>

            {input.trim().length > 0 && (
              <button
                type="button"
                onClick={handleSaveAsShortcutFromToolbar}
                className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-sm transition-colors hover:bg-muted/80"
              >
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                <span
                  className="inline-block bg-clip-text font-medium text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #4586F7 0%, #8fb4fc 30%, #4586F7 60%, #8fb4fc 90%, #4586F7 100%)",
                    backgroundSize: "200% 100%",
                    animation: "gradient-shift 2s linear infinite",
                  }}
                >
                  Save Shortcut
                </span>
              </button>
            )}

            <ShortcutPopover
              open={shortcutPopoverOpen && shortcutTriggerSource === "icon"}
              onOpenChange={(open) => {
                if (open) openShortcutPopover("icon");
                else closeShortcutPopover();
              }}
              shortcuts={shortcuts}
              onSelectShortcut={handleSelectShortcut}
              onEditShortcut={handleEditShortcutFromPopover}
              onCreateNew={handleCreateShortcutFromPopover}
              textareaRef={textareaRef}
            >
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <span className="font-medium">/</span>
                <span>Quick prompts</span>
              </button>
            </ShortcutPopover>

            <ContextPopover
              open={contextPopoverOpen && triggerSource === "icon"}
              onOpenChange={(open) => {
                if (open) openContextPopover(undefined, "icon");
                else closeContextPopover();
              }}
              activeCategory={activeCategory}
              onCategorySelect={setActiveCategory}
              selections={contextSelections}
              onToggleItem={handleToggleContextItem}
              align="start"
              side="top"
              presets={presets}
              onApplyPreset={handleApplyPreset}
              onEditPreset={handleEditPreset}
              onDuplicatePreset={handleDuplicatePreset}
              onDeletePreset={deletePreset}
              onRenamePreset={handleRenamePreset}
              onSavePreset={handleSavePreset}
              hasSelections={hasContextSelections}
              isEditing={!!presetEditing}
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted",
                  hasContextSelections
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <span className="font-medium">@</span>
                <span>Add Context</span>
              </button>
            </ContextPopover>

            {/* Hidden for now – uncomment to re-enable file uploads
            <Label
              htmlFor="file-input"
              className="flex cursor-pointer items-center gap-2"
            >
              <Plus className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Upload PDF or Image
              </span>
            </Label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileUpload}
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
            />
            */}
            {stream.isLoading ? (
              <Button
                key="stop"
                onClick={() => stream.stop()}
                className="ml-auto"
              >
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cancel
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="ml-auto h-9 w-9 rounded-full bg-brand-accent text-white hover:bg-brand-accent-hover shadow-md transition-all"
                disabled={
                  isLoading ||
                  (!input.trim() && contentBlocks.length === 0)
                }
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ShortcutPopover
            open={shortcutPopoverOpen && shortcutTriggerSource === "keyboard"}
            onOpenChange={(open) => {
              if (!open) closeShortcutPopover();
            }}
            shortcuts={shortcuts}
            onSelectShortcut={handleSelectShortcut}
            onEditShortcut={handleEditShortcutFromPopover}
            onCreateNew={handleCreateShortcutFromPopover}
            anchorRef={inputBoxRef}
            textareaRef={textareaRef}
          />
        </form>
      </div>
    </div>
  );
}
