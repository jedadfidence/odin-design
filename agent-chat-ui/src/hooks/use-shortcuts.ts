import { useState, useCallback, useEffect, useRef } from "react";
import {
  Shortcut,
  loadShortcuts,
  saveShortcuts,
  createShortcut,
  duplicateShortcut,
} from "@/lib/shortcuts";
import { ContextSelections } from "@/lib/context-selectors";

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const hydrated = useRef(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [prefill, setPrefill] = useState<{
    instructions: string;
    context: ContextSelections | null;
  } | null>(null);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setShortcuts(loadShortcuts());
    hydrated.current = true;
  }, []);

  // Persist to localStorage on changes (skip initial hydration)
  useEffect(() => {
    if (hydrated.current) {
      saveShortcuts(shortcuts);
    }
  }, [shortcuts]);

  const addShortcut = useCallback(
    (
      name: string,
      instructions: string,
      context: ContextSelections | null,
      presetId: string | null,
    ) => {
      const shortcut = createShortcut(name, instructions, context, presetId);
      setShortcuts((prev) => [...prev, shortcut]);
      return shortcut;
    },
    [],
  );

  const updateShortcut = useCallback(
    (
      id: string,
      updates: Partial<Pick<Shortcut, "name" | "instructions" | "context" | "presetId">>,
    ) => {
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
        ),
      );
    },
    [],
  );

  const deleteShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicate = useCallback(
    (id: string): Shortcut | undefined => {
      const original = shortcuts.find((s) => s.id === id);
      if (!original) return undefined;
      const newShortcut = duplicateShortcut(original);
      setShortcuts((prev) => [...prev, newShortcut]);
      return newShortcut;
    },
    [shortcuts],
  );

  const openPopover = useCallback(() => {
    setPopoverOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const openCreateDialog = useCallback(
    (prefillData?: { instructions: string; context: ContextSelections | null }) => {
      setEditingShortcut(null);
      setPrefill(prefillData ?? null);
      setDialogOpen(true);
    },
    [],
  );

  const openEditDialog = useCallback((shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setPrefill(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingShortcut(null);
    setPrefill(null);
  }, []);

  return {
    shortcuts,
    popoverOpen,
    dialogOpen,
    editingShortcut,
    prefill,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    duplicate,
    openPopover,
    closePopover,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };
}
