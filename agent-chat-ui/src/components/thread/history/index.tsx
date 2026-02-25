import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";
import { MessageSquare } from "lucide-react";

import { getContentString } from "../utils";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

function getThreadTitle(t: Thread): string {
  if (
    typeof t.values === "object" &&
    t.values &&
    "messages" in t.values &&
    Array.isArray(t.values.messages) &&
    t.values.messages?.length > 0
  ) {
    return getContentString(t.values.messages[0].content);
  }
  return t.thread_id;
}

function ThreadList({
  threads,
  collapsed,
  onThreadClick,
}: {
  threads: Thread[];
  collapsed?: boolean;
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        const title = getThreadTitle(t);
        const isActive = t.thread_id === threadId;

        if (collapsed) {
          return (
            <Tooltip key={t.thread_id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 mx-auto",
                    isActive && "bg-muted",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onThreadClick?.(t.thread_id);
                    if (isActive) return;
                    setThreadId(t.thread_id);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-[200px] truncate">{title}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <div key={t.thread_id} className="w-full">
            <Button
              variant="ghost"
              className={cn(
                "w-full items-start justify-start text-left font-normal text-sm",
                isActive && "bg-muted",
              )}
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (isActive) return;
                setThreadId(t.thread_id);
              }}
            >
              <p className="truncate text-ellipsis">{title}</p>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-auto p-1">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className={cn(
            "h-8",
            collapsed ? "w-8 mx-auto rounded-md" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export default function ThreadHistory({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  return (
    <>
      {/* Desktop — rendered inside the collapsible sidebar */}
      <div className="hidden lg:flex h-full flex-col">
        {threadsLoading ? (
          <ThreadHistoryLoading collapsed={collapsed} />
        ) : (
          <ThreadList threads={threads} collapsed={collapsed} />
        )}
      </div>

      {/* Mobile — Sheet overlay */}
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent
            side="left"
            className="flex lg:hidden"
          >
            <SheetHeader>
              <SheetTitle>Thread History</SheetTitle>
            </SheetHeader>
            <ThreadList
              threads={threads}
              onThreadClick={() => setChatHistoryOpen((o) => !o)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
