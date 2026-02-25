# Reuse Human Message

## Problem

Users want to re-send a previous human message (with or without its original context filters) without manually retyping it.

## Solution

Add a "Reuse" button to the human message CommandBar. Clicking populates the input box with the message text. If the original message had context selections (countries/platforms), a small popover offers two choices: "Reuse prompt" (text only) or "Reuse with context" (text + restore context selections).

## Architecture

No new files. Three existing files modified:

### 1. `hooks/use-context-selectors.ts`

Expose `setSelections` so the thread can programmatically restore context from a previous message.

### 2. `components/thread/index.tsx`

- Create `handleReuse(text: string, context?: Record<string, string[]>)` that:
  - Calls `setInput(text)` to populate the textarea
  - Optionally calls `setSelections(context)` to restore context filters
  - Focuses the textarea
- Pass `handleReuse` down to `HumanMessage`

### 3. `components/thread/messages/human.tsx`

- Accept `onReuse` callback prop
- Extract context from `message.additional_kwargs?.context`
- Pass `onReuse` and context presence to `CommandBar`

### 4. `components/thread/messages/shared.tsx`

- Add a `Repeat2` icon button to the CommandBar for human messages
- When message has no context: click calls `onReuse(text)` directly
- When message has context: click opens a shadcn Popover with two options:
  - "Reuse prompt" -> `onReuse(text)`
  - "Reuse with context" -> `onReuse(text, context)`

## UI Details

- Icon: `Repeat2` from lucide-react
- Popover: shadcn `Popover`/`PopoverContent`, minimal two-row layout
- Button position: in CommandBar between Copy and Edit
- Popover only rendered when message has context selections

## Out of Scope

- Keyboard shortcuts for reuse
- Reusing file/image attachments
- History or favorites system
