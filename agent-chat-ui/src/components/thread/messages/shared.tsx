import {
  XIcon,
  SendHorizontal,
  RefreshCcw,
  Pencil,
  Copy,
  CopyCheck,
  ChevronLeft,
  ChevronRight,
  Repeat2,
} from "lucide-react";
import { TooltipIconButton } from "../tooltip-icon-button";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function ContentCopyable({
  content,
  disabled,
}: {
  content: string;
  disabled: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipIconButton
      onClick={(e) => handleCopy(e)}
      variant="ghost"
      tooltip="Copy content"
      disabled={disabled}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CopyCheck className="text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Copy />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipIconButton>
  );
}

export function BranchSwitcher({
  branch,
  branchOptions,
  onSelect,
  isLoading,
}: {
  branch: string | undefined;
  branchOptions: string[] | undefined;
  onSelect: (branch: string) => void;
  isLoading: boolean;
}) {
  if (!branchOptions || !branch) return null;
  const index = branchOptions.indexOf(branch);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1"
        onClick={() => {
          const prevBranch = branchOptions[index - 1];
          if (!prevBranch) return;
          onSelect(prevBranch);
        }}
        disabled={isLoading}
      >
        <ChevronLeft />
      </Button>
      <span className="text-sm">
        {index + 1} / {branchOptions.length}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1"
        onClick={() => {
          const nextBranch = branchOptions[index + 1];
          if (!nextBranch) return;
          onSelect(nextBranch);
        }}
        disabled={isLoading}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

export function CommandBar({
  content,
  isHumanMessage,
  isAiMessage,
  isEditing,
  setIsEditing,
  handleSubmitEdit,
  handleRegenerate,
  isLoading,
  onReuse,
  messageContext,
}: {
  content: string;
  isHumanMessage?: boolean;
  isAiMessage?: boolean;
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmitEdit?: () => void;
  handleRegenerate?: () => void;
  isLoading: boolean;
  onReuse?: (text: string, context?: Record<string, string[]>) => void;
  messageContext?: Record<string, string[]>;
}) {
  const [reusePopoverOpen, setReusePopoverOpen] = useState(false);
  const hasContext = messageContext && Object.keys(messageContext).length > 0;

  if (isHumanMessage && isAiMessage) {
    throw new Error(
      "Can only set one of isHumanMessage or isAiMessage to true, not both.",
    );
  }

  if (!isHumanMessage && !isAiMessage) {
    throw new Error(
      "One of isHumanMessage or isAiMessage must be set to true.",
    );
  }

  if (
    isHumanMessage &&
    (isEditing === undefined ||
      setIsEditing === undefined ||
      handleSubmitEdit === undefined)
  ) {
    throw new Error(
      "If isHumanMessage is true, all of isEditing, setIsEditing, and handleSubmitEdit must be set.",
    );
  }

  const showEdit =
    isHumanMessage &&
    isEditing !== undefined &&
    !!setIsEditing &&
    !!handleSubmitEdit;

  if (isHumanMessage && isEditing && !!setIsEditing && !!handleSubmitEdit) {
    return (
      <div className="flex items-center gap-2">
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Cancel edit"
          variant="ghost"
          onClick={() => {
            setIsEditing(false);
          }}
        >
          <XIcon />
        </TooltipIconButton>
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Submit"
          variant="secondary"
          onClick={handleSubmitEdit}
        >
          <SendHorizontal />
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ContentCopyable
        content={content}
        disabled={isLoading}
      />
      {isAiMessage && !!handleRegenerate && (
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Refresh"
          variant="ghost"
          onClick={handleRegenerate}
        >
          <RefreshCcw />
        </TooltipIconButton>
      )}
      {isHumanMessage && onReuse && (
        hasContext ? (
          <Popover open={reusePopoverOpen} onOpenChange={setReusePopoverOpen}>
            <PopoverTrigger asChild>
              <span>
                <TooltipIconButton
                  disabled={isLoading}
                  tooltip="Reuse"
                  variant="ghost"
                >
                  <Repeat2 />
                </TooltipIconButton>
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="w-44 p-1"
              align="center"
              side="top"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onReuse(content);
                  setReusePopoverOpen(false);
                }}
              >
                Reuse prompt
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onReuse(content, messageContext);
                  setReusePopoverOpen(false);
                }}
              >
                Reuse with context
              </button>
            </PopoverContent>
          </Popover>
        ) : (
          <TooltipIconButton
            disabled={isLoading}
            tooltip="Reuse"
            variant="ghost"
            onClick={() => onReuse(content)}
          >
            <Repeat2 />
          </TooltipIconButton>
        )
      )}
      {showEdit && (
        <TooltipIconButton
          disabled={isLoading}
          tooltip="Edit"
          variant="ghost"
          onClick={() => {
            setIsEditing?.(true);
          }}
        >
          <Pencil />
        </TooltipIconButton>
      )}
    </div>
  );
}
