import type { CollectionCategory } from "./services/collections-api-client";

export type { CollectionCategory };

export const FREE_COLLECTION_KEYS = new Set([
  "sabah-zikirleri",
  "aksam-zikirleri",
  "namaz-sonrasi-zikir",
  "gunluk-tesbih",
]);

export const COLLECTION_CATEGORIES: Array<{
  key: CollectionCategory | "all";
  labelKey: string;
}> = [
  { key: "all", labelKey: "all" },
  { key: "gunluk", labelKey: "gunluk" },
  { key: "namaz", labelKey: "namaz" },
  { key: "dua", labelKey: "dua" },
  { key: "koruma", labelKey: "koruma" },
  { key: "hayat", labelKey: "hayat" },
  { key: "ibadet", labelKey: "ibadet" },
];
