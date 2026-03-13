import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState } from "react";
import { SuggestionCards } from "./suggestion-cards";
import {
  useSuggestions,
  INITIAL_SUGGESTIONS,
} from "@/hooks/use-suggestions";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import {
  XIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
const ReportSheet = dynamic(
  () => import("./report-sheet").then((mod) => ({ default: mod.ReportSheet })),
  { ssr: false },
);
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom } from "use-stick-to-bottom";
import { ScrollToBottomBridge, StickyToBottomContent, ScrollToBottom } from "./scroll-helpers";
import { toast } from "sonner";
import { ChatSidebar } from "./chat-sidebar";
import { useFileUpload } from "@/hooks/use-file-upload";
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
import { SelectionPopup } from "./selection-popup";
import { useContextPresets } from "@/hooks/use-context-presets";
import { PresetNameDialog } from "./preset-name-dialog";
import { useShortcuts } from "@/hooks/use-shortcuts";
const ShortcutDialog = dynamic(
  () => import("./shortcut-dialog").then((mod) => ({ default: mod.ShortcutDialog })),
  { ssr: false },
);
import { useChatHandlers } from "./use-chat-handlers";
import { ChatInput } from "./chat-input";

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
  const filteredMessages = useMemo(
    () => messages.filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)),
    [messages],
  );
  const visibleSuggestions = useMemo(
    () =>
      isComposingMessage
        ? []
        : !chatStarted
          ? INITIAL_SUGGESTIONS
          : isLoading
            ? []
            : suggestions,
    [isComposingMessage, chatStarted, isLoading, suggestions],
  );
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const lastAiMessage = useMemo(
    () =>
      [...messages].reverse().find(
        (m) => m.type === "ai" && !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX),
      ),
    [messages],
  );
  const hasFirstAiToken = useMemo(
    () => !!lastAiMessage && getContentString(lastAiMessage.content).trim().length > 0,
    [lastAiMessage],
  );

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

                  {filteredMessages
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

                  <ChatInput
                    input={input}
                    setInput={setInput}
                    chatStarted={chatStarted}
                    stream={stream}
                    useAsContext={useAsContext}
                    setUseAsContext={setUseAsContext}
                    hasFilterSelections={hasFilterSelections}
                    contentBlocks={contentBlocks}
                    removeBlock={removeBlock}
                    dropRef={dropRef}
                    dragOver={dragOver}
                    handlePaste={handlePaste}
                    quotes={quotes}
                    updateQuote={updateQuote}
                    removeQuote={removeQuote}
                    clearQuotes={clearQuotes}
                    handleScrollToQuoteSource={handleScrollToQuoteSource}
                    contextSelections={contextSelections}
                    hasContextSelections={hasContextSelections}
                    contextPopoverOpen={contextPopoverOpen}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    triggerSource={triggerSource}
                    openContextPopover={openContextPopover}
                    closeContextPopover={closeContextPopover}
                    handleToggleContextItem={filterSync.handleToggleContextItem}
                    handleRemoveContextItem={filterSync.handleRemoveContextItem}
                    handleClearSelections={handleClearSelections}
                    presets={presets}
                    presetEditing={presetEditing}
                    handleApplyPreset={handleApplyPreset}
                    handleEditPreset={handleEditPreset}
                    handleDuplicatePreset={handleDuplicatePreset}
                    deletePreset={deletePreset}
                    handleRenamePreset={handleRenamePreset}
                    handleSavePreset={handleSavePreset}
                    handleSaveAsNewPreset={handleSaveAsNewPreset}
                    handleDeactivatePreset={handleDeactivatePreset}
                    filterSelections={useAsContext ? filterSelections : undefined}
                    removeFilterItem={useAsContext ? removeFilterItem : undefined}
                    shortcuts={shortcuts}
                    shortcutPopoverOpen={shortcutPopoverOpen}
                    shortcutTriggerSource={shortcutTriggerSource}
                    openShortcutPopover={openShortcutPopover}
                    closeShortcutPopover={closeShortcutPopover}
                    handleSelectShortcut={handleSelectShortcut}
                    handleEditShortcutFromPopover={handleEditShortcutFromPopover}
                    handleCreateShortcutFromPopover={handleCreateShortcutFromPopover}
                    handleSaveAsShortcutFromToolbar={handleSaveAsShortcutFromToolbar}
                    showSuggestions={showSuggestions}
                    setShowSuggestions={setShowSuggestions}
                    handleSubmit={handleSubmit}
                    textareaRef={textareaRef}
                    inputBoxRef={inputBoxRef}
                  />
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
