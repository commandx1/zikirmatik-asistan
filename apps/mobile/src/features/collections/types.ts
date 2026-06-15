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
  label: string;
}> = [
  { key: "all", label: "Tümü" },
  { key: "gunluk", label: "Günlük" },
  { key: "namaz", label: "Namaz" },
  { key: "dua", label: "Dua" },
  { key: "koruma", label: "Koruma" },
  { key: "hayat", label: "Hayat" },
  { key: "ibadet", label: "İbadet" },
];
