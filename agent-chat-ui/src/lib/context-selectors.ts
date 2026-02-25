export type ContextCategory = "countries" | "platforms";

export interface ContextCategoryConfig {
  id: ContextCategory;
  label: string;
  items: string[];
}

export const CONTEXT_CATEGORIES: ContextCategoryConfig[] = [
  {
    id: "countries",
    label: "Countries",
    items: [
      "Poland",
      "Germany",
      "France",
      "Spain",
      "Italy",
      "Netherlands",
      "United Kingdom",
      "Sweden",
      "Norway",
      "Denmark",
      "Czech Republic",
      "Austria",
      "Belgium",
      "Switzerland",
      "Portugal",
      "Romania",
    ],
  },
  {
    id: "platforms",
    label: "Platforms",
    items: [
      "Meta",
      "Google Ads",
      "DV360",
      "TikTok",
      "Snapchat",
      "Pinterest",
      "LinkedIn",
      "Twitter/X",
      "Amazon DSP",
      "Programmatic (Other)",
    ],
  },
];

export type ContextSelections = Record<ContextCategory, string[]>;

export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
};
