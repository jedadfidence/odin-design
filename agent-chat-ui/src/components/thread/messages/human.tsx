import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { getContentString } from "../utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";
import { MultimodalPreview } from "@/components/thread/MultimodalPreview";
import { isBase64ContentBlock } from "@/lib/multimodal-utils";
import { Badge } from "@/components/ui/badge";
import { Globe, Megaphone } from "lucide-react";
import { ContextCategory } from "@/lib/context-selectors";

const CATEGORY_ICON: Record<ContextCategory, React.ReactNode> = {
  countries: <Globe className="h-3 w-3" />,
  platforms: <Megaphone className="h-3 w-3" />,
};

function MessageContextBadges({ message }: { message: Message }) {
  const ctx = message.additional_kwargs?.context as
    | Record<string, string[]>
    | undefined;
  if (!ctx) return null;

  const badges: { category: ContextCategory; item: string }[] = [];
  for (const category of ["countries", "platforms"] as ContextCategory[]) {
    if (ctx[category]) {
      for (const item of ctx[category]) {
        badges.push({ category, item });
      }
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {badges.map(({ category, item }) => (
        <Badge
          key={`${category}-${item}`}
          variant="secondary"
          className="gap-1 text-xs font-normal"
        >
          {CATEGORY_ICON[category]}
          {item}
        </Badge>
      ))}
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
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);

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
          />
        </div>
      </div>
    </div>
  );
}
