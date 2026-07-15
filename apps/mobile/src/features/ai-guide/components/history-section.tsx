import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { i18n } from "../../../i18n";
import { useProfileStore } from "../../../store/profile-store";
import { toIntlLocale } from "../../../lib/locale-format";
import type { AiGuideHistoryItem } from "../types";

type HistorySectionProps = {
  items: AiGuideHistoryItem[];
  totalCount: number;
  isExpanded: boolean;
  activeRecommendationId?: string;
  onToggleExpanded: () => void;
  onOpenHistoryItem: (item: AiGuideHistoryItem) => void;
};

export function HistorySection({
  items,
  totalCount,
  isExpanded,
  activeRecommendationId,
  onToggleExpanded,
  onOpenHistoryItem
}: HistorySectionProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("ai-guide");

  if (totalCount === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <FontAwesome6 name="clock-rotate-left" size={12} color={tokens.accent} />
          <Text className="text-sm font-semibold text-[--text-primary]">{t("ai-guide:history.title")}</Text>
        </View>
        {totalCount > 2 ? (
          <Pressable onPress={onToggleExpanded} className="rounded-full px-3 py-1.5">
            <Text className="text-xs font-semibold text-[--accent]">
              {isExpanded ? t("ai-guide:history.showLastTwo") : t("ai-guide:history.showAll")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="gap-3">
        {items.map((item) => {
          const isActive = activeRecommendationId === item.id;
          const names = item.recommendations
            .slice(0, 3)
            .map((recommendation) => recommendation.transliteration)
            .join(" • ");

          return (
            <Pressable
              key={item.id}
              onPress={() => onOpenHistoryItem(item)}
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: isActive ? tokens.accent : withAlpha(tokens.textPrimary, 0.12),
                backgroundColor: isActive ? withAlpha(tokens.accent, 0.12) : withAlpha(tokens.card, 0.84)
              }}
            >
              <View className="mb-2 flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm font-semibold text-[--text-primary]" numberOfLines={1}>
                  {item.prompt}
                </Text>
                <Text className="text-xs text-[--text-muted]">{formatHistoryDate(item.createdAt)}</Text>
              </View>
              <Text className="text-xs leading-5 text-[--text-muted]" numberOfLines={2}>
                {names || t("ai-guide:history.noRecommendations")}
              </Text>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-[--text-muted]">
                  {t("ai-guide:history.recommendationCount", { count: item.recommendations.length })}
                </Text>
                <Text className="text-xs font-semibold text-[--accent]">
                  {isActive ? t("ai-guide:history.active") : t("ai-guide:history.show")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return i18n.t("ai-guide:history.recentTime");
  }

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return i18n.t("ai-guide:history.today");
  }
  if (dayDiff === 1) {
    return i18n.t("ai-guide:history.yesterday");
  }

  return date.toLocaleDateString(toIntlLocale(useProfileStore.getState().locale), {
    day: "2-digit",
    month: "short"
  });
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
