"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowDown, X } from "lucide-react";
import { MiniHeader } from "./mini-header";
import { MiniSidebar } from "./mini-sidebar";
import { MiniInput } from "./mini-input";
import { cn } from "@/lib/utils";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider, useStreamContext } from "@/providers/Stream";
import {
  ArtifactProvider,
  ArtifactContent,
  ArtifactTitle,
  useArtifactOpen,
} from "@/components/thread/artifact";
import { useQueryState } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { HumanMessage } from "../thread/messages/human";
import {
  AssistantMessage,
  AssistantMessageLoading,
} from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { getContentString } from "../thread/utils";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { Button } from "../ui/button";
import { v4 as uuidv4 } from "uuid";
import {
  useSuggestions,
  INITIAL_SUGGESTIONS,
} from "@/hooks/use-suggestions";
import { SuggestionCards } from "../thread/suggestion-cards";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";

const MINI_CHAT_WIDTH = 420;
const MINI_CHAT_DEFAULT_HEIGHT = 600;
const MINI_CHAT_MIN_HEIGHT = 400;
const MINI_CHAT_MAX_HEIGHT = 800;
const LS_HEIGHT_KEY = "mini-chat:height";

function getStoredHeight(): number {
  if (typeof window === "undefined") return MINI_CHAT_DEFAULT_HEIGHT;
  const stored = localStorage.getItem(LS_HEIGHT_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (
      !isNaN(parsed) &&
      parsed >= MINI_CHAT_MIN_HEIGHT &&
      parsed <= MINI_CHAT_MAX_HEIGHT
    ) {
      return parsed;
    }
  }
  return MINI_CHAT_DEFAULT_HEIGHT;
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
      <div ref={context.contentRef} className={props.contentClassName}>
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
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
        props.className,
      )}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}

function ScrollToBottomBridge({
  scrollRef,
}: {
  scrollRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { scrollToBottom } = useStickToBottomContext();
  useEffect(() => {
    scrollRef.current = scrollToBottom;
  }, [scrollToBottom, scrollRef]);
  return null;
}

function MiniThreadContent({
  onClose,
  onToggleSidebar,
  onCloseSidebar,
  sidebarOpen,
}: {
  onClose: () => void;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  sidebarOpen: boolean;
}) {
  const [artifactOpen, onArtifactClose] = useArtifactOpen();
  const stream = useStreamContext();
  const [threadId] = useQueryState("threadId");
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollToBottomRef = useRef<(() => void) | null>(null);

  // --- Suggestions ---
  const [showSuggestions, setShowSuggestions] = useState(true);
  const {
    suggestions,
    isFetchingSuggestions,
    fetchSuggestions,
    clearSuggestions,
  } = useSuggestions();

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

  const chatStarted = !!threadId || !!messages.length;
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

  const visibleSuggestions = !chatStarted
    ? INITIAL_SUGGESTIONS
    : isLoading
      ? []
      : suggestions;
  const showSuggestionPlaceholders =
    chatStarted && !isLoading && isFetchingSuggestions;

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
      scrollToBottomRef.current?.();
    },
    [clearSuggestions, stream],
  );

  const handleRegenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      if (!parentCheckpoint) return;
      stream.submit(undefined, {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
      });
    },
    [stream],
  );

  const handleScrollToBottom = useCallback(() => {
    scrollToBottomRef.current?.();
  }, []);

  return (
    <>
      <MiniHeader onClose={onClose} onToggleSidebar={onToggleSidebar} />
      <MiniSidebar open={sidebarOpen} onClose={() => onCloseSidebar()} />

      {/* Message area */}
      <StickToBottom className="relative flex-1 overflow-hidden">
        <ScrollToBottomBridge scrollRef={scrollToBottomRef} />
        <StickyToBottomContent
          className={cn(
            "absolute inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent",
            !chatStarted && "flex flex-col items-stretch",
            chatStarted && "grid grid-rows-[1fr_auto]",
          )}
          contentClassName="pt-4 pb-4 px-3 flex flex-col gap-4 w-full"
          content={
            <div ref={messagesContainerRef}>
              {!chatStarted && (
                <div className="flex flex-col items-center justify-center gap-2 pt-[30%]">
                  <MessageCircle className="h-8 w-8 text-primary/30" />
                  <p className="text-sm text-muted-foreground">
                    How can I help you?
                  </p>
                </div>
              )}

              {messages
                .filter(
                  (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX),
                )
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
            </div>
          }
          footer={
            <div className="sticky bottom-0 z-20 flex justify-center pointer-events-none [&>*]:pointer-events-auto">
              <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-2" />
            </div>
          }
        />
      </StickToBottom>

      {/* Inline artifact */}
      <AnimatePresence>
        {artifactOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "40%", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden border-t border-border"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                <ArtifactTitle className="truncate text-xs font-medium" />
                <button
                  onClick={onArtifactClose}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <ArtifactContent className="flex-1 overflow-auto" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence initial={false}>
        {showSuggestions &&
          (visibleSuggestions.length > 0 || showSuggestionPlaceholders) && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 overflow-hidden border-t border-border px-3 pt-2"
            >
              <SuggestionCards
                suggestions={visibleSuggestions}
                loading={showSuggestionPlaceholders}
                onSelect={handleSuggestionSelect}
              />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Input area */}
      <MiniInput
        showSuggestions={showSuggestions}
        onToggleSuggestions={() => setShowSuggestions((p) => !p)}
        clearSuggestions={clearSuggestions}
        scrollToBottom={handleScrollToBottom}
      />
    </>
  );
}

export function MiniThread() {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(MINI_CHAT_DEFAULT_HEIGHT);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);
  const heightRef = useRef(height);
  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  // Load persisted height on mount
  useEffect(() => {
    setHeight(getStoredHeight());
  }, []);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeStartY.current = e.clientY;
      resizeStartHeight.current = height;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [height],
  );

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;
      const delta = resizeStartY.current - e.clientY;
      const newHeight = Math.min(
        MINI_CHAT_MAX_HEIGHT,
        Math.max(MINI_CHAT_MIN_HEIGHT, resizeStartHeight.current + delta),
      );
      setHeight(newHeight);
    },
    [isResizing],
  );

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    localStorage.setItem(LS_HEIGHT_KEY, String(heightRef.current));
  }, [isResizing]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
            )}
            style={{
              width: MINI_CHAT_WIDTH,
              height,
              transformOrigin: "bottom right",
            }}
          >
            {/* Resize handle */}
            <div
              onPointerDown={handleResizeStart}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              className="absolute -top-1 left-0 right-0 z-50 flex h-3 cursor-ns-resize items-center justify-center"
            >
              <div className="h-1 w-10 rounded-full bg-border opacity-0 transition-opacity hover:opacity-100" />
            </div>
            <ThreadProvider>
              <StreamProvider>
                <ArtifactProvider>
                  <MiniThreadContent
                    onClose={() => setIsOpen(false)}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onCloseSidebar={() => setSidebarOpen(false)}
                    sidebarOpen={sidebarOpen}
                  />
                </ArtifactProvider>
              </StreamProvider>
            </ThreadProvider>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => setIsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
