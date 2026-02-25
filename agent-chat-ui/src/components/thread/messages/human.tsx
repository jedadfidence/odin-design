import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { getContentString } from "../utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";
import { MultimodalPreview } from "@/components/thread/MultimodalPreview";
import { isBase64ContentBlock } from "@/lib/multimodal-utils";
import { ContextBadges } from "../context-badges";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TextSelect } from "lucide-react";
import { ContextCategory, ContextSelections, EMPTY_SELECTIONS } from "@/lib/context-selectors";

function MessageContextBadges({ message }: { message: Message }) {
  const ctx = message.additional_kwargs?.context as
    | Record<string, string[] | undefined>
    | undefined;
  if (!ctx) return null;

  const selections: ContextSelections = {
    ...EMPTY_SELECTIONS,
    ...Object.fromEntries(
      (["countries", "platforms"] as ContextCategory[])
        .filter((cat) => ctx[cat])
        .map((cat) => [cat, ctx[cat]]),
    ),
  };

  const quoteCount = ctx.selected_text?.length ?? 0;

  const hasAnything =
    selections.countries.length > 0 ||
    selections.platforms.length > 0 ||
    quoteCount > 0;
  if (!hasAnything) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <ContextBadges
        selections={selections}
        className="justify-end gap-1 px-0 pt-0"
      />
      {quoteCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="cursor-default gap-1 rounded-full border-transparent bg-amber-100 text-xs font-normal text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
            >
              <TextSelect className="h-3 w-3" />
              {quoteCount} {quoteCount === 1 ? "quote" : "quotes"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} hideArrow className="w-max max-w-[350px] space-y-1.5 rounded-3xl border-border/60 bg-background/80 px-5 py-4 text-foreground shadow-lg backdrop-blur-sm text-left text-wrap text-sm">
            {ctx.selected_text!.map((text, i) => (
              <p key={i} className="leading-snug">
                &ldquo;{text}&rdquo;
              </p>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading,
  onReuse,
}: {
  message: Message;
  isLoading: boolean;
  onReuse?: (text: string, context?: Record<string, string[]>) => void;
}) {
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);
  const messageContext = message.additional_kwargs?.context as
    | Record<string, string[]>
    | undefined;

  const handleSubmitEdit = () => {
    setIsEditing(false);

    const newMessage: Message = { type: "human", content: value };
    thread.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
      },
    );
  };

  return (
    <div
      className={cn(
        "group ml-auto flex w-full items-center justify-end gap-2",
        isEditing && "max-w-xl",
      )}
      data-message-id={message.id}
      data-message-type="human"
    >
      <div className={cn("flex w-full flex-col gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
          />
        ) : (
          <div className="flex w-full flex-col items-end gap-2">
            {/* Render images and files if no text */}
            {Array.isArray(message.content) && message.content.length > 0 && (
              <div className="flex flex-wrap items-end justify-end gap-2">
                {message.content.reduce<React.ReactNode[]>(
                  (acc, block, idx) => {
                    if (isBase64ContentBlock(block)) {
                      acc.push(
                        <MultimodalPreview
                          key={idx}
                          block={block}
                          size="md"
                        />,
                      );
                    }
                    return acc;
                  },
                  [],
                )}
              </div>
            )}
            {/* Render text if present, otherwise fallback to file/image name */}
            {contentString ? (
              <p className="bg-[#E4EFFE] dark:bg-[#1F356F] text-foreground w-fit max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-right whitespace-pre-wrap">
                {contentString}
              </p>
            ) : null}
            <MessageContextBadges message={message} />
          </div>
        )}

        <div
          className={cn(
            "ml-auto flex items-center gap-2 transition-opacity",
            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            isEditing && "opacity-100",
          )}
        >
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => thread.setBranch(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(contentString);
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
            onReuse={onReuse}
            messageContext={messageContext}
          />
        </div>
      </div>
    </div>
  );
}
