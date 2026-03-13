"use client";

import { v4 as uuidv4 } from "uuid";
import { useState, useRef, useCallback, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import {
  SendHorizontal,
  LoaderCircle,
  Lightbulb,
  Bookmark,
} from "lucide-react";
import { Button } from "../ui/button";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "../thread/ContentBlocksPreview";
import { useContextSelectors } from "@/hooks/use-context-selectors";
import { ContextCategory, ContextSelections } from "@/lib/context-selectors";
import { usePageWidgets } from "@/lib/dashboard-widgets";
import { useTextQuotes } from "@/hooks/use-text-quotes";
import { ContextBadges } from "../thread/context-badges";
import { ContextPopover } from "../thread/context-popover";
import { QuoteCards } from "../thread/quote-cards";
import { useContextPresets } from "@/hooks/use-context-presets";
import { PresetNameDialog } from "../thread/preset-name-dialog";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Shortcut } from "@/lib/shortcuts";
import { ShortcutPopover } from "../thread/shortcut-popover";
import dynamic from "next/dynamic";
const ShortcutDialog = dynamic(
  () => import("../thread/shortcut-dialog").then((mod) => ({ default: mod.ShortcutDialog })),
  { ssr: false },
);
import { useFilterContext } from "@/providers/Filters";
import { useFilterSync } from "@/hooks/use-filter-sync";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { toast } from "sonner";

interface MiniInputProps {
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  clearSuggestions: () => void;
  scrollToBottom: () => void;
}

export function MiniInput({
  showSuggestions,
  onToggleSuggestions,
  clearSuggestions,
  scrollToBottom,
}: MiniInputProps) {
  const stream = useStreamContext();
  const isLoading = stream.isLoading;

  const [input, setInput] = useState("");

  // --- Page widgets (for resolving context IDs) ---
  const pageWidgets = usePageWidgets();

  // --- File upload ---
  const {
    contentBlocks,
    setContentBlocks,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();

  // --- Context selectors ---
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

  // --- Context presets ---
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

  // --- Shortcuts ---
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

  // --- Filters ---
  const {
    selections: filterSelections,
    useAsContext,
    setUseAsContext,
    toggleItem: toggleFilterItem,
    removeItem: removeFilterItem,
    resetAll: resetAllFilters,
    hasSelections: hasFilterSelections,
    toMetadata: filterToMetadata,
  } = useFilterContext();

  const filterSync = useFilterSync({
    useAsContext,
    toggleItem,
    removeItem,
    resetSelections: resetContextSelections,
    setSelections: setContextSelections,
    toggleFilterItem,
    removeFilterItem,
    selectAllFilter: () => {},
    clearFilterCategory: () => {},
    resetAllFilters,
  });

  // --- Text quotes ---
  const {
    quotes,
    addQuote,
    updateQuote,
    removeQuote,
    clearQuotes,
    toMetadata: quotesToMetadata,
  } = useTextQuotes();

  // --- Page context custom event listener ---
  useEffect(() => {
    const handler = ((e: CustomEvent<string>) => {
      const widgetId = e.detail;
      if (!contextSelections.page.includes(widgetId)) {
        toggleItem("page" as ContextCategory, widgetId);
      }
    }) as EventListener;
    window.addEventListener("odin:add-page-context", handler);
    return () => window.removeEventListener("odin:add-page-context", handler);
  }, [contextSelections.page, toggleItem]);

  // --- Quote from insight event listener ---
  useEffect(() => {
    const handler = ((e: CustomEvent<string>) => {
      addQuote(e.detail, "insight", "ai");
    }) as EventListener;
    window.addEventListener("odin:add-quote", handler);
    return () => window.removeEventListener("odin:add-quote", handler);
  }, [addQuote]);

  // --- Refs ---
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);

  // --- Prefill input from chat action ---
  useEffect(() => {
    const handler = ((e: CustomEvent<string>) => {
      setInput(e.detail);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }) as EventListener;
    window.addEventListener("odin:prefill-input", handler);
    return () => window.removeEventListener("odin:prefill-input", handler);
  }, []);

  // --- Preset dialogs ---
  const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // --- Preset handlers ---
  const handleRenamePreset = useCallback(
    (id: string, currentName: string) => {
      setRenameTarget({ id, name: currentName });
    },
    [],
  );

  const handleConfirmRename = useCallback(
    (newName: string) => {
      if (renameTarget) {
        renamePreset(renameTarget.id, newName);
        setRenameTarget(null);
      }
    },
    [renameTarget, renamePreset],
  );

  const handleApplyPreset = useCallback(
    (preset: import("@/lib/context-presets").ContextPreset) => {
      setContextSelections(preset.selections);
      startPresetEditing(preset);
      closeContextPopover();
    },
    [setContextSelections, startPresetEditing, closeContextPopover],
  );

  const handleEditPreset = useCallback(
    (preset: import("@/lib/context-presets").ContextPreset) => {
      setContextSelections(preset.selections);
      startPresetEditing(preset);
      closeContextPopover();
    },
    [setContextSelections, startPresetEditing, closeContextPopover],
  );

  const handleDuplicatePreset = useCallback(
    (presetId: string) => {
      const newPreset = duplicatePreset(presetId);
      if (newPreset) {
        setContextSelections(newPreset.selections);
        startPresetEditing(newPreset);
        closeContextPopover();
      }
    },
    [duplicatePreset, setContextSelections, startPresetEditing, closeContextPopover],
  );

  const handleSavePreset = useCallback(() => {
    if (presetEditing) {
      savePresetEditing(contextSelections);
    }
  }, [presetEditing, savePresetEditing, contextSelections]);

  const handleSaveAsNewPreset = useCallback(() => {
    setPresetNameDialogOpen(true);
  }, []);

  const handleConfirmNewPreset = useCallback(
    (name: string) => {
      const preset = addPreset(name, contextSelections);
      startPresetEditing(preset);
    },
    [addPreset, contextSelections, startPresetEditing],
  );

  const handleDeactivatePreset = useCallback(() => {
    stopPresetEditing();
  }, [stopPresetEditing]);

  const handleClearSelections = useCallback(() => {
    stopPresetEditing();
    resetContextSelections();
    if (useAsContext) {
      resetAllFilters();
    }
  }, [stopPresetEditing, resetContextSelections, useAsContext, resetAllFilters]);

  // --- Shortcut handlers ---
  const handleSelectShortcut = useCallback(
    (shortcut: Shortcut) => {
      setInput(shortcut.instructions);
      if (shortcut.context) {
        setContextSelections(shortcut.context);
      }
      closeShortcutPopover();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [setContextSelections, closeShortcutPopover],
  );

  const handleEditShortcutFromPopover = useCallback(
    (shortcut: Shortcut) => {
      closeShortcutPopover();
      openShortcutEditDialog(shortcut);
    },
    [closeShortcutPopover, openShortcutEditDialog],
  );

  const handleCreateShortcutFromPopover = useCallback(() => {
    closeShortcutPopover();
    openShortcutCreateDialog();
  }, [closeShortcutPopover, openShortcutCreateDialog]);

  const handleSaveShortcut = useCallback(
    (
      name: string,
      instructions: string,
      context: ContextSelections | null,
      presetId: string | null,
    ) => {
      if (editingShortcut) {
        updateShortcut(editingShortcut.id, {
          name,
          instructions,
          context,
          presetId,
        });
      } else {
        addShortcut(name, instructions, context, presetId);
      }
      closeShortcutDialog();
    },
    [editingShortcut, updateShortcut, addShortcut, closeShortcutDialog],
  );

  const handleSaveShortcutAsNew = useCallback(
    (
      name: string,
      instructions: string,
      context: ContextSelections | null,
      presetId: string | null,
    ) => {
      addShortcut(name, instructions, context, presetId);
      closeShortcutDialog();
    },
    [addShortcut, closeShortcutDialog],
  );

  const handleSaveAsShortcutFromToolbar = useCallback(() => {
    openShortcutCreateDialog({
      instructions: input,
      context: hasContextSelections ? contextSelections : null,
    });
  }, [openShortcutCreateDialog, input, hasContextSelections, contextSelections]);

  // --- Submit ---
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;

    const contextMeta = contextToMetadata();
    const quotesMeta = quotesToMetadata();
    const filterMeta = useAsContext ? filterToMetadata() : undefined;
    const combinedMeta: Record<string, unknown> = { ...(contextMeta ?? {}), ...(quotesMeta ?? {}), ...(filterMeta ? { filters: filterMeta } : {}) };

    // Resolve page widget IDs to full widget data
    if (combinedMeta.page && Array.isArray(combinedMeta.page)) {
      combinedMeta.page = (combinedMeta.page as string[]).map((id) => {
        const widget = pageWidgets.find((w) => w.id === id);
        return widget
          ? { id: widget.id, title: widget.title, type: widget.type, data: widget.data }
          : { id };
      });
    }
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
      additional_kwargs:
        Object.keys(combinedMeta).length > 0
          ? { context: combinedMeta }
          : {},
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    const context =
      Object.keys(combinedMeta).length > 0 ? combinedMeta : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    clearSuggestions();
    setInput("");
    setContentBlocks([]);
    clearQuotes();
    scrollToBottom();
  };

  return (
    <>
      <div className="shrink-0 border-t border-border px-3 py-2">
        <div className="flex items-center gap-2 rounded-t-xl border border-b-0 border-border bg-background/60 backdrop-blur-sm px-3 py-1.5">
          <Switch
            id="mini-use-filters"
            checked={useAsContext}
            onCheckedChange={(checked) => {
              setUseAsContext(checked);
              toast(
                checked
                  ? "AI will now use your selected filters as context"
                  : "AI will no longer use your filters",
              );
            }}
            className="scale-[0.8]"
          />
          <Label htmlFor="mini-use-filters" className="text-[11px] text-muted-foreground cursor-pointer select-none">
            Include filters with your conversation
          </Label>
        </div>
        <div
          ref={(el) => {
            (dropRef as React.MutableRefObject<HTMLDivElement | null>).current =
              el;
            (inputBoxRef as React.MutableRefObject<HTMLDivElement | null>).current =
              el;
          }}
          className={cn(
            "relative rounded-b-xl rounded-t-none bg-background/80 backdrop-blur-sm transition-all",
            dragOver
              ? "border-primary border-2 border-dotted"
              : "border border-border",
          )}
        >
          <form
            onSubmit={handleSubmit}
            className="grid grid-rows-[1fr_auto]"
          >
            {/* Content blocks preview */}
            <ContentBlocksPreview
              blocks={contentBlocks}
              onRemove={removeBlock}
              size="sm"
              className="px-3 pt-2 pb-0"
            />

            {/* Quote cards */}
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
                    onClearAll={clearQuotes}
                    className="px-3 pt-2 pb-0"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Context badges */}
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
                    onSave={
                      presetEditing && (hasContextSelections || hasFilterSelections)
                        ? handleSavePreset
                        : undefined
                    }
                    onSaveAsNew={
                      (hasContextSelections || hasFilterSelections)
                        ? handleSaveAsNewPreset
                        : undefined
                    }
                    activePresetName={presetEditing?.presetName ?? null}
                    onDeactivatePreset={handleDeactivatePreset}
                    onRenameActivePreset={
                      presetEditing
                        ? () =>
                            handleRenamePreset(
                              presetEditing.presetId,
                              presetEditing.presetName,
                            )
                        : undefined
                    }
                    filterSelections={useAsContext ? filterSelections : undefined}
                    onRemoveFilter={useAsContext ? removeFilterItem : undefined}
                    className="px-3 pt-2 pb-0"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard-triggered context popover (anchored to input box) */}
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
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "@") {
                    const val = (e.target as HTMLTextAreaElement).value;
                    const pos = (e.target as HTMLTextAreaElement)
                      .selectionStart;
                    if (
                      pos === 0 ||
                      val[pos - 1] === " " ||
                      val[pos - 1] === "\n"
                    ) {
                      e.preventDefault();
                      openContextPopover(undefined, "keyboard");
                    }
                  }
                  if (e.key === "/") {
                    const val = (e.target as HTMLTextAreaElement).value;
                    const pos = (e.target as HTMLTextAreaElement)
                      .selectionStart;
                    if (
                      pos === 0 ||
                      val[pos - 1] === " " ||
                      val[pos - 1] === "\n"
                    ) {
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
                className="field-sizing-content w-full resize-none border-none bg-transparent px-3 pt-3 pb-0 text-sm text-foreground shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
              />
            </ContextPopover>

            {/* Icons-only toolbar */}
            <div className="flex items-center gap-1 px-2 py-2">
              {/* Toggle suggestions */}
              <TooltipIconButton
                tooltip={
                  showSuggestions ? "Hide suggestions" : "Show suggestions"
                }
                variant="ghost"
                size="sm"
                onClick={onToggleSuggestions}
                className={cn(
                  "h-7 w-7",
                  showSuggestions && "text-primary",
                  !showSuggestions && "text-muted-foreground",
                )}
              >
                <Lightbulb className="h-3.5 w-3.5" />
              </TooltipIconButton>

              {/* Save as shortcut (only when there's text) */}
              {input.trim().length > 0 && (
                <TooltipIconButton
                  tooltip="Save as quick prompt"
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveAsShortcutFromToolbar}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                </TooltipIconButton>
              )}

              {/* Shortcuts popover (icon trigger) */}
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
                <TooltipIconButton
                  tooltip="Quick prompts"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 text-muted-foreground"
                >
                  <span className="text-sm font-medium leading-none">/</span>
                </TooltipIconButton>
              </ShortcutPopover>

              {/* Context popover (icon trigger) */}
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
                <TooltipIconButton
                  tooltip="Attach data"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7",
                    hasContextSelections
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="text-sm font-medium leading-none">@</span>
                </TooltipIconButton>
              </ContextPopover>

              {/* Send / Stop button */}
              {stream.isLoading ? (
                <TooltipIconButton
                  tooltip="Cancel"
                  variant="ghost"
                  size="sm"
                  onClick={() => stream.stop()}
                  className="ml-auto h-7 w-7 text-muted-foreground"
                >
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                </TooltipIconButton>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="ml-auto h-7 w-7 rounded-full bg-brand-accent text-white hover:bg-brand-accent-hover shadow-md transition-all"
                  disabled={
                    isLoading ||
                    (!input.trim() && contentBlocks.length === 0)
                  }
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Keyboard-triggered shortcut popover (anchored to input box) */}
            <ShortcutPopover
              open={
                shortcutPopoverOpen && shortcutTriggerSource === "keyboard"
              }
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

      {/* Shortcut CRUD dialog */}
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

      {/* Preset name dialogs */}
      <PresetNameDialog
        open={presetNameDialogOpen}
        onOpenChange={setPresetNameDialogOpen}
        onConfirm={handleConfirmNewPreset}
      />
      <PresetNameDialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        onConfirm={handleConfirmRename}
        defaultName={renameTarget?.name ?? ""}
        title="Rename favorite"
      />
    </>
  );
}
