import { Text, View } from "react-native";
import type { Dhikr } from "@zikirmatik/shared";
import { AppButton } from "../primitives/app-button";
import { AppCard } from "../primitives/app-card";

type DhikrCardProps = {
  dhikr: Dhikr;
  onStart?: () => void;
};

export function DhikrCard({ dhikr, onStart }: DhikrCardProps) {
  return (
    <AppCard elevated className="gap-3">
      <View className="gap-1">
        <Text className="text-[28px] text-[--text-primary]" selectable>
          {dhikr.nameArabic}
        </Text>
        <Text className="text-base font-semibold text-[--text-primary]">{dhikr.nameTurkish}</Text>
        <Text className="text-xs text-[--text-muted]">{dhikr.meaning}</Text>
      </View>
      <AppButton label="Zikre Başla" onPress={onStart} />
    </AppCard>
  );
}
