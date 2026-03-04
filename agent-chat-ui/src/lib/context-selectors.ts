export type ContextCategory = "countries" | "platforms" | "metrics" | "page";

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
  {
    id: "metrics",
    label: "Metrics",
    items: [
      "Impressions",
      "Clicks",
      "CTR (Click-Through Rate)",
      "CPC (Cost Per Click)",
      "CPM (Cost Per Mille)",
      "Spend",
      "Conversions",
      "Conversion Rate",
      "CPA (Cost Per Acquisition)",
      "ROAS (Return on Ad Spend)",
      "Revenue",
      "Reach",
      "Frequency",
      "Video Views",
      "VTR (View-Through Rate)",
      "Engagement Rate",
      "Bounce Rate",
      "Add to Cart",
      "CPV (Cost Per View)",
      "ACOS (Ad Cost of Sales)",
    ],
  },
];

export type ContextSelections = Record<ContextCategory, string[]>;

export const EMPTY_SELECTIONS: ContextSelections = {
  countries: [],
  platforms: [],
  metrics: [],
  page: [],
};
