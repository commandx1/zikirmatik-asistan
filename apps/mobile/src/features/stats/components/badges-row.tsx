import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ScrollView, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import type { StatsBadge } from "@zikirmatik/shared";
import { withAlpha } from "./chart-utils";

function BadgeCard({ badge }: { badge: StatsBadge }) {
  const { tokens } = useThemeTokens();
  const tint = badge.achieved ? tokens.accent : withAlpha(tokens.textPrimary, 0.18);

  return (
    <View
      className="w-28 items-center rounded-2xl border p-3"
      style={{
        borderColor: badge.achieved ? withAlpha(tokens.accent, 0.4) : tokens.border,
        backgroundColor: badge.achieved ? withAlpha(tokens.accent, 0.08) : tokens.card,
        opacity: badge.achieved ? 1 : 0.85
      }}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(tint, 0.18) }}>
        <FontAwesome6 name={badge.achieved ? "medal" : "lock"} iconStyle="solid" size={18} color={tint} />
      </View>
      <Text className="mt-2 text-center text-xs font-medium text-[--text-primary]" numberOfLines={2}>
        {badge.label}
      </Text>
      <Text className="mt-1 text-[11px] font-semibold" style={{ color: badge.achieved ? tokens.accent : tokens.textMuted }}>
        {badge.achieved ? "Kazanıldı" : `%${Math.round(badge.progress * 100)}`}
      </Text>
    </View>
  );
}

export function BadgesRow({ badges }: { badges: StatsBadge[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
      {badges.map((badge) => (
        <BadgeCard key={badge.key} badge={badge} />
      ))}
    </ScrollView>
  );
}
