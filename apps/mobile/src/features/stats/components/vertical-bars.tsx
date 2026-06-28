import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useThemeTokens } from "@zikirmatik/ui";
import { maxOf, withAlpha } from "./chart-utils";

export type VerticalBarDatum = {
  key: string;
  label?: string;
  value: number;
  highlight?: boolean;
};

type VerticalBarsProps = {
  data: VerticalBarDatum[];
  height?: number;
};

export function VerticalBars({ data, height = 120 }: VerticalBarsProps) {
  const { tokens } = useThemeTokens();
  const [width, setWidth] = useState(0);

  const max = maxOf(data.map((datum) => datum.value)) || 1;
  const count = data.length;
  const gap = count > 12 ? 2 : 6;
  const barWidth = width > 0 ? Math.max(2, (width - gap * (count - 1)) / count) : 0;

  return (
    <View>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {data.map((datum, index) => {
              const barHeight = Math.max(datum.value > 0 ? 3 : 0, (datum.value / max) * (height - 4));
              const x = index * (barWidth + gap);
              return (
                <Rect
                  key={datum.key}
                  x={x}
                  y={height - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={barWidth > 6 ? 3 : 1}
                  fill={datum.highlight ? tokens.accent : withAlpha(tokens.accent, 0.45)}
                />
              );
            })}
          </Svg>
        ) : (
          <View style={{ height }} />
        )}
      </View>

      {width > 0 ? (
        <View className="mt-1.5 flex-row" style={{ width }}>
          {data.map((datum, index) => (
            <View
              key={datum.key}
              style={{ width: barWidth, marginRight: index === count - 1 ? 0 : gap }}
              className="items-center"
            >
              {datum.label ? (
                <Text className="text-[9px] text-[--text-muted]" numberOfLines={1}>
                  {datum.label}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
