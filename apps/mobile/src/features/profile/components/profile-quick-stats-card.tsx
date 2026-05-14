import { Fragment } from "react";
import { Text, View } from "react-native";
import type { ProfileQuickStat } from "../types";

type ProfileQuickStatsCardProps = {
  stats: ProfileQuickStat[];
};

export function ProfileQuickStatsCard({ stats }: ProfileQuickStatsCardProps) {
  return (
    <View className="rounded-2xl border border-white/5 bg-[--card] p-4">
      <View className="flex-row items-center">
        {stats.map((item, index) => (
          <Fragment key={item.id}>
            <View className="flex-1 items-center">
              <Text className="text-[18px] leading-6 font-semibold text-[--text-primary]" numberOfLines={1}>
                {item.value}
              </Text>
              <Text className="mt-0.5 text-[10px] leading-[14px] text-[--text-muted]" numberOfLines={1}>
                {item.label}
              </Text>
            </View>
            {index < stats.length - 1 ? <View className="h-8 w-px bg-white/5" /> : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
