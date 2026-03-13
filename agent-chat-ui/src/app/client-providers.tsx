"use client";

import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/demo/app-sidebar";
import { SettingsProvider } from "@/providers/Settings";
import { SettingsModal } from "@/components/settings/settings-modal";
import { useSettings } from "@/providers/Settings";

function ConditionalSidebar() {
  const { settings } = useSettings();
  if (!settings.navSidebarVisible) return null;
  return <AppSidebar />;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NuqsAdapter>
        <SettingsProvider>
          <SidebarProvider>
            <ConditionalSidebar />
            <SettingsModal />
            {children}
          </SidebarProvider>
        </SettingsProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
