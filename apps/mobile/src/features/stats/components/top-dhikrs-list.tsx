import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { formatCounter } from "@zikirmatik/shared";
import type { StatsTopDhikr } from "@zikirmatik/shared";
import { maxOf, withAlpha } from "./chart-utils";

export function TopDhikrsList({ items }: { items: StatsTopDhikr[] }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");
  const max = maxOf(items.map((item) => item.totalCount)) || 1;

  if (items.length === 0) {
    return (
      <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
        <Text className="text-sm text-[--text-muted]">{t("stats:topDhikrs.empty")}</Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
      {items.map((item, index) => (
        <View key={item.key} className={index === items.length - 1 ? "" : "mb-3"}>
          <View className="mb-1.5 flex-row items-center">
            <Text className="w-6 text-sm font-bold text-[--text-muted]">{index + 1}</Text>
            <Text className="flex-1 text-sm font-medium text-[--text-primary]" numberOfLines={1}>
              {item.label}
            </Text>
            <Text className="text-sm font-semibold text-[--text-muted]">{formatCounter(item.totalCount)}</Text>
          </View>
          <View className="ml-6 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.08) }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.max(4, (item.totalCount / max) * 100)}%`, backgroundColor: tokens.accent }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
