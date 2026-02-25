import React from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { TextSelectionState } from "@/hooks/use-text-selection";

interface SelectionPopupProps {
  selection: TextSelectionState | null;
  containerRef: React.RefObject<HTMLElement | null>;
  onAdd: (text: string, messageId: string, sourceType: "ai" | "human") => void;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
  selection,
  containerRef,
  onAdd,
}) => {
  if (!selection || !containerRef.current) return null;

  const container = containerRef.current;
  const containerRect = container.getBoundingClientRect();

  // Position relative to the scroll container
  const top =
    selection.rect.bottom - containerRect.top + container.scrollTop + 6;
  const left = Math.min(
    Math.max(
      selection.rect.left +
        selection.rect.width / 2 -
        containerRect.left -
        70,
      8,
    ),
    containerRect.width - 160,
  );

  const handleClick = () => {
    onAdd(selection.text, selection.messageId, selection.sourceType);
    window.getSelection()?.removeAllRanges();
  };

  return createPortal(
    <button
      type="button"
      data-selection-popup
      onClick={handleClick}
      className="absolute z-50 flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg transition-opacity hover:opacity-90"
      style={{ top, left }}
    >
      <Plus className="h-3.5 w-3.5" />
      Add to context
    </button>,
    container,
  );
};
