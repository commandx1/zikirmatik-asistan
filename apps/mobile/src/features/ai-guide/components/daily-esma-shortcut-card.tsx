import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";

type DailyEsmaShortcutCardProps = {
  onPress: () => void;
};

export function DailyEsmaShortcutCard({ onPress }: DailyEsmaShortcutCardProps) {
  const { tokens } = useThemeTokens();

  return (
    <Pressable
      onPress={onPress}
      className="mb-6 rounded-2xl border px-4 py-3"
      style={{
        borderColor: withAlpha(tokens.textPrimary, 0.12),
        backgroundColor: withAlpha(tokens.card, 0.88)
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: withAlpha(tokens.accent, 0.16) }}
        >
          <FontAwesome6 name="star-and-crescent" size={15} color={tokens.accent} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-[--text-primary]">Bugünün Esma önerileri</Text>
          <Text className="mt-1 text-xs leading-5 text-[--text-muted]">
            Günlük 3 öneriyi tekrar aç.
          </Text>
        </View>
        <View className="rounded-full px-3 py-2" style={{ backgroundColor: withAlpha(tokens.accent, 0.14) }}>
          <Text className="text-xs font-semibold text-[--accent]">Aç</Text>
        </View>
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
