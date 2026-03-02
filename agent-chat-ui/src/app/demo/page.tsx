"use client";

import React from "react";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";

function MockDashboard() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0D0D14] text-foreground">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { label: "Total Revenue", value: "$124,500", change: "+12.5%" },
            { label: "Active Users", value: "8,420", change: "+3.2%" },
            { label: "Conversion Rate", value: "4.8%", change: "-0.3%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-background p-6 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.change} vs last month
              </p>
            </div>
          ))}
        </div>

        {/* Placeholder chart area */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-64 rounded-xl border border-border bg-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Revenue Over Time
            </p>
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
          <div className="h-64 rounded-xl border border-border bg-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              User Activity
            </p>
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
                ),
              )}
            </div>
          </div>
        </div>

        {/* Table placeholder */}
        <div className="mt-6 rounded-xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <p className="font-medium">Recent Transactions</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { name: "Subscription Renewal", amount: "$299", date: "Today" },
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
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <React.Suspense fallback={null}>
      <Toaster />
      <MockDashboard />
      {/* MiniThread widget will be added here in Task 2.
          Providers (ThreadProvider, StreamProvider, ArtifactProvider)
          are rendered inside MiniThread itself so the demo page
          shows the dashboard even when the API is not configured. */}
    </React.Suspense>
  );
}
