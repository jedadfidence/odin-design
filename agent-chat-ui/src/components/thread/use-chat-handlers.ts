import { useCallback, FormEvent, RefObject } from "react";
import { v4 as uuidv4 } from "uuid";
import { ContentBlock } from "@langchain/core/messages";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { ContextSelections } from "@/lib/context-selectors";
import { ContextPreset } from "@/lib/context-presets";
import { Shortcut } from "@/lib/shortcuts";
import { FilterSelections } from "@/lib/filter-data";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";

export interface ChatHandlersDeps {
  // State
  input: string;
  setInput: (val: string) => void;
  contentBlocks: ContentBlock.Multimodal.Data[];
  setContentBlocks: React.Dispatch<React.SetStateAction<ContentBlock.Multimodal.Data[]>>;

  // Context selectors
  contextSelections: ContextSelections;
  setContextSelections: React.Dispatch<React.SetStateAction<ContextSelections>>;
  resetContextSelections: () => void;
  hasContextSelections: boolean;
  contextToMetadata: () => Record<string, unknown> | undefined;

  // Context presets
  presetEditing: { presetId: string; presetName: string } | null;
  addPreset: (name: string, selections: ContextSelections, filters?: FilterSelections) => ContextPreset;
  renamePreset: (id: string, name: string) => void;
  duplicatePreset: (id: string) => ContextPreset | undefined;
  startPresetEditing: (preset: ContextPreset) => void;
  stopPresetEditing: () => void;
  savePresetEditing: (selections: ContextSelections, filters?: FilterSelections) => void;
  closeContextPopover: () => void;

  // Filter context
  filterSelections: FilterSelections;
  setFilterSelections: React.Dispatch<React.SetStateAction<FilterSelections>>;
  useAsContext: boolean;
  resetAllFilters: () => void;
  hasFilterSelections: boolean;
  filterToMetadata: () => Record<string, unknown> | undefined;

  // Shortcuts
  editingShortcut: Shortcut | null;
  addShortcut: (name: string, instructions: string, context: ContextSelections | null, presetId: string | null) => void;
  updateShortcut: (id: string, data: Partial<Omit<Shortcut, "id" | "createdAt" | "updatedAt">>) => void;
  closeShortcutPopover: () => void;
  openShortcutCreateDialog: (prefillData?: { instructions: string; context: ContextSelections | null }) => void;
  openShortcutEditDialog: (shortcut: Shortcut) => void;
  closeShortcutDialog: () => void;

  // Quotes
  addQuote: (text: string, messageId: string, sourceType: "ai" | "human") => void;
  clearSelection: () => void;
  clearQuotes: () => void;
  setQuotesFromTexts: (texts: string[]) => void;
  quotesToMetadata: () => { selected_text: string[] } | undefined;

  // Stream — use ReturnType of useStreamContext for exact type compatibility
  stream: any;

  // Suggestions
  clearSuggestions: () => void;

  // Artifact
  artifactContext: Record<string, unknown>;

  // Refs
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  scrollToBottomRef: RefObject<(() => void) | null>;

  // Preset name dialog
  setPresetNameDialogOpen: (open: boolean) => void;
  setRenameTarget: (target: { id: string; name: string } | null) => void;
  renameTarget: { id: string; name: string } | null;
}

export function useChatHandlers(deps: ChatHandlersDeps) {
  const {
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
  } = deps;

  // ─── Preset handlers ───────────────────────────────────────────────

  const handleRenamePreset = useCallback(
    (id: string, currentName: string) => {
      setRenameTarget({ id, name: currentName });
    },
    [setRenameTarget],
  );

  const handleConfirmRename = useCallback(
    (newName: string) => {
      if (renameTarget) {
        renamePreset(renameTarget.id, newName);
        setRenameTarget(null);
      }
    },
    [renameTarget, renamePreset, setRenameTarget],
  );

  const handleApplyPreset = useCallback(
    (preset: ContextPreset) => {
      setContextSelections(preset.selections);
      if (preset.filters) {
        setFilterSelections(preset.filters);
      }
      startPresetEditing(preset);
      closeContextPopover();
    },
    [setContextSelections, setFilterSelections, startPresetEditing, closeContextPopover],
  );

  const handleEditPreset = useCallback(
    (preset: ContextPreset) => {
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
      savePresetEditing(contextSelections, filterSelections);
    }
  }, [presetEditing, savePresetEditing, contextSelections, filterSelections]);

  const handleSaveAsNewPreset = useCallback(() => {
    setPresetNameDialogOpen(true);
  }, [setPresetNameDialogOpen]);

  const handleConfirmNewPreset = useCallback(
    (name: string) => {
      const preset = addPreset(name, contextSelections, filterSelections);
      startPresetEditing(preset);
    },
    [addPreset, contextSelections, filterSelections, startPresetEditing],
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

  // ─── Shortcut handlers ─────────────────────────────────────────────

  const handleSelectShortcut = useCallback(
    (shortcut: Shortcut) => {
      setInput(shortcut.instructions);
      if (shortcut.context) {
        setContextSelections(shortcut.context);
      }
      closeShortcutPopover();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [setInput, setContextSelections, closeShortcutPopover, textareaRef],
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
        updateShortcut(editingShortcut.id, { name, instructions, context, presetId });
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

  // ─── Quote handlers ─────────────────────────────────────────────────

  const handleAddQuote = useCallback(
    (text: string, messageId: string, sourceType: "ai" | "human") => {
      addQuote(text, messageId, sourceType);
      clearSelection();
    },
    [addQuote, clearSelection],
  );

  const handleScrollToQuoteSource = useCallback(
    (quote: { sourceMessageId: string; text: string }) => {
      const messageEl = messagesContainerRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${quote.sourceMessageId}"]`,
      );
      if (!messageEl) return;

      // Collect all text nodes in the message
      const walker = document.createTreeWalker(
        messageEl,
        NodeFilter.SHOW_TEXT,
      );
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) textNodes.push(node as Text);

      // Build concatenated text with segment positions
      let fullText = "";
      const segments: { node: Text; start: number; len: number }[] = [];
      for (const tn of textNodes) {
        const len = tn.textContent?.length ?? 0;
        segments.push({ node: tn, start: fullText.length, len });
        fullText += tn.textContent ?? "";
      }

      const matchStart = fullText.indexOf(quote.text);
      if (matchStart === -1) {
        // Fallback: highlight entire message
        messageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        messageEl.classList.add("quote-source-highlight");
        setTimeout(() => {
          document.addEventListener(
            "pointerdown",
            () => messageEl.classList.remove("quote-source-highlight"),
            { once: true },
          );
        }, 0);
        return;
      }

      const matchEnd = matchStart + quote.text.length;

      // Find overlapping text nodes, process in reverse to avoid index shift
      const marks: HTMLElement[] = [];
      const affected = segments
        .filter((s) => s.start < matchEnd && s.start + s.len > matchStart)
        .reverse();

      for (const seg of affected) {
        const hlStart = Math.max(0, matchStart - seg.start);
        const hlEnd = Math.min(seg.len, matchEnd - seg.start);
        const range = document.createRange();
        range.setStart(seg.node, hlStart);
        range.setEnd(seg.node, hlEnd);
        const mark = document.createElement("mark");
        mark.className = "quote-source-highlight-text";
        range.surroundContents(mark);
        marks.push(mark);
      }

      // Scroll to the first mark
      const scrollTarget = marks[marks.length - 1] ?? messageEl;
      scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });

      // Remove marks on next click anywhere
      const removeMarks = () => {
        for (const m of marks) {
          const parent = m.parentNode;
          if (!parent) continue;
          while (m.firstChild) parent.insertBefore(m.firstChild, m);
          parent.removeChild(m);
          parent.normalize();
        }
        document.removeEventListener("pointerdown", removeMarks);
      };
      // Use setTimeout so the current click doesn't immediately dismiss
      setTimeout(() => {
        document.addEventListener("pointerdown", removeMarks, { once: true });
      }, 0);
    },
    [messagesContainerRef],
  );

  // ─── Submit handlers ────────────────────────────────────────────────

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if ((input.trim().length === 0 && contentBlocks.length === 0) || stream.isLoading)
        return;

      const contextMeta = contextToMetadata();
      const quotesMeta = quotesToMetadata();
      const filterMeta = useAsContext ? filterToMetadata() : undefined;
      const combinedMeta = {
        ...(contextMeta ?? {}),
        ...(quotesMeta ?? {}),
        ...(filterMeta ? { filters: filterMeta } : {}),
      };
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
      const mergedContext = {
        ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
        ...(contextMeta ?? {}),
        ...(quotesMeta ?? {}),
        ...(filterMeta ? { filters: filterMeta } : {}),
      };
      const context =
        Object.keys(mergedContext).length > 0 ? mergedContext : undefined;

      stream.submit(
        { messages: [...toolMessages, newHumanMessage], context },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
          optimisticValues: (prev: { messages?: Message[] }) => ({
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
      scrollToBottomRef.current?.();
    },
    [
      input,
      contentBlocks,
      stream,
      contextToMetadata,
      quotesToMetadata,
      useAsContext,
      filterToMetadata,
      artifactContext,
      clearSuggestions,
      setInput,
      setContentBlocks,
      clearQuotes,
      scrollToBottomRef,
    ],
  );

  const handleRegenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      stream.submit(undefined, {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
      });
    },
    [stream],
  );

  const handleSuggestionSelect = useCallback(
    (text: string) => {
      const contextMeta = contextToMetadata();
      const quotesMeta = quotesToMetadata();
      const combinedMeta = { ...(contextMeta ?? {}), ...(quotesMeta ?? {}) };
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text }] as Message["content"],
        additional_kwargs:
          Object.keys(combinedMeta).length > 0
            ? { context: combinedMeta }
            : {},
      };
      const toolMessages = ensureToolCallsHaveResponses(stream.messages);
      const suggestionContext = {
        ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
        ...(contextMeta ?? {}),
        ...(quotesMeta ?? {}),
      };
      const context =
        Object.keys(suggestionContext).length > 0
          ? suggestionContext
          : undefined;
      stream.submit(
        { messages: [...toolMessages, newHumanMessage], context },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
          optimisticValues: (prev: { messages?: Message[] }) => ({
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
      clearQuotes();
      scrollToBottomRef.current?.();
    },
    [clearSuggestions, clearQuotes, stream, contextToMetadata, quotesToMetadata, artifactContext, scrollToBottomRef],
  );

  const handleReuse = useCallback(
    (text: string, context?: Record<string, string[]>) => {
      setInput(text);
      if (context) {
        setContextSelections({
          countries: context.countries ?? [],
          platforms: context.platforms ?? [],
          region: context.region ?? [],
          category: context.category ?? [],
          brand: context.brand ?? [],
          page: [],
        });
        if (context.selected_text?.length) {
          setQuotesFromTexts(context.selected_text);
        } else {
          clearQuotes();
        }
      } else {
        resetContextSelections();
        clearQuotes();
      }
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
    [setInput, setContextSelections, resetContextSelections, setQuotesFromTexts, clearQuotes, textareaRef],
  );

  return {
    // Preset handlers
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
    // Shortcut handlers
    handleSelectShortcut,
    handleEditShortcutFromPopover,
    handleCreateShortcutFromPopover,
    handleSaveShortcut,
    handleSaveShortcutAsNew,
    handleSaveAsShortcutFromToolbar,
    // Quote handlers
    handleAddQuote,
    handleScrollToQuoteSource,
    // Submit handlers
    handleSubmit,
    handleRegenerate,
    handleSuggestionSelect,
    handleReuse,
  };
}
