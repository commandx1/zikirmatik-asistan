import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { formatCounter } from "@zikirmatik/shared";
import type { StatsSourceBreakdown } from "@zikirmatik/shared";
import { SOURCE_ORDER, withAlpha } from "./chart-utils";

const SIZE = 132;
const STROKE = 20;

export function SourceDonut({ breakdown }: { breakdown: StatsSourceBreakdown }) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");
  const radius = (SIZE - STROKE) / 2;
  const center = SIZE / 2;
  const circumference = 2 * Math.PI * radius;

  const colors: Record<string, string> = {
    manual: tokens.accent,
    ai: tokens.success,
    "special-day": withAlpha(tokens.accent, 0.5),
    notification: withAlpha(tokens.textMuted, 0.6)
  };

  const total = SOURCE_ORDER.reduce((sum, key) => sum + breakdown[key], 0);

  let accumulated = 0;
  const segments = SOURCE_ORDER.map((key) => {
    const value = breakdown[key];
    const fraction = total > 0 ? value / total : 0;
    const segment = {
      key,
      value,
      fraction,
      color: colors[key],
      offsetRotation: (accumulated / Math.max(total, 1)) * 360
    };
    accumulated += value;
    return segment;
  });

  return (
    <View className="rounded-2xl border border-[--border] bg-[--card] p-4">
      <View className="flex-row items-center">
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={withAlpha(tokens.textPrimary, 0.08)}
            strokeWidth={STROKE}
          />
          {total > 0
            ? segments.map((segment) =>
                segment.value > 0 ? (
                  <Circle
                    key={segment.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${segment.fraction * circumference} ${circumference}`}
                    origin={`${center}, ${center}`}
                    rotation={-90 + segment.offsetRotation}
                  />
                ) : null
              )
            : null}
        </Svg>

        <View className="ml-5 flex-1 gap-2">
          {segments.map((segment) => (
            <View key={segment.key} className="flex-row items-center">
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: segment.color }} />
              <Text className="ml-2 flex-1 text-sm text-[--text-primary]">{t(`stats:sourceLabels.${segment.key}`)}</Text>
              <Text className="text-sm font-semibold text-[--text-muted]">
                {formatCounter(segment.value)}
                {total > 0 ? ` · %${Math.round(segment.fraction * 100)}` : ""}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
