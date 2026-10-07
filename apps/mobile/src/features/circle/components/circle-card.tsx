import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { useCircleStore } from "../../../store/circle-store";
import { withAlpha } from "@zikirmatik/shared";
import { circleProgressPercent, resolveCircleTitle } from "../services/circle-share";
import { TEST_IDS } from "../../../test-ids";
import { useAppLocale } from "../../../i18n";


// Ana ekrandaki Zikir Halkası kartı — todays-vird-card.tsx ile aynı desen
// (home-context'ten bağımsız, kendi Pressable'ı ile ana sayacın "her yere
// dokun" davranışıyla çakışmaz). Kullanıcının ilk aktif halkasını gösterir;
// yoksa (misafir dahil) boş durum kartı.
export function CircleCard() {
  const router = useRouter();
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("circle");
  const locale = useAppLocale();

  const circles = useCircleStore((state) => state.circles);
  const activeCircle = useMemo(() => circles.find((circle) => circle.status === "active") ?? null, [circles]);

  if (!activeCircle) {
    return (
      <View className="mb-5 px-5">
        <Pressable
          onPress={() => router.push("/circle")}
          testID={TEST_IDS.circle.homeCard}
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

  const percent = circleProgressPercent(activeCircle.totalCount, activeCircle.goalCount);
  const title = resolveCircleTitle(activeCircle, locale);

  return (
    <View className="mb-5 px-5">
      <Pressable
        onPress={() => router.push({ pathname: "/circle/session", params: { id: activeCircle.id } })}
        testID={TEST_IDS.circle.homeCardActive}
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
      <Pressable
        onPress={() => router.push("/circle")}
        testID={TEST_IDS.circle.homeCardHub}
        className="mt-1.5 self-start px-1 py-1"
      >
        <Text className="text-xs font-semibold" style={{ color: tokens.textMuted }}>
          {t("circle:home.openHub")}
        </Text>
      </Pressable>
    </View>
  );
}
