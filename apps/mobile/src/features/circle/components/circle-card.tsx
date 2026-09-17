import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { useCircleStore } from "../../../store/circle-store";
import { resolveLocalizedText } from "../../../store/dhikr-store";

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

// Ana ekrandaki Zikir Halkası kartı — todays-vird-card.tsx ile aynı desen
// (home-context'ten bağımsız, kendi Pressable'ı ile ana sayacın "her yere
// dokun" davranışıyla çakışmaz). Kullanıcının ilk aktif halkasını gösterir;
// yoksa (misafir dahil) boş durum kartı.
export function CircleCard() {
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const { t, i18n } = useTranslation("circle");
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";

  const circles = useCircleStore((state) => state.circles);
  const activeCircle = useMemo(() => circles.find((circle) => circle.status === "active") ?? null, [circles]);

  if (!activeCircle) {
    return (
      <View className="mb-5 px-5">
        <Pressable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push("/circle" as any)}
          className="rounded-2xl px-4 py-4"
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textPrimary, 0.12),
            backgroundColor: withAlpha(tokens.card, 0.92)
          }}
        >
          <Text className="mb-1 text-sm font-semibold" style={{ color: tokens.textPrimary }}>
            {t("circle:home.title")}
          </Text>
          <Text className="text-xs leading-4" style={{ color: tokens.textMuted }}>
            {t("circle:home.emptySubtitle")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const percent = activeCircle.goalCount > 0 ? Math.min(100, Math.round((activeCircle.totalCount / activeCircle.goalCount) * 100)) : 0;
  const title = activeCircle.name || resolveLocalizedText(activeCircle.dhikr.name, locale);

  return (
    <View className="mb-5 px-5">
      <Pressable
        onPress={() => router.push({ pathname: "/circle/session", params: { id: activeCircle.id } } as unknown as Href)}
        className="rounded-2xl px-4 py-4"
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: withAlpha(tokens.card, 0.92)
        }}
      >
        <Text className="mb-1 text-xs font-semibold" style={{ color: tokens.textMuted }}>
          {t("circle:home.title")}
        </Text>
        <Text className="mb-2 text-sm font-semibold" style={{ color: tokens.textPrimary }}>
          {title}
        </Text>
        <View className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <View className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: tokens.accent }} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs" style={{ color: tokens.textMuted }}>
            {t("circle:home.progress", { total: activeCircle.totalCount, goal: activeCircle.goalCount })}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
            {t("circle:home.continueCta")}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
