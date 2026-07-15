import { ScrollView, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import type { StatsHeatmapPoint } from "@zikirmatik/shared";
import { heatmapColor, maxOf, withAlpha } from "./chart-utils";

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const ROWS = 7;

function weekdayIndex(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun..6=Sat
}

export function ActivityHeatmap({ heatmap }: { heatmap: StatsHeatmapPoint[] }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");
  const emptyColor = withAlpha(tokens.textPrimary, 0.08);
  const max = maxOf(heatmap.map((point) => point.count));

  const firstWeekday = heatmap.length > 0 ? weekdayIndex(heatmap[0].date) : 0;
  const columns = Math.ceil((heatmap.length + firstWeekday) / ROWS);
  const svgWidth = columns * STEP;
  const svgHeight = ROWS * STEP;

  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgWidth} height={svgHeight}>
          {heatmap.map((point, index) => {
            const dayNumber = index + firstWeekday;
            const col = Math.floor(dayNumber / ROWS);
            const row = dayNumber % ROWS;
            return (
              <Rect
                key={point.date}
                x={col * STEP}
                y={row * STEP}
                width={CELL}
                height={CELL}
                rx={2}
                fill={heatmapColor(point.count, max, tokens.accent, emptyColor)}
              />
            );
          })}
        </Svg>
      </ScrollView>

      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <Text className="text-[10px] text-[--text-muted]">{t("stats:activityHeatmap.low")}</Text>
        {[0.25, 0.45, 0.7, 1].map((level) => (
          <View
            key={level}
            style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: withAlpha(tokens.accent, level) }}
          />
        ))}
        <Text className="text-[10px] text-[--text-muted]">{t("stats:activityHeatmap.high")}</Text>
      </View>
    </View>
  );
}
