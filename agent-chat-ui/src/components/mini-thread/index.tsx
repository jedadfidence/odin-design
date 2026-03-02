"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/thread/artifact";

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

export function MiniThread() {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(MINI_CHAT_DEFAULT_HEIGHT);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                  {/* Header placeholder */}
                  <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
                    <span className="text-sm font-medium">AI Chat</span>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Message area placeholder */}
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <MessageCircle className="h-8 w-8 text-primary/30" />
                      <p>Messages will render here</p>
                    </div>
                  </div>

                  {/* Input placeholder */}
                  <div className="shrink-0 border-t border-border p-3">
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      Input will render here
                    </div>
                  </div>
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
