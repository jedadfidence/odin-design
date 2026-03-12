import React, { useState, useCallback } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Zap, Plus, Pencil } from "lucide-react";
import { Shortcut } from "@/lib/shortcuts";

interface ShortcutPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
  onSelectShortcut: (shortcut: Shortcut) => void;
  onEditShortcut: (shortcut: Shortcut) => void;
  onCreateNew: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  children?: React.ReactNode;
}

export const ShortcutPopover: React.FC<ShortcutPopoverProps> = ({
  open,
  onOpenChange,
  shortcuts,
  onSelectShortcut,
  onEditShortcut,
  onCreateNew,
  anchorRef,
  textareaRef,
  children,
}) => {
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLInputElement>(
          "[data-shortcut-popover] [cmdk-input]",
        );
        input?.focus();
      });
    } else {
      // Refocus textarea when popover closes
      requestAnimationFrame(() => textareaRef?.current?.focus());
    }
  }, [open, textareaRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {anchorRef ? (
        <>
          <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
          {children}
        </>
      ) : (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      )}
      <PopoverContent
        data-shortcut-popover
        className="w-[220px] border-border/60 bg-background/80 p-0 shadow-lg backdrop-blur-sm"
        align="start"
        side="top"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          e.stopPropagation();
          handleKeyDown(e);
        }}
      >
        <Command shouldFilter={true} className="bg-transparent">
          <CommandInput
            placeholder="Search quick prompts..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No quick prompts found.</CommandEmpty>
            <CommandGroup>
              {shortcuts.map((shortcut) => (
                <CommandItem
                  key={shortcut.id}
                  value={shortcut.name}
                  onSelect={() => onSelectShortcut(shortcut)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{shortcut.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditShortcut(shortcut);
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value="create-new-shortcut"
                onSelect={onCreateNew}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>Create quick prompt</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
