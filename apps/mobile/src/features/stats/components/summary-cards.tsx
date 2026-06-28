import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { formatCounter } from "@zikirmatik/shared";
import type { StatsSummary } from "@zikirmatik/shared";

type IconName = "infinity" | "fire" | "trophy" | "calendar-check" | "circle-check" | "sun" | "calendar-week" | "calendar-days" | "chart-line";

type StatItem = {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
};

function StatCard({ item }: { item: StatItem }) {
  const { tokens } = useThemeTokens();
  return (
    <View className="mb-3 w-[48%] rounded-2xl border border-[--border] bg-[--card] p-4">
      <FontAwesome6 name={item.icon} iconStyle="solid" size={16} color={tokens.accent} />
      <Text className="mt-3 text-2xl font-bold text-[--text-primary]" numberOfLines={1}>
        {item.value}
        {item.unit ? <Text className="text-sm font-medium text-[--text-muted]"> {item.unit}</Text> : null}
      </Text>
      <Text className="mt-1 text-xs text-[--text-muted]" numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

export function SummaryCards({ summary }: { summary: StatsSummary }) {
  const { totals, periods, streak } = summary;

  const items: StatItem[] = [
    { icon: "infinity", label: "Toplam zikir", value: formatCounter(totals.allTimeCount) },
    { icon: "fire", label: "Mevcut seri", value: String(streak.currentStreak), unit: "gün" },
    { icon: "trophy", label: "En uzun seri", value: String(streak.longestStreak), unit: "gün" },
    { icon: "calendar-check", label: "Aktif gün", value: formatCounter(streak.totalDaysActive) },
    { icon: "sun", label: "Bugün", value: formatCounter(periods.today) },
    { icon: "calendar-week", label: "Bu hafta", value: formatCounter(periods.thisWeek) },
    { icon: "calendar-days", label: "Bu ay", value: formatCounter(periods.thisMonth) },
    { icon: "chart-line", label: "Günlük ortalama", value: formatCounter(totals.averagePerActiveDay) },
    { icon: "circle-check", label: "Tamamlama", value: `%${totals.completionRate}` }
  ];

  return (
    <View className="flex-row flex-wrap justify-between">
      {items.map((item) => (
        <StatCard key={item.label} item={item} />
      ))}
    </View>
  );
}
