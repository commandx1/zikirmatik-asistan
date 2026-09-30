import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "../../../i18n";
import { formatInteger, formatPercent } from "../../../lib/locale-format";
import type { StatsSummary } from "@zikirmatik/shared";

type IconName = "infinity" | "fire" | "trophy" | "calendar-check" | "circle-check" | "sun" | "calendar-week" | "calendar-days" | "chart-line";

type StatItem = {
  icon: IconName;
  labelKey: string;
  value: string;
  unit?: string;
};

function StatCard({ item }: { item: StatItem }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");
  return (
    <View className="mb-3 w-[48%] rounded-2xl border border-border bg-card p-4">
      <FontAwesome6 name={item.icon} iconStyle="solid" size={16} color={tokens.accent} />
      <Text className="mt-3 text-2xl font-bold text-text-primary" numberOfLines={1}>
        {item.value}
        {item.unit ? <Text className="text-sm font-medium text-text-muted"> {item.unit}</Text> : null}
      </Text>
      <Text className="mt-1 text-xs text-text-muted" numberOfLines={1}>
        {t(`stats:summary.${item.labelKey}`)}
      </Text>
    </View>
  );
}

export function SummaryCards({ summary }: { summary: StatsSummary }) {
  const { totals, periods, streak } = summary;
  const { t } = useTranslation("stats");
  const locale = useAppLocale();
  const dayUnit = t("stats:summary.dayUnit");

  const items: StatItem[] = [
    { icon: "infinity", labelKey: "totalDhikr", value: formatInteger(totals.allTimeCount, locale) },
    { icon: "fire", labelKey: "currentStreak", value: String(streak.currentStreak), unit: dayUnit },
    { icon: "trophy", labelKey: "longestStreak", value: String(streak.longestStreak), unit: dayUnit },
    { icon: "calendar-check", labelKey: "activeDays", value: formatInteger(streak.totalDaysActive, locale) },
    { icon: "sun", labelKey: "today", value: formatInteger(periods.today, locale) },
    { icon: "calendar-week", labelKey: "thisWeek", value: formatInteger(periods.thisWeek, locale) },
    { icon: "calendar-days", labelKey: "thisMonth", value: formatInteger(periods.thisMonth, locale) },
    { icon: "chart-line", labelKey: "dailyAverage", value: formatInteger(totals.averagePerActiveDay, locale) },
    { icon: "circle-check", labelKey: "completion", value: formatPercent(totals.completionRate, locale) }
  ];

  return (
    <View className="flex-row flex-wrap justify-between">
      {items.map((item) => (
        <StatCard key={item.labelKey} item={item} />
      ))}
    </View>
  );
}
