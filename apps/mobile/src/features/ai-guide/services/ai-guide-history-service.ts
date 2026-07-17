import { i18n } from "../../../i18n";
import type { BackendAiRecommendation } from "./ai-api-client";
import type { AiGuideHistoryItem, AiGuideRecommendation } from "../types";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { useProfileStore } from "../../../store/profile-store";
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

export function buildAiGuideHistoryItems(rows: BackendAiRecommendation[], catalog: CatalogDhikr[]) {
  const catalogById = new Map(catalog.map((item) => [item._id, item]));
  const locale = useProfileStore.getState().locale;

  return rows
    .map((row): AiGuideHistoryItem | null => {
      const recommendations = row.recommendedDhikrIds.reduce<AiGuideRecommendation[]>((acc, id, index) => {
        const matched = catalogById.get(normalizeObjectId(id) ?? "");
        if (!matched) {
          return acc;
        }

        const title = resolveLocalizedText(matched.name, locale);
        acc.push({
          id: matched._id,
          title,
          chipEmoji: index === 0 ? "💆" : "✨",
          chipLabel:
            index === 0
              ? i18n.t("ai-guide:recommendation.chipLabelPrimary")
              : i18n.t("ai-guide:recommendation.chipLabelSecondary"),
          repeatLabel: index === 0 ? i18n.t("ai-guide:recommendation.repeatLabelPrimary") : undefined,
          arabic: matched.nameArabic,
          transliteration: resolveLocalizedText(matched.transliteration, locale) || title,
          meaning: resolveLocalizedText(matched.meaning, locale),
          virtue: matched.virtue ? resolveLocalizedText(matched.virtue, locale) : undefined,
          source: matched.source ? resolveLocalizedText(matched.source, locale) : undefined,
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
        prompt: row.freeText?.trim() || i18n.t("ai-guide:genericPrompt"),
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
