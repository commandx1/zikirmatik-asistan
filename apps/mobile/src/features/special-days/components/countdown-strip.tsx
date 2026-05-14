import { Text, View } from "react-native";
import type { CountdownSegment } from "../types/view-model";

type CountdownStripProps = {
  segments: CountdownSegment[];
};

export function CountdownStrip({ segments }: CountdownStripProps) {
  return (
    <View className="mb-6 flex-row items-center rounded-2xl border border-white/5 bg-[--bg]/60 p-4">
      {segments.map((segment, index) => (
        <View key={segment.label} className="flex-1 flex-row items-center justify-center">
          <View className="items-center px-1">
            <Text className="text-[30px] leading-[34px] font-semibold tracking-[0.6px] text-[--text-primary]">
              {segment.value}
            </Text>
            <Text className="pt-1 text-[10px] leading-[14px] uppercase tracking-[0.8px] text-[--text-muted]">
              {segment.label}
            </Text>
          </View>
          {index < segments.length - 1 ? <Text className="px-1.5 text-lg font-semibold text-[--accent]/40">:</Text> : null}
        </View>
      ))}
    </View>
  );
}
