import { useState, useCallback, useEffect } from "react";
import {
  ContextPreset,
  loadPresets,
  savePresets,
  createPreset,
  duplicatePreset,
} from "@/lib/context-presets";
import { ContextSelections } from "@/lib/context-selectors";
import { FilterSelections } from "@/lib/filter-data";

interface EditingState {
  presetId: string;
  presetName: string;
}

export function useContextPresets() {
  const [presets, setPresets] = useState<ContextPreset[]>(() => loadPresets());
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Persist to localStorage whenever presets change
  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  const addPreset = useCallback(
    (name: string, selections: ContextSelections, filters?: FilterSelections) => {
      const preset = createPreset(name, selections, filters);
      setPresets((prev) => [...prev, preset]);
      return preset;
    },
    [],
  );

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    setEditing((prev) => (prev?.presetId === id ? null : prev));
  }, []);

  const renamePreset = useCallback((id: string, name: string) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
    setEditing((prev) =>
      prev?.presetId === id ? { ...prev, presetName: name } : prev,
    );
  }, []);

  const updatePresetSelections = useCallback(
    (id: string, selections: ContextSelections) => {
      setPresets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, selections: { ...selections } } : p)),
      );
    },
    [],
  );

  const duplicate = useCallback((id: string): ContextPreset | undefined => {
    let newPreset: ContextPreset | undefined;
    setPresets((prev) => {
      const original = prev.find((p) => p.id === id);
      if (!original) return prev;
      newPreset = duplicatePreset(original);
      return [...prev, newPreset];
    });
    return newPreset;
  }, []);

  const startEditing = useCallback((preset: ContextPreset) => {
    setEditing({ presetId: preset.id, presetName: preset.name });
  }, []);

  const stopEditing = useCallback(() => {
    setEditing(null);
  }, []);

  const saveEditing = useCallback(
    (selections: ContextSelections) => {
      if (!editing) return;
      updatePresetSelections(editing.presetId, selections);
    },
    [editing, updatePresetSelections],
  );

  return {
    presets,
    editing,
    addPreset,
    deletePreset,
    renamePreset,
    updatePresetSelections,
    duplicate,
    startEditing,
    stopEditing,
    saveEditing,
  };
}
