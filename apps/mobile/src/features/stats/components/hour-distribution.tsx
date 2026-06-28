import { View } from "react-native";
import type { StatsDistributionPoint } from "@zikirmatik/shared";
import { maxOf } from "./chart-utils";
import { VerticalBars, type VerticalBarDatum } from "./vertical-bars";

const LABELLED_HOURS = new Set([0, 6, 12, 18]);

export function HourDistribution({ distribution }: { distribution: StatsDistributionPoint[] }) {
  const byKey = new Map(distribution.map((point) => [point.key, point.count]));
  const max = maxOf(distribution.map((point) => point.count));

  const data: VerticalBarDatum[] = Array.from({ length: 24 }, (_, hour) => {
    const value = byKey.get(hour) ?? 0;
    return {
      key: String(hour),
      label: LABELLED_HOURS.has(hour) ? `${hour}` : undefined,
      value,
      highlight: max > 0 && value === max
    };
  });

  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
      <VerticalBars data={data} height={110} />
    </View>
  );
}
