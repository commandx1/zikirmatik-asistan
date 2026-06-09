import type { BackendAiRecommendation } from "./ai-api-client";
import type { AiGuideHistoryItem, AiGuideRecommendation } from "../types";

type CatalogDhikr = {
  _id: string;
  nameTurkish: string;
  nameArabic: string;
  transliteration: string;
  meaning: string;
  virtue?: string;
  source?: string;
  recommendedCount?: number;
};

export function resolveVisibleAiGuideHistory(items: AiGuideHistoryItem[], showAll: boolean) {
  return showAll ? items : items.slice(0, 2);
}

export function buildAiGuideHistoryItems(rows: BackendAiRecommendation[], catalog: CatalogDhikr[]) {
  const catalogById = new Map(catalog.map((item) => [item._id, item]));

  return rows
    .map((row): AiGuideHistoryItem | null => {
      const recommendations = row.recommendedDhikrIds.reduce<AiGuideRecommendation[]>((acc, id, index) => {
        const matched = catalogById.get(normalizeObjectId(id) ?? "");
        if (!matched) {
          return acc;
        }

        acc.push({
          id: matched._id,
          chipEmoji: index === 0 ? "💆" : "✨",
          chipLabel: index === 0 ? "Senin için birincil öneri" : "Asistan önerisi",
          repeatLabel: index === 0 ? "Öncelikli" : undefined,
          arabic: matched.nameArabic,
          transliteration: matched.transliteration || matched.nameTurkish,
          meaning: matched.meaning,
          virtue: matched.virtue,
          source: matched.source,
          recommendedCount: matched.recommendedCount,
          isPrimary: index === 0
        });
        return acc;
      }, []);

      if (recommendations.length === 0) {
        return null;
      }

      return {
        id: normalizeObjectId(row._id) ?? row.createdAt,
        prompt: row.freeText?.trim() || "Genel öneri",
        assistantNote: row.assistantNote?.trim() || undefined,
        createdAt: row.createdAt,
        recommendations
      };
    })
    .filter((item): item is AiGuideHistoryItem => Boolean(item))
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
}

function normalizeObjectId(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as { $oid?: unknown; _id?: unknown; toString?: () => string };
  if (typeof candidate.$oid === "string" && candidate.$oid.trim()) {
    return candidate.$oid;
  }

  if (typeof candidate._id === "string" && candidate._id.trim()) {
    return candidate._id;
  }

  if (typeof candidate.toString === "function") {
    const stringified = candidate.toString();
    if (typeof stringified === "string" && stringified.trim() && stringified !== "[object Object]") {
      return stringified;
    }
  }

  return undefined;
}

function toTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
