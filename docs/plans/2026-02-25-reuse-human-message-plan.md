# Reuse Human Message Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users reuse a previous human message by populating the input box with its text, optionally restoring context selections.

**Architecture:** Add a `Repeat2` button to the human message CommandBar. Messages without context reuse immediately on click. Messages with context show a 2-option shadcn Popover. A new `handleReuse` callback in Thread sets input text and optionally restores context selections.

**Tech Stack:** React 19, shadcn/ui (Popover), lucide-react (Repeat2), TypeScript

---

### Task 1: Expose `setSelections` from `useContextSelectors`

**Files:**
- Modify: `agent-chat-ui/src/hooks/use-context-selectors.ts:72-86`

**Step 1: Add `setSelections` to the return object**

In `use-context-selectors.ts`, the hook already has `setSelections` internally. Expose it in the return object by adding one line:

```typescript
  return {
    selections,
    setSelections,   // <-- add this line
    popoverOpen,
    activeCategory,
    setActiveCategory,
    triggerSource,
    toggleItem,
    removeItem,
    resetSelections,
    hasSelections,
    toMetadata,
    openPopover,
    closePopover,
  };
```

**Step 2: Verify TypeScript compiles**

Run: `cd agent-chat-ui && pnpm build`
Expected: Compiles without errors (unused export is fine).

**Step 3: Commit**

```bash
git add agent-chat-ui/src/hooks/use-context-selectors.ts
git commit -m "feat: expose setSelections from useContextSelectors hook"
```

---

### Task 2: Add `handleReuse` to Thread and pass to HumanMessage

**Files:**
- Modify: `agent-chat-ui/src/components/thread/index.tsx:125-510`

**Step 1: Destructure `setSelections` from `useContextSelectors`**

At line ~156 where `useContextSelectors()` is destructured, add `setSelections`:

```typescript
  const {
    selections: contextSelections,
    setSelections: setContextSelections,   // <-- add this
    popoverOpen: contextPopoverOpen,
    // ... rest unchanged
  } = useContextSelectors();
```

**Step 2: Create `handleReuse` callback**

Add this after the `handleSuggestionSelect` callback (around line 322):

```typescript
  const handleReuse = useCallback(
    (text: string, context?: Record<string, string[]>) => {
      setInput(text);
      if (context) {
        setContextSelections({
          countries: context.countries ?? [],
          platforms: context.platforms ?? [],
        });
      }
      // Focus textarea on next tick
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    },
    [setContextSelections],
  );
```

**Step 3: Pass `onReuse` to HumanMessage**

In the JSX where `<HumanMessage>` is rendered (around line 501), add the prop:

```tsx
<HumanMessage
  key={message.id || `${message.type}-${index}`}
  message={message}
  isLoading={isLoading}
  onReuse={handleReuse}
/>
```

**Step 4: Verify TypeScript compiles**

Run: `cd agent-chat-ui && pnpm build`
Expected: Type error because `HumanMessage` doesn't accept `onReuse` yet. That's expected — Task 3 fixes it.

**Step 5: Commit**

```bash
git add agent-chat-ui/src/components/thread/index.tsx
git commit -m "feat: add handleReuse callback in Thread, pass to HumanMessage"
```

---

### Task 3: Accept `onReuse` in HumanMessage and pass to CommandBar

**Files:**
- Modify: `agent-chat-ui/src/components/thread/messages/human.tsx:62-177`

**Step 1: Add `onReuse` prop and extract context**

Update the component signature and extract what CommandBar needs:

```typescript
export function HumanMessage({
  message,
  isLoading,
  onReuse,
}: {
  message: Message;
  isLoading: boolean;
  onReuse?: (text: string, context?: Record<string, string[]>) => void;
}) {
```

**Step 2: Extract message context for reuse**

After `const contentString = getContentString(message.content);` (line 75), add:

```typescript
  const messageContext = message.additional_kwargs?.context as
    | Record<string, string[]>
    | undefined;
```

**Step 3: Pass reuse props to CommandBar**

Update the `<CommandBar>` JSX (around line 160) to include reuse props:

```tsx
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
```

**Step 4: Verify TypeScript compiles**

Run: `cd agent-chat-ui && pnpm build`
Expected: Type error because `CommandBar` doesn't accept these props yet. Task 4 fixes it.

**Step 5: Commit**

```bash
git add agent-chat-ui/src/components/thread/messages/human.tsx
git commit -m "feat: accept onReuse in HumanMessage, pass context to CommandBar"
```

---

### Task 4: Add Reuse button to CommandBar

**Files:**
- Modify: `agent-chat-ui/src/components/thread/messages/shared.tsx:118-221`

**Step 1: Add imports**

At the top of `shared.tsx`, add to the lucide import:

```typescript
import {
  XIcon,
  SendHorizontal,
  RefreshCcw,
  Pencil,
  Copy,
  CopyCheck,
  ChevronLeft,
  ChevronRight,
  Repeat2,          // <-- add
} from "lucide-react";
```

Add the Popover import:

```typescript
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```

**Step 2: Update CommandBar props**

Add `onReuse` and `messageContext` to the props type:

```typescript
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
```

**Step 3: Add state for the reuse popover**

Inside `CommandBar`, before the early returns, add:

```typescript
  const [reusePopoverOpen, setReusePopoverOpen] = useState(false);
  const hasContext = messageContext && Object.keys(messageContext).length > 0;
```

Add `useState` to the existing import from `"react"`.

**Step 4: Add Reuse button to the non-editing return block**

In the final `return` block (the non-editing toolbar, around line 191), add the reuse button between `ContentCopyable` and the edit button. Replace the entire return block:

```tsx
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
```

**Step 5: Verify TypeScript compiles and app builds**

Run: `cd agent-chat-ui && pnpm build`
Expected: Build succeeds with no errors.

**Step 6: Commit**

```bash
git add agent-chat-ui/src/components/thread/messages/shared.tsx
git commit -m "feat: add Reuse button with context popover to CommandBar"
```

---

### Task 5: Manual verification

**Step 1: Start the dev server**

Run: `cd agent-chat-ui && pnpm dev`

**Step 2: Verify reuse without context**

1. Send a message without selecting any context
2. Hover over the human message bubble
3. Verify a `Repeat2` icon button appears in the toolbar
4. Click it — input box should populate with the message text
5. Verify textarea is focused

**Step 3: Verify reuse with context**

1. Send a message with countries/platforms selected
2. Hover over the human message bubble
3. Click the `Repeat2` button — a popover should appear with two options
4. Click "Reuse prompt" — input populates with text only, no context badges
5. Repeat, click "Reuse with context" — input populates AND context badges appear

**Step 4: Verify edge cases**

- Reuse while loading (button should be disabled)
- Reuse a message, modify text, then send
- Reuse a message with context, clear some context items, then send

**Step 5: Final commit if any fixes needed**

```bash
git add -u
git commit -m "fix: address issues found during manual verification"
```
