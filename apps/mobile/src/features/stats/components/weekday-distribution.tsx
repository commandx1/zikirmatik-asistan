import { View } from "react-native";
import { useTranslation } from "react-i18next";
import type { StatsDistributionPoint } from "@zikirmatik/shared";
import { WEEKDAY_DISPLAY_ORDER, maxOf } from "./chart-utils";
import { VerticalBars, type VerticalBarDatum } from "./vertical-bars";

export function WeekdayDistribution({ distribution }: { distribution: StatsDistributionPoint[] }) {
  const { t } = useTranslation("stats");
  const byKey = new Map(distribution.map((point) => [point.key, point.count]));
  const max = maxOf(distribution.map((point) => point.count));

  const data: VerticalBarDatum[] = WEEKDAY_DISPLAY_ORDER.map((weekday) => {
    const value = byKey.get(weekday) ?? 0;
    return {
      key: String(weekday),
      label: t(`stats:weekdayLabels.${weekday}`),
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
