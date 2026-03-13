"use client";

import React, { useState } from "react";
import { useContextPresets } from "@/hooks/use-context-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { ContextPreset } from "@/lib/context-presets";
import { CONTEXT_CATEGORIES } from "@/lib/context-selectors";
import { FILTER_CATEGORIES } from "@/lib/filter-data";

/** Render context selections as compact badge groups */
function ContextDetails({ preset }: { preset: ContextPreset }) {
  const contextEntries = CONTEXT_CATEGORIES.filter(
    (cat) => preset.selections[cat.id] && preset.selections[cat.id].length > 0,
  );
  const filterEntries = preset.filters
    ? FILTER_CATEGORIES.filter(
        (cat) => preset.filters![cat.id] && preset.filters![cat.id].length > 0,
      )
    : [];

  if (contextEntries.length === 0 && filterEntries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-1.5">No selections</p>
    );
  }

  return (
    <div className="space-y-1.5 mt-2">
      {contextEntries.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Context
          </p>
          {contextEntries.map((cat) => (
            <div key={cat.id} className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-medium text-muted-foreground w-16 shrink-0">
                {cat.label}
              </span>
              {preset.selections[cat.id].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </>
      )}
      {filterEntries.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2">
            Filters
          </p>
          {filterEntries.map((cat) => (
            <div key={cat.id} className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-medium text-muted-foreground w-16 shrink-0">
                {cat.label}
              </span>
              {preset.filters![cat.id].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function PresetsPane() {
  const { presets, renamePreset, deletePreset } = useContextPresets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSave = () => {
    if (!editingId || !editName.trim()) return;
    renamePreset(editingId, editName.trim());
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Presets</h3>
        <p className="text-xs text-muted-foreground">
          Create presets from the filter sidebar
        </p>
      </div>

      <div className="space-y-2">
        {presets.map((preset) => (
          <div key={preset.id} className="rounded-lg border border-border">
            {editingId === preset.id ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Preset name"
                    autoFocus
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" className="h-7 w-7" onClick={handleSave} disabled={!editName.trim()}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <ContextDetails preset={preset} />
              </div>
            ) : (
              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => toggleExpand(preset.id)}
                  >
                    <p className="text-sm font-medium truncate">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click to {expandedId === preset.id ? "collapse" : "view details"}
                    </p>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleStartEdit(preset.id, preset.name)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deletePreset(preset.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {expandedId === preset.id && <ContextDetails preset={preset} />}
              </div>
            )}
          </div>
        ))}

        {presets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No presets yet. Create one from the filter sidebar by selecting filters and saving.
          </p>
        )}
      </div>
    </div>
  );
}
