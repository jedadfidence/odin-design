import { ContextSelections } from "./context-selectors";

export interface ContextPreset {
  id: string;
  name: string;
  selections: ContextSelections;
}

const STORAGE_KEY = "odin-context-presets";

export function loadPresets(): ContextPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: ContextPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function generateId(): string {
  return crypto.randomUUID();
}

export function createPreset(name: string, selections: ContextSelections): ContextPreset {
  return { id: generateId(), name, selections: { ...selections } };
}

export function duplicatePreset(preset: ContextPreset): ContextPreset {
  return {
    id: generateId(),
    name: `Copy of ${preset.name}`,
    selections: {
      countries: [...preset.selections.countries],
      platforms: [...preset.selections.platforms],
      region: [...(preset.selections.region ?? [])],
      category: [...(preset.selections.category ?? [])],
      brand: [...(preset.selections.brand ?? [])],
      page: [...(preset.selections.page ?? [])],
    },
  };
}

/** Build a short summary like "3 countries, 2 platforms" */
export function presetSummary(preset: ContextPreset): string {
  const parts: string[] = [];
  const c = preset.selections.countries.length;
  const p = preset.selections.platforms.length;
  const r = (preset.selections.region ?? []).length;
  const cat = (preset.selections.category ?? []).length;
  const b = (preset.selections.brand ?? []).length;
  if (c > 0) parts.push(`${c} ${c === 1 ? "country" : "countries"}`);
  if (p > 0) parts.push(`${p} ${p === 1 ? "platform" : "platforms"}`);
  if (r > 0) parts.push(`${r} ${r === 1 ? "region" : "regions"}`);
  if (cat > 0) parts.push(`${cat} ${cat === 1 ? "category" : "categories"}`);
  if (b > 0) parts.push(`${b} ${b === 1 ? "brand" : "brands"}`);
  return parts.join(", ") || "Empty";
}
