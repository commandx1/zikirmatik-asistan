import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useThemeTokens } from "@zikirmatik/ui";
import { AppChip } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { formatCounter } from "@zikirmatik/shared";
import type { StatsDailyPoint } from "@zikirmatik/shared";
import { maxOf, withAlpha } from "./chart-utils";

const CHART_HEIGHT = 140;

function shortDate(key: string): string {
  const [, month, day] = key.split("-");
  return `${day}.${month}`;
}

export function DailyBarChart({ series }: { series: StatsDailyPoint[] }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");
  const [range, setRange] = useState<7 | 30>(7);
  const [width, setWidth] = useState(0);

  const points = series.slice(-range);
  const counts = points.map((point) => point.count);
  const max = maxOf(counts) || 1;
  const total = counts.reduce((sum, value) => sum + value, 0);

  const gap = range === 7 ? 8 : 3;
  const barWidth = width > 0 ? Math.max(2, (width - gap * (points.length - 1)) / points.length) : 0;

  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm text-[--text-muted]">{t("stats:dailyBarChart.totalLabel", { count: formatCounter(total) })}</Text>
        <View className="flex-row gap-2">
          <AppChip label={t("stats:dailyBarChart.range7")} active={range === 7} onPress={() => setRange(7)} />
          <AppChip label={t("stats:dailyBarChart.range30")} active={range === 30} onPress={() => setRange(30)} />
        </View>
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {points.map((point, index) => {
              const barHeight = Math.max(point.count > 0 ? 3 : 0, (point.count / max) * (CHART_HEIGHT - 4));
              const x = index * (barWidth + gap);
              const y = CHART_HEIGHT - barHeight;
              const isToday = index === points.length - 1;
              return (
                <Rect
                  key={point.date}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barWidth > 6 ? 3 : 1}
                  fill={isToday ? tokens.accent : withAlpha(tokens.accent, 0.45)}
                />
              );
            })}
          </Svg>
        ) : (
          <View style={{ height: CHART_HEIGHT }} />
        )}
      </View>

      <View className="mt-2 flex-row justify-between">
        <Text className="text-[10px] text-[--text-muted]">{points.length ? shortDate(points[0].date) : ""}</Text>
        <Text className="text-[10px] text-[--text-muted]">
          {points.length ? shortDate(points[points.length - 1].date) : ""}
        </Text>
      </View>
    </View>
  );
}
