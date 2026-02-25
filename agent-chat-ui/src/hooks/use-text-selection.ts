import { useState, useEffect, useCallback, RefObject } from "react";

export interface TextSelectionState {
  text: string;
  messageId: string;
  sourceType: "ai" | "human";
  rect: DOMRect;
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelectionState | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Small delay to let browser finalize the selection
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          setSelection(null);
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          setSelection(null);
          return;
        }

        // Walk up from the selection anchor to find the message wrapper
        const anchorNode = sel.anchorNode;
        if (!anchorNode) {
          setSelection(null);
          return;
        }

        const messageEl = (
          anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement
        )?.closest<HTMLElement>("[data-message-id]");

        if (!messageEl || !container.contains(messageEl)) {
          setSelection(null);
          return;
        }

        const messageId = messageEl.dataset.messageId!;
        const sourceType = (messageEl.dataset.messageType as "ai" | "human") ?? "ai";

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelection({ text, messageId, sourceType, rect });
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      // If clicking on the selection popup itself, don't clear
      const target = e.target as HTMLElement;
      if (target.closest("[data-selection-popup]")) return;
      setSelection(null);
    };

    container.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef]);

  return { selection, clearSelection };
}
