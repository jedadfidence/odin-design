"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { MiniThread } from "@/components/mini-thread";
import Link from "next/link";
import {
  PageWidgetsContext,
  DEMO_WIDGETS,
} from "@/lib/dashboard-widgets";
import {
  AISummary,
  getMockResponse,
  getSectionMockResponse,
} from "@/components/demo/ai-summary";
import { WidgetMenu, AIAction } from "@/components/demo/widget-menu";

function MockDashboard() {
  const [showExecSummary, setShowExecSummary] = useState(true);
  const [activeInlineSummary, setActiveInlineSummary] = useState<{
    id: string;
    action: AIAction;
    text: string;
  } | null>(null);

  // --- Handlers ---

  const handleWidgetAction = (widgetId: string, action: AIAction) => {
    const text = getMockResponse(widgetId, action);
    setActiveInlineSummary({ id: widgetId, action, text });
  };

  const handleSectionAction = (section: string, action: AIAction) => {
    const text = getSectionMockResponse(section, action);
    setActiveInlineSummary({ id: `section-${section}`, action, text });
  };

  const handleAddToContext = (widgetId: string) => {
    const widget = DEMO_WIDGETS.find((w) => w.id === widgetId);
    window.dispatchEvent(
      new CustomEvent("odin:add-page-context", { detail: widgetId }),
    );
    toast.success(`Added ${widget?.title ?? widgetId} to context`);
  };

  const handleSectionAddToContext = (section: string) => {
    const sectionWidgets = DEMO_WIDGETS.filter((w) => w.section === section);
    sectionWidgets.forEach((w) => {
      window.dispatchEvent(
        new CustomEvent("odin:add-page-context", { detail: w.id }),
      );
    });
    toast.success(`Added all ${section} visuals to context`);
  };

  return (
    <div className="min-h-screen bg-[#EAECF5] dark:bg-[#0D0D14] text-foreground">
      {/* Top nav bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="text-lg font-semibold">Acme Analytics</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Dashboard</span>
          <span>Reports</span>
          <span>Settings</span>
          <Link
            href="/"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            Switch to Full Page AI
          </Link>
        </nav>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-2xl font-semibold">Dashboard Overview</h1>

        {/* Executive AI Summary */}
        <AnimatePresence>
          {showExecSummary && (
            <AISummary
              variant="full"
              text="Revenue has grown 12.5% to $124,500 this month, driven primarily by enterprise subscription renewals. Active users are up 3.2% to 8,420, with Asia Pacific showing the strongest engagement at 88%. Conversion rate has dipped slightly by 0.3 percentage points to 4.8%, suggesting potential optimization opportunities in the checkout flow."
              initialDelay={500}
              onDismiss={() => setShowExecSummary(false)}
              className="mb-6"
            />
          )}
        </AnimatePresence>

        {/* KPIs Section */}
        <div
          className="group/section flex flex-col items-stretch self-stretch rounded-3xl p-6"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 4px 20px 0 rgba(0, 0, 0, 0.03), 0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
          }}
        >
          <div className="w-full flex items-center justify-between">
            <h2 className="text-lg font-semibold">KPIs</h2>
            <WidgetMenu
              className="opacity-0 group-hover/section:opacity-100 transition-opacity"
              onAIAction={(action) => handleSectionAction("KPIs", action)}
              onAddToContext={() => handleSectionAddToContext("KPIs")}
            />
          </div>

          {/* Section-level inline summary */}
          <AnimatePresence>
            {activeInlineSummary?.id === "section-KPIs" && (
              <AISummary
                key={activeInlineSummary.id}
                variant="compact"
                text={activeInlineSummary.text}
                onDismiss={() => setActiveInlineSummary(null)}
              />
            )}
          </AnimatePresence>

          <div className="w-full mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* KPI: Total Revenue */}
            <div
              className="group relative flex flex-col justify-center rounded-3xl border border-[#F5F9FF] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.20)",
                boxShadow:
                  "0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <WidgetMenu
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onAIAction={(action) =>
                    handleWidgetAction("kpi-revenue", action)
                  }
                  onAddToContext={() => handleAddToContext("kpi-revenue")}
                />
              </div>
              <AnimatePresence>
                {activeInlineSummary?.id === "kpi-revenue" && (
                  <AISummary
                    key={activeInlineSummary.id}
                    variant="compact"
                    text={activeInlineSummary.text}
                    onDismiss={() => setActiveInlineSummary(null)}
                  />
                )}
              </AnimatePresence>
              <p className="mt-1 text-2xl font-semibold">$124,500</p>
              <p className="mt-1 text-sm text-muted-foreground">
                +12.5% vs last month
              </p>
            </div>

            {/* KPI: Active Users */}
            <div
              className="group relative flex flex-col justify-center rounded-3xl border border-[#F5F9FF] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.20)",
                boxShadow:
                  "0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Users</p>
                <WidgetMenu
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onAIAction={(action) =>
                    handleWidgetAction("kpi-users", action)
                  }
                  onAddToContext={() => handleAddToContext("kpi-users")}
                />
              </div>
              <AnimatePresence>
                {activeInlineSummary?.id === "kpi-users" && (
                  <AISummary
                    key={activeInlineSummary.id}
                    variant="compact"
                    text={activeInlineSummary.text}
                    onDismiss={() => setActiveInlineSummary(null)}
                  />
                )}
              </AnimatePresence>
              <p className="mt-1 text-2xl font-semibold">8,420</p>
              <p className="mt-1 text-sm text-muted-foreground">
                +3.2% vs last month
              </p>
            </div>

            {/* KPI: Conversion Rate */}
            <div
              className="group relative flex flex-col justify-center rounded-3xl border border-[#F5F9FF] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.20)",
                boxShadow:
                  "0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Conversion Rate
                </p>
                <WidgetMenu
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onAIAction={(action) =>
                    handleWidgetAction("kpi-conversion", action)
                  }
                  onAddToContext={() => handleAddToContext("kpi-conversion")}
                />
              </div>
              <AnimatePresence>
                {activeInlineSummary?.id === "kpi-conversion" && (
                  <AISummary
                    key={activeInlineSummary.id}
                    variant="compact"
                    text={activeInlineSummary.text}
                    onDismiss={() => setActiveInlineSummary(null)}
                  />
                )}
              </AnimatePresence>
              <p className="mt-1 text-2xl font-semibold">4.8%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                -0.3% vs last month
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div
          className="group/section mt-6 flex flex-col items-stretch self-stretch rounded-3xl p-6"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 4px 20px 0 rgba(0, 0, 0, 0.03), 0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
          }}
        >
          <div className="w-full flex items-center justify-between">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <WidgetMenu
              className="opacity-0 group-hover/section:opacity-100 transition-opacity"
              onAIAction={(action) =>
                handleSectionAction("Analytics", action)
              }
              onAddToContext={() => handleSectionAddToContext("Analytics")}
            />
          </div>

          {/* Section-level inline summary */}
          <AnimatePresence>
            {activeInlineSummary?.id === "section-Analytics" && (
              <AISummary
                key={activeInlineSummary.id}
                variant="compact"
                text={activeInlineSummary.text}
                onDismiss={() => setActiveInlineSummary(null)}
              />
            )}
          </AnimatePresence>

          <div className="w-full mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Revenue Over Time Chart */}
            <div
              className="group relative flex min-h-64 flex-col justify-center rounded-3xl border border-[#F5F9FF] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.20)",
                boxShadow:
                  "0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue Over Time
                </p>
                <WidgetMenu
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onAIAction={(action) =>
                    handleWidgetAction("revenue-chart", action)
                  }
                  onAddToContext={() => handleAddToContext("revenue-chart")}
                />
              </div>
              <AnimatePresence>
                {activeInlineSummary?.id === "revenue-chart" && (
                  <AISummary
                    key={activeInlineSummary.id}
                    variant="compact"
                    text={activeInlineSummary.text}
                    onDismiss={() => setActiveInlineSummary(null)}
                  />
                )}
              </AnimatePresence>
              <div className="mt-4 flex h-40 items-end gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/20"
                      style={{ height: `${h}%` }}
                    />
                  ),
                )}
              </div>
            </div>

            {/* User Activity Chart */}
            <div
              className="group relative flex min-h-64 flex-col justify-center rounded-3xl border border-[#F5F9FF] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.20)",
                boxShadow:
                  "0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  User Activity
                </p>
                <WidgetMenu
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onAIAction={(action) =>
                    handleWidgetAction("user-activity", action)
                  }
                  onAddToContext={() => handleAddToContext("user-activity")}
                />
              </div>
              <AnimatePresence>
                {activeInlineSummary?.id === "user-activity" && (
                  <AISummary
                    key={activeInlineSummary.id}
                    variant="compact"
                    text={activeInlineSummary.text}
                    onDismiss={() => setActiveInlineSummary(null)}
                  />
                )}
              </AnimatePresence>
              <div className="mt-4 space-y-3">
                {[
                  { region: "North America", pct: 72 },
                  { region: "Europe", pct: 55 },
                  { region: "Asia Pacific", pct: 88 },
                  { region: "Latin America", pct: 41 },
                ].map(({ region, pct }) => (
                  <div key={region} className="flex items-center gap-3">
                    <span className="w-32 text-sm">{region}</span>
                    <div className="h-3 flex-1 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-primary/40"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div
          className="group/section mt-6 flex flex-col items-stretch self-stretch rounded-3xl p-6"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 4px 20px 0 rgba(0, 0, 0, 0.03), 0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
          }}
        >
          <div className="w-full flex items-center justify-between">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <WidgetMenu
              className="opacity-0 group-hover/section:opacity-100 transition-opacity"
              onAIAction={(action) =>
                handleSectionAction("Transactions", action)
              }
              onAddToContext={() =>
                handleSectionAddToContext("Transactions")
              }
            />
          </div>

          {/* Section-level inline summary */}
          <AnimatePresence>
            {activeInlineSummary?.id === "section-Transactions" && (
              <AISummary
                key={activeInlineSummary.id}
                variant="compact"
                text={activeInlineSummary.text}
                onDismiss={() => setActiveInlineSummary(null)}
              />
            )}
          </AnimatePresence>

          <div
            className="w-full mt-4 group relative flex flex-col justify-center rounded-3xl border border-[#F5F9FF]"
            style={{
              background: "rgba(255, 255, 255, 0.20)",
              boxShadow:
                "0 10px 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.20) inset, 0.5px 0.5px 4px 0 rgba(255, 255, 255, 0.40) inset, -0.5px -0.5px 0 0 rgba(255, 255, 255, 0.40) inset",
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="font-medium">Recent Transactions</p>
              <WidgetMenu
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onAIAction={(action) =>
                  handleWidgetAction("transactions", action)
                }
                onAddToContext={() => handleAddToContext("transactions")}
              />
            </div>
            <AnimatePresence>
              {activeInlineSummary?.id === "transactions" && (
                <AISummary
                  key={activeInlineSummary.id}
                  variant="compact"
                  text={activeInlineSummary.text}
                  onDismiss={() => setActiveInlineSummary(null)}
                  className="mx-6 mt-4"
                />
              )}
            </AnimatePresence>
            <div className="divide-y divide-border">
              {[
                {
                  name: "Subscription Renewal",
                  amount: "$299",
                  date: "Today",
                },
                {
                  name: "New Enterprise Plan",
                  amount: "$1,200",
                  date: "Yesterday",
                },
                {
                  name: "Add-on Purchase",
                  amount: "$49",
                  date: "2 days ago",
                },
                {
                  name: "Annual License",
                  amount: "$3,600",
                  date: "3 days ago",
                },
              ].map((tx) => (
                <div
                  key={tx.name}
                  className="flex items-center justify-between px-6 py-3 text-sm"
                >
                  <span>{tx.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{tx.date}</span>
                    <span className="font-medium">{tx.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <React.Suspense fallback={null}>
      <PageWidgetsContext.Provider value={DEMO_WIDGETS}>
        <Toaster />
        <MockDashboard />
        <MiniThread />
      </PageWidgetsContext.Provider>
    </React.Suspense>
  );
}
