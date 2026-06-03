import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
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

  if (totalCount === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <FontAwesome6 name="clock-rotate-left" size={12} color={tokens.accent} />
          <Text className="text-sm font-semibold text-[--text-primary]">Son Asistan Aramaları</Text>
        </View>
        {totalCount > 2 ? (
          <Pressable onPress={onToggleExpanded} className="rounded-full px-3 py-1.5">
            <Text className="text-xs font-semibold text-[--accent]">
              {isExpanded ? "Son 2'yi Göster" : "Tümünü Gör"}
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
                <Text className="text-[11px] text-[--text-muted]">{formatHistoryDate(item.createdAt)}</Text>
              </View>
              <Text className="text-xs leading-5 text-[--text-muted]" numberOfLines={2}>
                {names || "Öneri bulunamadı"}
              </Text>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-[--text-muted]">
                  {item.recommendations.length} öneri
                </Text>
                <Text className="text-xs font-semibold text-[--accent]">
                  {isActive ? "Ekranda" : "Göster"}
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
    return "Yakın zaman";
  }

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return "Bugün";
  }
  if (dayDiff === 1) {
    return "Dün";
  }

  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
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
