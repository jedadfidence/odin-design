export type ContextCategory = "countries" | "platforms" | "region" | "category" | "brand" | "page";

export interface ContextCategoryConfig {
  id: ContextCategory;
  label: string;
  items: string[];
}

export const CONTEXT_CATEGORIES: ContextCategoryConfig[] = [
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
    id: "region",
    label: "Region",
    items: ["EMEA", "APAC", "Americas", "LATAM"],
  },
  {
    id: "category",
    label: "Category",
    items: ["Beauty", "Food", "Beverages", "Household", "Healthcare"],
  },
  {
    id: "brand",
    label: "Brand",
    items: ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"],
  },
];

export type ContextSelections = Record<ContextCategory, string[]>;

export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
  region: [],
  category: [],
  brand: [],
  page: [],
};
