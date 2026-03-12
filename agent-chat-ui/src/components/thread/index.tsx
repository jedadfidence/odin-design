import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { SuggestionCards } from "./suggestion-cards";
import {
  useSuggestions,
  INITIAL_SUGGESTIONS,
} from "@/hooks/use-suggestions";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  LoaderCircle,
  SendHorizontal,
  ChevronsLeft,
  ChevronsRight,
  SquarePen,
  XIcon,
  Plus,
  FileBarChart,
  Menu,
  Lightbulb,
  Wrench,
  Bookmark,
  PanelBottomClose,
} from "lucide-react";
import { ReportSheet } from "./report-sheet";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
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
import { ThemeToggle } from "../ui/theme-toggle";
import { useContextSelectors } from "@/hooks/use-context-selectors";
import { ContextSelections, ContextCategory } from "@/lib/context-selectors";
import { useFilters } from "@/hooks/use-filters";
import { FilterCategory as FilterCategoryType } from "@/lib/filter-data";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { useTextQuotes } from "@/hooks/use-text-quotes";
import { useTextSelection } from "@/hooks/use-text-selection";
import { ContextBadges } from "./context-badges";
import { ContextPopover } from "./context-popover";
import { SelectionPopup } from "./selection-popup";
import { QuoteCards } from "./quote-cards";
import { useContextPresets } from "@/hooks/use-context-presets";
import { PresetNameDialog } from "./preset-name-dialog";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Shortcut } from "@/lib/shortcuts";
import { ShortcutPopover } from "./shortcut-popover";
import { ShortcutDialog } from "./shortcut-dialog";

function ScrollToBottomBridge({ scrollRef }: { scrollRef: React.MutableRefObject<(() => void) | null> }) {
  const { scrollToBottom } = useStickToBottomContext();
  useEffect(() => {
    scrollRef.current = scrollToBottom;
  }, [scrollToBottom, scrollRef]);
  return null;
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const [hovered, setHovered] = useState(false);

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm",
        props.className,
      )}
      onClick={() => scrollToBottom()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="relative h-4 w-4 overflow-hidden">
        {/* Visible arrow — exits downward on hover, enters from top on unhover */}
        <ArrowDown
          className="h-4 w-4"
          style={{
            animation: hovered
              ? "arrow-exit-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
              : "arrow-reset-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
        {/* Second arrow — enters from top on hover, exits downward on unhover */}
        <ArrowDown
          className="absolute inset-0 h-4 w-4"
          style={{
            animation: hovered
              ? "arrow-enter-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
              : "arrow-exit-down 450ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      </span>
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function Thread() {
  const searchParams = useSearchParams();
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
  } = useFilters();
  const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  const handleRenamePreset = useCallback((id: string, currentName: string) => {
    setRenameTarget({ id, name: currentName });
  }, []);

  const handleConfirmRename = useCallback((newName: string) => {
    if (renameTarget) {
      renamePreset(renameTarget.id, newName);
      setRenameTarget(null);
    }
  }, [renameTarget, renamePreset]);

  const handleApplyPreset = useCallback((preset: import("@/lib/context-presets").ContextPreset) => {
    setContextSelections(preset.selections);
    if (preset.filters) {
      setFilterSelections(preset.filters);
    }
    startPresetEditing(preset);
    closeContextPopover();
  }, [setContextSelections, setFilterSelections, startPresetEditing, closeContextPopover]);

  const handleEditPreset = useCallback((preset: import("@/lib/context-presets").ContextPreset) => {
    setContextSelections(preset.selections);
    startPresetEditing(preset);
    closeContextPopover();
  }, [setContextSelections, startPresetEditing, closeContextPopover]);

  const handleDuplicatePreset = useCallback((presetId: string) => {
    const newPreset = duplicatePreset(presetId);
    if (newPreset) {
      setContextSelections(newPreset.selections);
      startPresetEditing(newPreset);
      closeContextPopover();
    }
  }, [duplicatePreset, setContextSelections, startPresetEditing, closeContextPopover]);

  const handleSavePreset = useCallback(() => {
    if (presetEditing) {
      savePresetEditing(contextSelections);
    }
  }, [presetEditing, savePresetEditing, contextSelections]);

  const handleSaveAsNewPreset = useCallback(() => {
    setPresetNameDialogOpen(true);
  }, []);

  const handleConfirmNewPreset = useCallback((name: string) => {
    const preset = addPreset(name, contextSelections, filterSelections);
    startPresetEditing(preset);
  }, [addPreset, contextSelections, filterSelections, startPresetEditing]);

  const handleDeactivatePreset = useCallback(() => {
    stopPresetEditing();
  }, [stopPresetEditing]);

  const handleClearSelections = useCallback(() => {
    stopPresetEditing();
    resetContextSelections();
  }, [stopPresetEditing, resetContextSelections]);

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
    [],
  );

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;

    const contextMeta = contextToMetadata();
    const quotesMeta = quotesToMetadata();
    const filterMeta = useAsContext ? filterToMetadata() : undefined;
    const combinedMeta = { ...(contextMeta ?? {}), ...(quotesMeta ?? {}), ...(filterMeta ? { filters: filterMeta } : {}) };
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
      additional_kwargs: Object.keys(combinedMeta).length > 0
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
    scrollToBottomRef.current?.();
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const handleSuggestionSelect = useCallback(
    (text: string) => {
      const contextMeta = contextToMetadata();
      const quotesMeta = quotesToMetadata();
      const combinedMeta = { ...(contextMeta ?? {}), ...(quotesMeta ?? {}) };
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text }] as Message["content"],
        additional_kwargs: Object.keys(combinedMeta).length > 0
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
      clearQuotes();
      scrollToBottomRef.current?.();
    },
    [clearSuggestions, clearQuotes, stream, contextToMetadata, quotesToMetadata, artifactContext],
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
    [setContextSelections, resetContextSelections, setQuotesFromTexts, clearQuotes],
  );

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
      <div
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-14" : "w-60",
        )}
      >
        <div className={cn(
          "flex items-center p-2",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}>
          {!sidebarCollapsed && (
            <span className="text-sm font-medium text-sidebar-foreground pl-2">History</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarCollapsed((p) => !p)}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ThreadHistory collapsed={sidebarCollapsed ?? false} />
        </div>
      </div>

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
          <header className="flex h-12 items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setChatHistoryOpen((p) => !p)}
              >
                <Menu />
              </Button>
              {chatStarted && (
                <button
                  onClick={() => setThreadId(null)}
                  className="flex cursor-pointer items-end gap-2"
                >
                  <img
                    src="/adfidence-logo.svg"
                    alt="Adfidence"
                    className="h-5 w-auto object-contain flex-shrink-0 dark:brightness-0 dark:invert"
                  />
                  <span className="text-2xl font-semibold italic tracking-tight leading-none translate-y-[0.12em] text-[#4586F7] dark:text-foreground">
                    AI
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {chatStarted && (
                <>
                  <TooltipIconButton
                    tooltip="Generate report"
                    variant="ghost"
                    onClick={() => setReportSheetOpen(true)}
                    data-testid="report-btn"
                  >
                    <FileBarChart />
                  </TooltipIconButton>
                  <TooltipIconButton
                    tooltip="New thread"
                    variant="ghost"
                    onClick={() => setThreadId(null)}
                  >
                    <SquarePen />
                  </TooltipIconButton>
                </>
              )}
              <TooltipIconButton
                tooltip={hideToolCalls ? "Show details" : "Hide details"}
                variant="ghost"
                onClick={() => setHideToolCalls(!(hideToolCalls ?? true))}
                className={cn(
                  hideToolCalls === false && "text-primary",
                )}
              >
                <Wrench />
              </TooltipIconButton>
              <Link href={`/demo${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}>
                <TooltipIconButton tooltip="Minimize chat" variant="ghost" className="h-8 w-8">
                  <PanelBottomClose className="h-4 w-4" />
                </TooltipIconButton>
              </Link>
              <ThemeToggle />
            </div>
          </header>

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
                  <div
                    ref={(el) => {
                      dropRef.current = el;
                      inputBoxRef.current = el;
                    }}
                    className={cn(
                      "bg-background/80 backdrop-blur-sm relative z-10 w-full rounded-2xl transition-all",
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
                      <div className="flex items-center gap-2 px-5 pt-2">
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
                          className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
                        />
                        <Label htmlFor="use-filters" className="text-xs text-muted-foreground cursor-pointer">
                          Ask AI using your filters
                        </Label>
                      </div>
                      {useAsContext && !hasFilterSelections && (
                        <p className="px-5 pt-1 text-[11px] text-muted-foreground">
                          Select filters in the panel to give AI more context
                        </p>
                      )}
                      <AnimatePresence initial={false}>
                        {(contextSelections.countries.length > 0 || contextSelections.platforms.length > 0 || contextSelections.region.length > 0 || contextSelections.category.length > 0 || contextSelections.brand.length > 0 || contextSelections.page.length > 0) && (
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
                              onRemove={removeItem}
                              onClearAll={handleClearSelections}
                              onSave={presetEditing && hasContextSelections ? handleSavePreset : undefined}
                              onSaveAsNew={hasContextSelections ? handleSaveAsNewPreset : undefined}
                              activePresetName={presetEditing?.presetName ?? null}
                              onDeactivatePreset={handleDeactivatePreset}
                              onRenameActivePreset={presetEditing ? () => handleRenamePreset(presetEditing.presetId, presetEditing.presetName) : undefined}
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
                        onToggleItem={toggleItem}
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
                          onToggleItem={toggleItem}
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
        <div className="relative flex flex-col border-l border-border">
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
        onToggleItem={toggleFilterItem}
        onSelectAll={selectAllFilter}
        onClearCategory={clearFilterCategory}
        onDateRangeChange={setDateRange}
        onResetAll={resetAllFilters}
        hasSelections={hasFilterSelections}
        totalSelected={filterTotalSelected}
        presets={presets}
        onApplyPreset={handleApplyPreset}
        onSavePreset={() => setPresetNameDialogOpen(true)}
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
