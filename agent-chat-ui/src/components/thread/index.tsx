import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState } from "react";
import { Button } from "../ui/button";
import { SuggestionCards } from "./suggestion-cards";
import {
  useSuggestions,
  INITIAL_SUGGESTIONS,
} from "@/hooks/use-suggestions";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  LoaderCircle,
  SendHorizontal,
  XIcon,
  Lightbulb,
  Bookmark,
} from "lucide-react";
import { ReportSheet } from "./report-sheet";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottomBridge, StickyToBottomContent, ScrollToBottom } from "./scroll-helpers";
import { toast } from "sonner";
import { ChatSidebar } from "./chat-sidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import { getContentString } from "./utils";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";
import { ChatHeader } from "./chat-header";
import { useContextSelectors } from "@/hooks/use-context-selectors";
import { useFilterContext } from "@/providers/Filters";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { useFilterSync } from "@/hooks/use-filter-sync";
import { useTextQuotes } from "@/hooks/use-text-quotes";
import { useTextSelection } from "@/hooks/use-text-selection";
import { ContextBadges } from "./context-badges";
import { ContextPopover } from "./context-popover";
import { SelectionPopup } from "./selection-popup";
import { QuoteCards } from "./quote-cards";
import { useContextPresets } from "@/hooks/use-context-presets";
import { PresetNameDialog } from "./preset-name-dialog";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { ShortcutPopover } from "./shortcut-popover";
import { ShortcutDialog } from "./shortcut-dialog";
import { useChatHandlers } from "./use-chat-handlers";

export function Thread() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [sidebarCollapsed, setSidebarCollapsed] = useQueryState(
    "sidebarCollapsed",
    parseAsBoolean.withDefault(true),
  );
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(true),
  );
  const [input, setInput] = useState("");
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const {
    selections: contextSelections,
    setSelections: setContextSelections,
    popoverOpen: contextPopoverOpen,
    activeCategory,
    setActiveCategory,
    triggerSource,
    toggleItem,
    removeItem,
    resetSelections: resetContextSelections,
    hasSelections: hasContextSelections,
    toMetadata: contextToMetadata,
    openPopover: openContextPopover,
    closePopover: closeContextPopover,
  } = useContextSelectors();
  const {
    presets,
    editing: presetEditing,
    addPreset,
    deletePreset,
    renamePreset,
    duplicate: duplicatePreset,
    startEditing: startPresetEditing,
    stopEditing: stopPresetEditing,
    saveEditing: savePresetEditing,
  } = useContextPresets();
  const {
    shortcuts,
    popoverOpen: shortcutPopoverOpen,
    triggerSource: shortcutTriggerSource,
    dialogOpen: shortcutDialogOpen,
    editingShortcut,
    prefill: shortcutPrefill,
    addShortcut,
    updateShortcut,
    deleteShortcut: deleteShortcutFn,
    duplicate: duplicateShortcutFn,
    openPopover: openShortcutPopover,
    closePopover: closeShortcutPopover,
    openCreateDialog: openShortcutCreateDialog,
    openEditDialog: openShortcutEditDialog,
    closeDialog: closeShortcutDialog,
  } = useShortcuts();
  const {
    selections: filterSelections,
    dateRange,
    useAsContext,
    setUseAsContext,
    toggleItem: toggleFilterItem,
    removeItem: removeFilterItem,
    selectAll: selectAllFilter,
    clearCategory: clearFilterCategory,
    resetAll: resetAllFilters,
    hasSelections: hasFilterSelections,
    totalSelected: filterTotalSelected,
    toMetadata: filterToMetadata,
    setSelections: setFilterSelections,
    setDateRange,
  } = useFilterContext();
  const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollToBottomRef = useRef<(() => void) | null>(null);
  const {
    quotes,
    addQuote,
    updateQuote,
    removeQuote,
    clearQuotes,
    setQuotesFromTexts,
    hasQuotes,
    toMetadata: quotesToMetadata,
  } = useTextQuotes();
  const { selection, clearSelection } = useTextSelection(messagesContainerRef);

  const filterSync = useFilterSync({
    useAsContext,
    toggleItem,
    removeItem,
    resetSelections: resetContextSelections,
    setSelections: setContextSelections,
    toggleFilterItem,
    removeFilterItem,
    selectAllFilter,
    clearFilterCategory,
    resetAllFilters,
  });

  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const { suggestions, isFetchingSuggestions, fetchSuggestions, clearSuggestions } =
    useSuggestions();

  // Fetch dynamic suggestions after each AI response
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.type === "ai") {
        fetchSuggestions(messages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, messages.length]);

  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
    resetContextSelections();
  };

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        return;
      }

      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  const {
    handleRenamePreset,
    handleConfirmRename,
    handleApplyPreset,
    handleEditPreset,
    handleDuplicatePreset,
    handleSavePreset,
    handleSaveAsNewPreset,
    handleConfirmNewPreset,
    handleDeactivatePreset,
    handleClearSelections,
    handleSelectShortcut,
    handleEditShortcutFromPopover,
    handleCreateShortcutFromPopover,
    handleSaveShortcut,
    handleSaveShortcutAsNew,
    handleSaveAsShortcutFromToolbar,
    handleAddQuote,
    handleScrollToQuoteSource,
    handleSubmit,
    handleRegenerate,
    handleSuggestionSelect,
    handleReuse,
  } = useChatHandlers({
    input,
    setInput,
    contentBlocks,
    setContentBlocks,
    contextSelections,
    setContextSelections,
    resetContextSelections,
    hasContextSelections,
    contextToMetadata,
    presetEditing,
    addPreset,
    renamePreset,
    duplicatePreset,
    startPresetEditing,
    stopPresetEditing,
    savePresetEditing,
    closeContextPopover,
    filterSelections,
    setFilterSelections,
    useAsContext,
    resetAllFilters,
    hasFilterSelections,
    filterToMetadata,
    editingShortcut,
    addShortcut,
    updateShortcut,
    closeShortcutPopover,
    openShortcutCreateDialog,
    openShortcutEditDialog,
    closeShortcutDialog,
    addQuote,
    clearSelection,
    clearQuotes,
    setQuotesFromTexts,
    quotesToMetadata,
    stream,
    clearSuggestions,
    artifactContext,
    textareaRef,
    messagesContainerRef,
    scrollToBottomRef,
    setPresetNameDialogOpen,
    setRenameTarget,
    renameTarget,
  });

  const chatStarted = !!threadId || !!messages.length;

  const isComposingMessage = input.trim().length > 0 || contentBlocks.length > 0 || hasContextSelections || hasQuotes;
  const showSuggestionPlaceholders =
    chatStarted && !isComposingMessage && !isLoading && isFetchingSuggestions;
  const visibleSuggestions = isComposingMessage
    ? []
    : !chatStarted
    ? INITIAL_SUGGESTIONS
    : isLoading
      ? []
      : suggestions;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const lastAiMessage = [...messages]
    .reverse()
    .find(
      (m) =>
        m.type === "ai" && !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX),
    );
  const hasFirstAiToken =
    !!lastAiMessage &&
    getContentString(lastAiMessage.content).trim().length > 0;

  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background">
      {/* Collapsible sidebar — desktop only */}
      <ChatSidebar collapsed={sidebarCollapsed ?? true} onToggle={() => setSidebarCollapsed((p) => !p)} />

      {/* Main content area */}
      <div
        className={cn(
          "grid flex-1 grid-cols-[1fr_0fr] transition-all duration-500",
          artifactOpen && "grid-cols-[3fr_2fr]",
        )}
      >
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            !chatStarted && "grid-rows-[1fr]",
          )}
        >
          {/* Header */}
          <ChatHeader
            chatStarted={chatStarted}
            hideToolCalls={hideToolCalls}
            onToggleToolCalls={() => setHideToolCalls(!(hideToolCalls ?? true))}
            onNewThread={() => setThreadId(null)}
            onOpenReport={() => setReportSheetOpen(true)}
            onToggleChatHistory={() => setChatHistoryOpen((p) => !p)}
          />

          <StickToBottom className="relative flex-1 overflow-hidden">
            <ScrollToBottomBridge scrollRef={scrollToBottomRef} />
            {/* Top fade gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[60px] bg-gradient-to-b from-background from-40% via-background/90 via-70% to-transparent" />
            {/* Bottom fade gradient */}
            <div className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent transition-all duration-300",
              showSuggestions && (visibleSuggestions.length > 0 || showSuggestionPlaceholders)
                ? "h-[400px] from-30% via-60%"
                : "h-[100px] from-30% via-60%",
            )} />
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted && "flex flex-col items-stretch",
                chatStarted && "grid grid-rows-[1fr_auto]",
              )}
              contentClassName="pt-16 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
              content={
                <div ref={messagesContainerRef} className="relative">
                  {!chatStarted && (
                    <div className="flex flex-col items-center justify-center gap-3 pt-[20vh]">
                      <div className="flex items-end gap-3">
                        <img
                          src="/adfidence-logo.svg"
                          alt="Adfidence"
                          className="h-10 w-auto object-contain flex-shrink-0 dark:brightness-0 dark:invert"
                        />
                        <h1 className="text-5xl font-semibold italic tracking-tight leading-none translate-y-[0.12em] text-[#4586F7] dark:text-foreground">
                          AI
                        </h1>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        How can I help you today?
                      </p>
                    </div>
                  )}

                  {messages
                    .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                    .map((message, index) =>
                      message.type === "human" ? (
                        <HumanMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                          onReuse={handleReuse}
                        />
                      ) : (
                        <AssistantMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                          handleRegenerate={handleRegenerate}
                        />
                      ),
                    )}
                  {hasNoAIOrToolMessages && !!stream.interrupt && (
                    <AssistantMessage
                      key="interrupt-msg"
                      message={undefined}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  )}
                  {isLoading && !hasFirstAiToken && (
                    <AssistantMessageLoading />
                  )}
                  <SelectionPopup
                    selection={selection}
                    containerRef={messagesContainerRef}
                    onAdd={handleAddQuote}
                  />
                </div>
              }
              footer={
                <div className="sticky bottom-0 z-20 flex flex-col items-center pointer-events-none [&>*]:pointer-events-auto">
                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  <AnimatePresence initial={false}>
                    {showSuggestions && (visibleSuggestions.length > 0 || showSuggestionPlaceholders) && (
                      <motion.div
                        key="suggestions"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginBottom: 24,
                          transition: {
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            marginBottom: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.3, delay: 0.05, ease: "easeOut" },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          marginBottom: 0,
                          transition: {
                            opacity: { duration: 0.15, ease: "easeIn" },
                            height: { duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] },
                            marginBottom: { duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] },
                          },
                        }}
                        className="overflow-hidden pb-1"
                      >
                        <SuggestionCards
                          suggestions={visibleSuggestions}
                          loading={showSuggestionPlaceholders}
                          onSelect={handleSuggestionSelect}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                              onRemove={filterSync.handleRemoveContextItem}
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
                        onToggleItem={filterSync.handleToggleContextItem}
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
                          onToggleItem={filterSync.handleToggleContextItem}
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
                            className="ml-auto h-9 w-9 rounded-full bg-[#4586F7] text-white hover:bg-[#3a75e0] shadow-md transition-all"
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
                </div>
              }
            />
          </StickToBottom>
        </div>
        <div className="relative flex flex-col overflow-hidden border-l border-border">
          <div className="absolute inset-0 flex min-w-[30vw] flex-col">
            <div className="grid grid-cols-[1fr_auto] border-b border-border p-4">
              <ArtifactTitle className="truncate overflow-hidden" />
              <button
                onClick={closeArtifact}
                className="cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <ArtifactContent className="relative flex-grow" />
          </div>
        </div>
      </div>
      <FilterSidebar
        selections={filterSelections}
        dateRange={dateRange}
        onToggleItem={filterSync.handleToggleFilterItem}
        onSelectAll={filterSync.handleSelectAllFilter}
        onClearCategory={filterSync.handleClearFilterCategory}
        onDateRangeChange={setDateRange}
        onResetAll={filterSync.handleResetAllFilters}
        hasSelections={hasFilterSelections}
        totalSelected={filterTotalSelected}
        presets={presets}
        onApplyPreset={handleApplyPreset}
        onSavePreset={handleSavePreset}
        onSaveAsNewPreset={() => setPresetNameDialogOpen(true)}
        onDeletePreset={deletePreset}
        activePresetName={presetEditing?.presetName ?? null}
      />
      <ReportSheet open={reportSheetOpen} onOpenChange={setReportSheetOpen} />
      <PresetNameDialog
        open={presetNameDialogOpen}
        onOpenChange={setPresetNameDialogOpen}
        onConfirm={handleConfirmNewPreset}
      />
      <PresetNameDialog
        open={!!renameTarget}
        onOpenChange={(open) => { if (!open) setRenameTarget(null); }}
        onConfirm={handleConfirmRename}
        defaultName={renameTarget?.name ?? ""}
        title="Rename preset"
      />
      <ShortcutDialog
        open={shortcutDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeShortcutDialog();
        }}
        shortcut={editingShortcut}
        prefill={shortcutPrefill}
        presets={presets}
        onSave={handleSaveShortcut}
        onSaveAsNew={handleSaveShortcutAsNew}
        onDelete={deleteShortcutFn}
        onDuplicate={(id) => {
          const copy = duplicateShortcutFn(id);
          if (copy) openShortcutEditDialog(copy);
        }}
      />
    </div>
  );
}
