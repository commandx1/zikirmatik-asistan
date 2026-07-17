import { i18n } from "../../../i18n";
import type { BackendAiRecommendation } from "./ai-api-client";
import type { AiGuideHistoryItem, AiGuideHistoryItemRaw, AiGuideRecommendationRaw } from "../types";
import type { LocalizedText } from "@zikirmatik/shared";

type CatalogDhikr = {
  _id: string;
  name: LocalizedText;
  nameArabic: string;
  transliteration: LocalizedText;
  meaning: LocalizedText;
  virtue?: LocalizedText;
  source?: LocalizedText;
  recommendedCount?: number;
};

export function resolveVisibleAiGuideHistory(items: AiGuideHistoryItem[], showAll: boolean) {
  return showAll ? items : items.slice(0, 2);
}

/**
 * Backend geçmiş kayıtlarını dil-bağımsız (raw LocalizedText) alanlarla üretir.
 * Görüntülenecek dize çözümü render anında, aktif dile göre yapılmalıdır
 * (bkz. use-ai-guide.ts -> resolveRecommendation) — burada locale'e göre
 * çözüm YAPILMAZ ki dil değişince kartlar da güncellenebilsin.
 */
export function buildAiGuideHistoryItems(rows: BackendAiRecommendation[], catalog: CatalogDhikr[]): AiGuideHistoryItemRaw[] {
  const catalogById = new Map(catalog.map((item) => [item._id, item]));

  return rows
    .map((row): AiGuideHistoryItemRaw | null => {
      const recommendations = row.recommendedDhikrIds.reduce<AiGuideRecommendationRaw[]>((acc, id) => {
        const matched = catalogById.get(normalizeObjectId(id) ?? "");
        if (!matched) {
          return acc;
        }

        acc.push({
          id: matched._id,
          name: matched.name,
          arabic: matched.nameArabic,
          transliteration: matched.transliteration,
          meaning: matched.meaning,
          virtue: matched.virtue,
          source: matched.source,
          recommendedCount: matched.recommendedCount
        });
        return acc;
      }, []);

      if (recommendations.length === 0) {
        return null;
      }

      return {
        id: normalizeObjectId(row._id) ?? row.createdAt,
        prompt: row.freeText?.trim() || i18n.t("ai-guide:genericPrompt"),
        assistantNote: row.assistantNote?.trim() || undefined,
        createdAt: row.createdAt,
        recommendations
      };
    })
    .filter((item): item is AiGuideHistoryItemRaw => Boolean(item))
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
