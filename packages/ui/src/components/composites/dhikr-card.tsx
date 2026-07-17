import { Text, View } from "react-native";
import { AppButton } from "../primitives/app-button";
import { AppCard } from "../primitives/app-card";

type DhikrCardProps = {
  nameArabic: string;
  name: string;
  meaning: string;
  onStart?: () => void;
};

export function DhikrCard({ nameArabic, name, meaning, onStart }: DhikrCardProps) {
  return (
    <AppCard elevated className="gap-3">
      <View className="gap-1">
        <Text className="text-[28px] text-[--text-primary]" selectable>
          {nameArabic}
        </Text>
        <Text className="text-base font-semibold text-[--text-primary]">{name}</Text>
        <Text className="text-xs text-[--text-muted]">{meaning}</Text>
      </View>
      <AppButton label="Zikre Başla" onPress={onStart} />
    </AppCard>
  );
}
