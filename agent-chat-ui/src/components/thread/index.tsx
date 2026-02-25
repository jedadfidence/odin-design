import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef, useCallback } from "react";
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
  ChevronsLeft,
  ChevronsRight,
  SquarePen,
  XIcon,
  Plus,
  FileBarChart,
  Menu,
  Lightbulb,
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

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
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

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

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
      stream.submit(
        { messages: [...toolMessages, newHumanMessage] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
          optimisticValues: (prev) => ({
            ...prev,
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
    [clearSuggestions, stream],
  );

  const chatStarted = !!threadId || !!messages.length;

  const isComposingMessage = input.trim().length > 0 || contentBlocks.length > 0;
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
          <header className="flex h-12 items-center justify-between border-b border-border px-3">
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
              <ThemeToggle />
            </div>
          </header>

          <StickToBottom className="relative flex-1 overflow-hidden">
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
                <div className="sticky bottom-0 flex flex-col items-center gap-8 pointer-events-none [&>*]:pointer-events-auto">
                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  {showSuggestions && (visibleSuggestions.length > 0 || showSuggestionPlaceholders) && (
                    <SuggestionCards
                      suggestions={visibleSuggestions}
                      loading={showSuggestionPlaceholders}
                      onSelect={handleSuggestionSelect}
                    />
                  )}

                  <div
                    ref={dropRef}
                    className={cn(
                      "bg-background/80 backdrop-blur-sm relative z-10 mx-auto mb-6 w-full max-w-3xl rounded-2xl shadow-lg transition-all",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-border",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                    >
                      <ContentBlocksPreview
                        blocks={contentBlocks}
                        onRemove={removeBlock}
                      />
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
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
                        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 text-foreground shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                      />

                      <div className="flex items-center gap-6 p-2 pt-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="render-tool-calls"
                              checked={hideToolCalls ?? true}
                              onCheckedChange={setHideToolCalls}
                            />
                            <Label
                              htmlFor="render-tool-calls"
                              className="text-sm text-muted-foreground"
                            >
                              Hide Tool Calls
                            </Label>
                          </div>
                        </div>
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
                            className="ml-auto bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl shadow-md transition-all"
                            disabled={
                              isLoading ||
                              (!input.trim() && contentBlocks.length === 0)
                            }
                          >
                            Send
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
