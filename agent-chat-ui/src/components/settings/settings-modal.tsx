"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSettings } from "@/providers/Settings";
import { Settings as SettingsIcon, Zap, Bookmark } from "lucide-react";
import { GeneralPane } from "./general-pane";
import { ShortcutsPane } from "./shortcuts-pane";
import { PresetsPane } from "./presets-pane";

type SettingsCategory = "general" | "shortcuts" | "presets";

const CATEGORIES: { id: SettingsCategory; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "shortcuts", label: "Shortcuts", icon: Zap },
  { id: "presets", label: "Presets", icon: Bookmark },
];

export function SettingsModal() {
  const { settingsOpen, closeSettings } = useSettings();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");

  return (
    <Dialog open={settingsOpen} onOpenChange={(open) => { if (!open) closeSettings(); }}>
      <DialogContent className="max-w-[700px] h-[500px] p-0 gap-0 flex overflow-hidden">
        {/* Left sidebar */}
        <nav className="w-[180px] shrink-0 border-r border-border bg-surface-deep p-3 flex flex-col gap-1">
          <h2 className="px-2 pb-2 text-sm font-semibold text-foreground">Settings</h2>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left w-full",
                activeCategory === cat.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeCategory === "general" && <GeneralPane />}
          {activeCategory === "shortcuts" && <ShortcutsPane />}
          {activeCategory === "presets" && <PresetsPane />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
