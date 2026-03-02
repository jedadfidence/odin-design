"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowDown } from "lucide-react";
import { MiniHeader } from "./mini-header";
import { cn } from "@/lib/utils";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider, useStreamContext } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/thread/artifact";
import { useQueryState } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { HumanMessage } from "../thread/messages/human";
import {
  AssistantMessage,
  AssistantMessageLoading,
} from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { getContentString } from "../thread/utils";
import { Checkpoint } from "@langchain/langgraph-sdk";
import { Button } from "../ui/button";

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

function MiniThreadContent({
  onClose,
  onToggleSidebar,
}: {
  onClose: () => void;
  onToggleSidebar: () => void;
}) {
  const stream = useStreamContext();
  const [threadId] = useQueryState("threadId");
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <MiniHeader onClose={onClose} onToggleSidebar={onToggleSidebar} />

      {/* Message area */}
      <StickToBottom className="relative flex-1 overflow-hidden">
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

      {/* Input placeholder */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Input will render here
        </div>
      </div>
    </>
  );
}

export function MiniThread() {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(MINI_CHAT_DEFAULT_HEIGHT);
  const [_sidebarOpen, setSidebarOpen] = useState(false);

  // Load persisted height on mount
  useEffect(() => {
    setHeight(getStoredHeight());
  }, []);

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
            <ThreadProvider>
              <StreamProvider>
                <ArtifactProvider>
                  <MiniThreadContent
                    onClose={() => setIsOpen(false)}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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
