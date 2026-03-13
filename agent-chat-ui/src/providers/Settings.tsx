"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

export interface Settings {
  navSidebarVisible: boolean;
  chatHistoryVisible: boolean;
  filterSidebarVisible: boolean;
  showToolCalls: boolean;
  showSuggestions: boolean;
  theme: "light" | "dark" | "system";
}

const DEFAULT_SETTINGS: Settings = {
  navSidebarVisible: true,
  chatHistoryVisible: true,
  filterSidebarVisible: true,
  showToolCalls: false,
  showSuggestions: true,
  theme: "system",
};

const STORAGE_KEY = "odin-settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fall through
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Keyboard shortcut: Cmd+, (Mac) or Ctrl+, (Windows/Linux) opens settings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, settingsOpen, openSettings, closeSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
