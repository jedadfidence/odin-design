export type FilterCategory =
  | "itemId"
  | "platform"
  | "placement"
  | "objective"
  | "buyingType"
  | "performanceGoal"
  | "region"
  | "country"
  | "category"
  | "brand";

export interface FilterCategoryConfig {
  id: FilterCategory;
  label: string;
  items: string[];
}

export const FILTER_CATEGORIES: FilterCategoryConfig[] = [
  {
    id: "itemId",
    label: "Item ID",
    items: ["ID-10001", "ID-10002", "ID-10003", "ID-10004", "ID-10005", "ID-10006", "ID-10007", "ID-10008"],
  },
  {
    id: "platform",
    label: "Platform",
    items: ["Meta", "Google Ads", "DV360", "TikTok", "Snapchat", "Pinterest", "LinkedIn"],
  },
  {
    id: "placement",
    label: "Placement",
    items: ["Feed", "Stories", "Reels", "Search", "Display", "Video"],
  },
  {
    id: "objective",
    label: "Objective",
    items: ["Awareness", "Reach", "Traffic", "Engagement", "Conversions", "Sales"],
  },
  {
    id: "buyingType",
    label: "Buying Type",
    items: ["Auction", "Reservation", "Fixed"],
  },
  {
    id: "performanceGoal",
    label: "Performance Goal",
    items: ["Impressions", "Clicks", "Conversions", "Video Views", "Reach"],
  },
  {
    id: "region",
    label: "Region",
    items: ["EMEA", "APAC", "Americas", "LATAM"],
  },
  {
    id: "country",
    label: "Country",
    items: ["Poland", "Germany", "United Kingdom", "France", "Spain", "Italy", "United States", "Canada", "Brazil"],
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

export type FilterSelections = Record<FilterCategory, string[]>;

export const EMPTY_FILTER_SELECTIONS: FilterSelections = {
  itemId: [],
  platform: [],
  placement: [],
  objective: [],
  buyingType: [],
  performanceGoal: [],
  region: [],
  country: [],
  category: [],
  brand: [],
};

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
