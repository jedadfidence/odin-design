"use client";

import React from "react";
import { useSettings } from "@/providers/Settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-4 first:pt-0 pb-1">
      {title}
    </h3>
  );
}

export function GeneralPane() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-1">
      <SectionHeader title="Appearance" />
      <SettingRow label="Theme" description="Choose your preferred color scheme">
        <Select
          value={settings.theme}
          onValueChange={(val) => updateSetting("theme", val as "light" | "dark" | "system")}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SectionHeader title="Layout" />
      <SettingRow label="Navigation sidebar" description="Show the left navigation menu">
        <Switch
          checked={settings.navSidebarVisible}
          onCheckedChange={(checked) => updateSetting("navSidebarVisible", checked)}
        />
      </SettingRow>
      <SettingRow label="Chat history panel" description="Show the chat history sidebar">
        <Switch
          checked={settings.chatHistoryVisible}
          onCheckedChange={(checked) => updateSetting("chatHistoryVisible", checked)}
        />
      </SettingRow>
      <SettingRow label="Filter sidebar" description="Show the right-side filter panel">
        <Switch
          checked={settings.filterSidebarVisible}
          onCheckedChange={(checked) => updateSetting("filterSidebarVisible", checked)}
        />
      </SettingRow>

      <SectionHeader title="Chat" />
      <SettingRow label="Show tool calls" description="Display tool call details in messages">
        <Switch
          checked={settings.showToolCalls}
          onCheckedChange={(checked) => updateSetting("showToolCalls", checked)}
        />
      </SettingRow>
      <SettingRow label="Show suggestions" description="Display suggestion cards after AI responses">
        <Switch
          checked={settings.showSuggestions}
          onCheckedChange={(checked) => updateSetting("showSuggestions", checked)}
        />
      </SettingRow>
    </div>
  );
}
