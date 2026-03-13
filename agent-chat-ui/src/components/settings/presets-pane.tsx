"use client";

import React, { useState } from "react";
import { useContextPresets } from "@/hooks/use-context-presets";
import { presetSummary } from "@/lib/context-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";

export function PresetsPane() {
  const { presets, renamePreset, deletePreset } = useContextPresets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
              <div className="flex items-center gap-2 p-3">
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
            ) : (
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {presetSummary(preset)}
                  </p>
                </div>
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
