import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { ThemedCard } from "../../../components/ui/themed-card";
import { AI_GUIDE_CURRENT_STATE } from "../data";

type CurrentStateCardProps = {
  moodTitle: string;
  moodEmoji: string;
  prayerTimeLabel: string;
  weekdayLabel: string;
};

export function CurrentStateCard({
  moodTitle,
  moodEmoji,
  prayerTimeLabel,
  weekdayLabel,
}: CurrentStateCardProps) {
  return (
    <ThemedCard className="mb-6 rounded-[24px] p-5" elevated>
      <View className="mb-4 flex-row items-start justify-between">
        <Text className="text-xs font-semibold tracking-[1.1px] text-[--text-muted]">{AI_GUIDE_CURRENT_STATE.label}</Text>
      </View>

      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-[--bg]">
          <Text className="text-2xl">{moodEmoji}</Text>
        </View>
        <Text className="flex-1 text-sm leading-[30px] font-semibold text-[--text-primary]" numberOfLines={2}>
          {moodTitle}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-4 border-t border-white/5 pt-4">
        <View className="flex-row items-center gap-1.5">
          <FontAwesome6 name="clock" iconStyle="regular" size={11} color="#D6A93D" />
          <Text className="text-xs text-[--text-muted]">{prayerTimeLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <FontAwesome6 name="calendar" iconStyle="regular" size={11} color="#D6A93D" />
          <Text className="text-xs text-[--text-muted]">{weekdayLabel}</Text>
        </View>
      </View>
    </ThemedCard>
  );
}
