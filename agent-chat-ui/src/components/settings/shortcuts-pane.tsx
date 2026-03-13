"use client";

import React, { useState } from "react";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Shortcut } from "@/lib/shortcuts";

interface EditingState {
  id: string | "new";
  name: string;
  instructions: string;
}

export function ShortcutsPane() {
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();
  const [editing, setEditing] = useState<EditingState | null>(null);

  const handleStartEdit = (shortcut: Shortcut) => {
    setEditing({
      id: shortcut.id,
      name: shortcut.name,
      instructions: shortcut.instructions,
    });
  };

  const handleStartCreate = () => {
    setEditing({ id: "new", name: "", instructions: "" });
  };

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;
    if (editing.id === "new") {
      addShortcut(editing.name.trim(), editing.instructions, null, null);
    } else {
      updateShortcut(editing.id, {
        name: editing.name.trim(),
        instructions: editing.instructions,
      });
    }
    setEditing(null);
  };

  const handleCancel = () => {
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Shortcuts</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleStartCreate}
          disabled={editing?.id === "new"}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      <div className="space-y-2">
        {editing?.id === "new" && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            <Input
              value={editing.name}
              onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              placeholder="Shortcut name"
              autoFocus
            />
            <Textarea
              value={editing.instructions}
              onChange={(e) => setEditing((prev) => prev ? { ...prev, instructions: e.target.value } : prev)}
              placeholder="Enter prompt instructions..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!editing.name.trim()}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="rounded-lg border border-border">
            {editing?.id === shortcut.id ? (
              <div className="p-3 space-y-3">
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Shortcut name"
                  autoFocus
                />
                <Textarea
                  value={editing.instructions}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, instructions: e.target.value } : prev)}
                  placeholder="Enter prompt instructions..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!editing.name.trim()}>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{shortcut.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {shortcut.instructions}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleStartEdit(shortcut)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteShortcut(shortcut.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {shortcuts.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No shortcuts yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
