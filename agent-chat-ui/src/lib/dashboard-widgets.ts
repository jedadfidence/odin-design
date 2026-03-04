import { createContext, useContext } from "react";

export interface DashboardWidget {
  id: string;
  title: string;
  type: "kpi" | "chart" | "table";
  section: string;
  data: Record<string, unknown>;
}

export const DEMO_WIDGETS: DashboardWidget[] = [
  {
    id: "kpi-revenue",
    title: "Total Revenue",
    type: "kpi",
    section: "KPIs",
    data: { value: 124500, change: 12.5, formatted: "$124,500" },
  },
  {
    id: "kpi-users",
    title: "Active Users",
    type: "kpi",
    section: "KPIs",
    data: { value: 8420, change: 3.2, formatted: "8,420" },
  },
  {
    id: "kpi-conversion",
    title: "Conversion Rate",
    type: "kpi",
    section: "KPIs",
    data: { value: 4.8, change: -0.3, formatted: "4.8%" },
  },
  {
    id: "revenue-chart",
    title: "Revenue Over Time",
    type: "chart",
    section: "Analytics",
    data: {
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      values: [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100],
    },
  },
  {
    id: "user-activity",
    title: "User Activity",
    type: "chart",
    section: "Analytics",
    data: {
      regions: [
        { name: "North America", pct: 72 },
        { name: "Europe", pct: 55 },
        { name: "Asia Pacific", pct: 88 },
        { name: "Latin America", pct: 41 },
      ],
    },
  },
  {
    id: "transactions",
    title: "Recent Transactions",
    type: "table",
    section: "Transactions",
    data: {
      rows: [
        { name: "Subscription Renewal", amount: "$299", date: "Today" },
        { name: "New Enterprise Plan", amount: "$1,200", date: "Yesterday" },
        { name: "Add-on Purchase", amount: "$49", date: "2 days ago" },
        { name: "Annual License", amount: "$3,600", date: "3 days ago" },
      ],
    },
  },
];

export const DEMO_SECTIONS = ["KPIs", "Analytics", "Transactions"] as const;

export const PageWidgetsContext = createContext<DashboardWidget[]>([]);

export function usePageWidgets(): DashboardWidget[] {
  return useContext(PageWidgetsContext);
}
