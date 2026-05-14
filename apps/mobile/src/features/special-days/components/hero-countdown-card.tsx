import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { Text, View } from "react-native";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedTag } from "../../../components/ui/themed-tag";
import { CountdownStrip } from "./countdown-strip";
import { DecorativePattern } from "./decorative-pattern";
import type { HeroCardViewModel } from "../types/view-model";

type HeroCountdownCardProps = {
  data: HeroCardViewModel;
};

export function HeroCountdownCard({ data }: HeroCountdownCardProps) {
  const { tokens } = useThemeTokens();

  return (
    <ThemedCard
      className="rounded-[24px] p-6"
      borderClassName="border-white/5"
      elevated
      style={{
        shadowColor: "#000000",
        shadowOpacity: 0.24,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }
      }}
    >
      <DecorativePattern />

      <ThemedTag label={data.badge} variant="accent" className="z-10 self-start px-3 py-[7px]" />
      {data.isLocked ? (
        <View className="z-10 mt-2 self-start">
          <ThemedTag label="Premium Kilidi" className="bg-[--bg] px-3 py-[6px]" />
        </View>
      ) : null}

      <View className="z-10 mb-6 mt-4">
        <Text className="text-2xl leading-[34px] font-semibold tracking-tight text-[--text-primary]" numberOfLines={2}>
          {data.title}
        </Text>
        <Text className="pt-1 text-sm leading-5 text-[--text-muted]">{data.dateLabel}</Text>
      </View>

      <CountdownStrip segments={data.countdown} />

      <View className="z-10 mt-4 flex-row items-center justify-center gap-2">
        <FontAwesome6 name="calendar-day" iconStyle="regular" size={12} color={tokens.textMuted} />
        <Text className="text-xs leading-5 text-[--text-muted]">Kalan: {data.remaining}</Text>
      </View>
    </ThemedCard>
  );
}
