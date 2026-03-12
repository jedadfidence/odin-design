import { ContextSelections } from "./context-selectors";

export interface Shortcut {
  id: string;
  name: string;
  instructions: string;
  context: ContextSelections | null;
  presetId: string | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "odin-shortcuts";

const DEFAULT_SHORTCUTS: Omit<Shortcut, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Performance Analysis",
    instructions:
      "Analyze the performance of my campaigns. Break down results by key metrics, identify top and bottom performers, and highlight any significant trends or anomalies. Summarize with actionable takeaways.",
    context: null,
    presetId: null,
  },
  {
    name: "Low-Hanging Fruits",
    instructions:
      "Identify quick-win optimization opportunities across my campaigns. Look for underperforming ads with high potential, wasted spend, bid inefficiencies, and targeting gaps that could be fixed with minimal effort for maximum impact.",
    context: null,
    presetId: null,
  },
  {
    name: "Competitor Benchmark",
    instructions:
      "Compare my campaign performance against industry benchmarks and competitive positioning. Highlight where I'm outperforming, where I'm falling behind, and what strategies competitors might be leveraging that I'm not.",
    context: null,
    presetId: null,
  },
  {
    name: "Budget Optimizer",
    instructions:
      "Evaluate my current budget allocation across campaigns and platforms. Recommend how to redistribute spend to maximize ROI. Identify over-funded underperformers and underfunded high-potential campaigns.",
    context: null,
    presetId: null,
  },
  {
    name: "Weekly Digest",
    instructions:
      "Generate a concise weekly summary of my advertising performance. Include week-over-week changes, top highlights, areas of concern, and a prioritized list of recommended actions for the coming week.",
    context: null,
    presetId: null,
  },
];

function generateId(): string {
  return crypto.randomUUID();
}

function makeShortcut(data: Omit<Shortcut, "id" | "createdAt" | "updatedAt">): Shortcut {
  const now = Date.now();
  return { ...data, id: generateId(), createdAt: now, updatedAt: now };
}

export function loadShortcuts(): Shortcut[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed defaults
  }
  // First load — seed defaults
  const defaults = DEFAULT_SHORTCUTS.map(makeShortcut);
  saveShortcuts(defaults);
  return defaults;
}

export function saveShortcuts(shortcuts: Shortcut[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function createShortcut(
  name: string,
  instructions: string,
  context: ContextSelections | null,
  presetId: string | null,
): Shortcut {
  const now = Date.now();
  return { id: generateId(), name, instructions, context, presetId, createdAt: now, updatedAt: now };
}

export function duplicateShortcut(shortcut: Shortcut): Shortcut {
  const now = Date.now();
  return {
    ...shortcut,
    id: generateId(),
    name: `Copy of ${shortcut.name}`,
    context: shortcut.context
      ? {
          countries: [...shortcut.context.countries],
          platforms: [...shortcut.context.platforms],
          region: [...(shortcut.context.region ?? [])],
          category: [...(shortcut.context.category ?? [])],
          brand: [...(shortcut.context.brand ?? [])],
          page: [...(shortcut.context.page ?? [])],
        }
      : null,
    createdAt: now,
    updatedAt: now,
  };
}
