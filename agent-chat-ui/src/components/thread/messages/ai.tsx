import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

interface InterruptProps {
  interrupt?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interrupt,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  const fallbackValue = Array.isArray(interrupt)
    ? (interrupt as Record<string, any>[])
    : (((interrupt as { value?: unknown } | undefined)?.value ??
        interrupt) as Record<string, any>);

  return (
    <>
      {isAgentInboxInterruptSchema(interrupt) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interrupt} />
        )}
      {interrupt &&
      !isAgentInboxInterruptSchema(interrupt) &&
      (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={fallbackValue} />
      ) : null}
    </>
  );
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(true),
  );

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";
  const hasCustomComponents = !!(
    message?.id &&
    thread.values.ui?.some((ui) => ui.metadata?.message_id === message.id)
  );
  const shouldRenderInterrupt =
    !!threadInterrupt && (isLastMessage || hasNoAIOrToolMessages);
  const hasVisibleAiContent =
    contentString.trim().length > 0 ||
    (!hideToolCalls && (hasToolCalls || hasAnthropicToolCalls)) ||
    hasCustomComponents ||
    shouldRenderInterrupt;

  if (isToolResult && hideToolCalls) {
    return null;
  }
  if (!isToolResult && !hasVisibleAiContent) {
    return null;
  }

  return (
    <div
      className="group mr-auto flex w-full items-start gap-2"
      data-message-id={message?.id}
      data-message-type="ai"
    >
      <div className="flex w-full min-w-0 flex-col gap-2">
        {isToolResult ? (
          <>
            <ToolResult message={message} />
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
          </>
        ) : (
          <>
            {contentString.length > 0 && (
              <div className="py-1">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {!hideToolCalls && (
              <>
                {(hasToolCalls && toolCallsHaveContents && (
                  <ToolCalls toolCalls={message.tool_calls} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                  )) ||
                  (hasToolCalls && (
                    <ToolCalls toolCalls={message.tool_calls} />
                  ))}
              </>
            )}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            <div
              className={cn(
                "mr-auto flex items-center gap-2 transition-opacity",
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={contentString}
                isLoading={isLoading}
                isAiMessage={true}
                handleRegenerate={() => handleRegenerate(parentCheckpoint)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const ALL_STATUSES = [
  "Analysing your request",
  "Looking up your data",
  "Preparing your answer",
  "Loading your data",
];

function FlippingText({ text, suffix }: { text: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(text);
  const [incoming, setIncoming] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (text === displayed && !incoming) return;
    if (text === incoming) return;

    // Start flip: new text enters from top, old exits downward
    setIncoming(text);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDisplayed(text);
      setIncoming(null);
    }, 400);

    return () => clearTimeout(timeoutRef.current);
  }, [text]);

  return (
    <span className="relative inline-flex overflow-hidden" style={{ height: "1.4em" }}>
      {/* Invisible sizer: renders all possible texts so the container is always wide enough */}
      <span className="invisible whitespace-pre" aria-hidden>
        {ALL_STATUSES.reduce((a, b) => (a.length >= b.length ? a : b), "")}...
      </span>

      {/* Visible animated text */}
      <span
        key={`out-${displayed}`}
        className="absolute left-0 top-0 inline-block whitespace-nowrap animate-gradient-text bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(90deg, #4586F7 0%, #8fb4fc 30%, #4586F7 60%, #8fb4fc 90%, #4586F7 100%)",
          backgroundSize: "200% 100%",
          animation: `${incoming ? "arrow-exit-down 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards," : ""} gradient-shift 2s linear infinite`,
        }}
      >
        {displayed}{suffix}
      </span>
      {incoming && (
        <span
          key={`in-${incoming}`}
          className="absolute left-0 top-0 inline-block whitespace-nowrap bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(90deg, #4586F7 0%, #8fb4fc 30%, #4586F7 60%, #8fb4fc 90%, #4586F7 100%)",
            backgroundSize: "200% 100%",
            animation:
              "arrow-enter-down 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards, gradient-shift 2s linear infinite",
          }}
        >
          {incoming}{suffix}
        </span>
      )}
    </span>
  );
}

export function AssistantMessageLoading() {
  const thread = useStreamContext();
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 450);

    return () => window.clearInterval(id);
  }, []);

  const status = useMemo(() => {
    let latestStatus = "Analysing your request";

    for (const message of thread.messages) {
      if (message.type === "ai") {
        if ("tool_calls" in message && Array.isArray(message.tool_calls)) {
          for (const toolCall of message.tool_calls) {
            if (!toolCall) continue;
            latestStatus = "Looking up your data";
          }
        }

        if (Array.isArray(message.content)) {
          for (const item of message.content) {
            const itemType = item.type as string;
            if (itemType === "tool_use" && "name" in item) {
              latestStatus = "Looking up your data";
            }

            if (
              itemType === "reasoning" ||
              itemType === "thinking" ||
              itemType === "reasoning_content"
            ) {
              latestStatus = "Preparing your answer";
            }
          }
        }
      }

      if (message.type === "tool") {
        latestStatus = "Loading your data";
      }
    }

    return latestStatus;
  }, [thread.messages]);

  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="flex min-h-8 items-center py-2 text-sm text-muted-foreground">
        <FlippingText text={status} suffix={".".repeat(dotCount)} />
      </div>
    </div>
  );
}
