import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { formatCounter } from "@zikirmatik/shared";
import type { StatsPeriodComparison } from "@zikirmatik/shared";

const NEGATIVE_COLOR = "#E5675C";

function ComparisonRow({ label, data }: { label: string; data: StatsPeriodComparison }) {
  const { tokens } = useThemeTokens();
  const isUp = data.changePercent >= 0;
  const color = data.changePercent === 0 ? tokens.textMuted : isUp ? tokens.success : NEGATIVE_COLOR;

  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-1">
        <Text className="text-sm font-medium text-[--text-primary]">{label}</Text>
        <Text className="mt-0.5 text-xs text-[--text-muted]">
          Önceki dönem: {formatCounter(data.previous)}
        </Text>
      </View>
      <Text className="mr-3 text-lg font-bold text-[--text-primary]">{formatCounter(data.current)}</Text>
      <View className="w-20 flex-row items-center justify-end">
        <FontAwesome6
          name={data.changePercent === 0 ? "minus" : isUp ? "arrow-trend-up" : "arrow-trend-down"}
          iconStyle="solid"
          size={12}
          color={color}
        />
        <Text className="ml-1.5 text-sm font-semibold" style={{ color }}>
          %{Math.abs(data.changePercent)}
        </Text>
      </View>
    </View>
  );
}

export function PeriodComparison({
  comparison
}: {
  comparison: { week: StatsPeriodComparison; month: StatsPeriodComparison };
}) {
  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] px-4 py-2">
      <ComparisonRow label="Bu hafta" data={comparison.week} />
      <View className="h-px bg-[--border]" />
      <ComparisonRow label="Bu ay" data={comparison.month} />
    </View>
  );
}
