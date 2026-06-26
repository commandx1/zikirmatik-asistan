import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";

type ProfileTimeRowProps = {
  label: string;
  value: string;
  bottomBorder?: boolean;
  onPress?: () => void;
};

export function ProfileTimeRow({ label, value, bottomBorder = false, onPress }: ProfileTimeRowProps) {
  const { tokens } = useThemeTokens();

  return (
    <Pressable onPress={onPress} className={`flex-row items-center justify-between p-4 ${bottomBorder ? "border-b border-white/5" : ""}`}>
      <View className="flex-row items-center gap-3">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(tokens.accent, 0.12) }}
        >
          <FontAwesome6 name="clock" iconStyle="regular" size={14} color={tokens.accent} />
        </View>
        <Text className="text-base font-medium text-[--text-primary]">{label}</Text>
      </View>
      <View className="rounded-md bg-white/5 px-2 py-1">
        <Text className="text-sm font-medium text-[--text-primary]">{value}</Text>
      </View>
    </Pressable>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
