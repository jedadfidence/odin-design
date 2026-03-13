"use client";

import { ReactNode, useEffect, useState } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToBottomBridge({
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

export function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      className={cn("w-full h-full", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ScrollToBottom(props: { className?: string }) {
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
