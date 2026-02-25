import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
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
  Globe,
  Megaphone,
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
import { ContextBadges } from "./context-badges";
import { ContextPopover } from "./context-popover";

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
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [sidebarCollapsed, setSidebarCollapsed] = useQueryState(
    "sidebarCollapsed",
    parseAsBoolean.withDefault(false),
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const contextMeta = contextToMetadata();
    const mergedContext = {
      ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
      ...(contextMeta ?? {}),
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
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text }] as Message["content"],
      };
      const toolMessages = ensureToolCallsHaveResponses(stream.messages);
      const contextMeta = contextToMetadata();
      const suggestionContext = {
        ...(Object.keys(artifactContext).length > 0 ? artifactContext : {}),
        ...(contextMeta ?? {}),
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
    },
    [clearSuggestions, stream, contextToMetadata, artifactContext],
  );

  const chatStarted = !!threadId || !!messages.length;

  const isComposingMessage = input.trim().length > 0 || contentBlocks.length > 0 || hasContextSelections;
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
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
                className="lg:hidden h-8 w-8"
                onClick={() => setChatHistoryOpen((p) => !p)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <button
                onClick={() => setThreadId(null)}
                className="flex cursor-pointer items-center gap-2"
              >
                <img
                  src="/adfidence-logo.svg"
                  alt="Adfidence"
                  className="h-6 w-auto object-contain flex-shrink-0"
                />
                <span className="text-lg font-semibold tracking-tight">
                  Assistant
                </span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              {chatStarted && (
                <>
                  <TooltipIconButton
                    size="sm"
                    tooltip="Generate report"
                    variant="ghost"
                    onClick={() => setReportSheetOpen(true)}
                    data-testid="report-btn"
                  >
                    <FileBarChart className="h-4 w-4" />
                  </TooltipIconButton>
                  <TooltipIconButton
                    size="sm"
                    tooltip="New thread"
                    variant="ghost"
                    onClick={() => setThreadId(null)}
                  >
                    <SquarePen className="h-4 w-4" />
                  </TooltipIconButton>
                </>
              )}
              <TooltipIconButton
                size="sm"
                tooltip={hideToolCalls ? "Show tool calls" : "Hide tool calls"}
                variant="ghost"
                onClick={() => setHideToolCalls(!(hideToolCalls ?? true))}
                className={cn(
                  "h-8 w-8",
                  hideToolCalls !== false && "text-muted-foreground",
                  hideToolCalls === false && "text-primary",
                )}
              >
                <Wrench className="h-4 w-4" />
              </TooltipIconButton>
              <ThemeToggle />
            </div>
          </header>

          <StickToBottom className="relative flex-1 overflow-hidden">
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
              contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
              content={
                <>
                  {!chatStarted && (
                    <div className="flex flex-col items-center justify-center gap-3 pt-[20vh]">
                      <div className="flex items-center gap-3">
                        <img
                          src="/adfidence-logo.svg"
                          alt="Adfidence"
                          className="h-10 w-auto object-contain flex-shrink-0"
                        />
                        <h1 className="text-2xl font-semibold tracking-tight">
                          Assistant
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
                </>
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
                        className="overflow-hidden"
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
                    ref={dropRef}
                    className={cn(
                      "bg-background/80 backdrop-blur-sm relative z-10 mx-auto mb-6 w-full max-w-[816px] rounded-2xl shadow-lg transition-all",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-border",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-rows-[1fr_auto] gap-2"
                    >
                      <ContentBlocksPreview
                        blocks={contentBlocks}
                        onRemove={removeBlock}
                      />
                      <ContextBadges selections={contextSelections} onRemove={removeItem} />
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
                        align="start"
                        side="top"
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

                      <div className="flex items-center gap-6 px-4 py-3">
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

                        <ContextPopover
                          open={contextPopoverOpen && triggerSource === "icon" && activeCategory === "countries"}
                          onOpenChange={(open) => {
                            if (open) openContextPopover("countries", "icon");
                            else closeContextPopover();
                          }}
                          activeCategory={activeCategory}
                          onCategorySelect={setActiveCategory}
                          selections={contextSelections}
                          onToggleItem={toggleItem}
                          align="start"
                          side="top"
                        >
                          <TooltipIconButton
                            tooltip="Countries"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8",
                              contextSelections.countries.length > 0
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            <Globe className="h-4 w-4" />
                          </TooltipIconButton>
                        </ContextPopover>

                        <ContextPopover
                          open={contextPopoverOpen && triggerSource === "icon" && activeCategory === "platforms"}
                          onOpenChange={(open) => {
                            if (open) openContextPopover("platforms", "icon");
                            else closeContextPopover();
                          }}
                          activeCategory={activeCategory}
                          onCategorySelect={setActiveCategory}
                          selections={contextSelections}
                          onToggleItem={toggleItem}
                          align="start"
                          side="top"
                        >
                          <TooltipIconButton
                            tooltip="Platforms"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8",
                              contextSelections.platforms.length > 0
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            <Megaphone className="h-4 w-4" />
                          </TooltipIconButton>
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
                    </form>
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
      <ReportSheet open={reportSheetOpen} onOpenChange={setReportSheetOpen} />
    </div>
  );
}
