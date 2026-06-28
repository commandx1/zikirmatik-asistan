import { View } from "react-native";
import type { StatsDistributionPoint } from "@zikirmatik/shared";
import { WEEKDAY_DISPLAY_ORDER, WEEKDAY_LABELS, maxOf } from "./chart-utils";
import { VerticalBars, type VerticalBarDatum } from "./vertical-bars";

export function WeekdayDistribution({ distribution }: { distribution: StatsDistributionPoint[] }) {
  const byKey = new Map(distribution.map((point) => [point.key, point.count]));
  const max = maxOf(distribution.map((point) => point.count));

  const data: VerticalBarDatum[] = WEEKDAY_DISPLAY_ORDER.map((weekday) => {
    const value = byKey.get(weekday) ?? 0;
    return {
      key: String(weekday),
      label: WEEKDAY_LABELS[weekday],
      value,
      highlight: max > 0 && value === max
    };
  });

  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
      <VerticalBars data={data} />
    </View>
  );
}
