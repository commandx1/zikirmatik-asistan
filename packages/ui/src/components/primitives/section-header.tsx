import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View className="mb-3 gap-1">
      <Text className="text-lg font-bold text-[--text-primary]">{title}</Text>
      {subtitle ? <Text className="text-xs text-[--text-muted]">{subtitle}</Text> : null}
    </View>
  );
}
