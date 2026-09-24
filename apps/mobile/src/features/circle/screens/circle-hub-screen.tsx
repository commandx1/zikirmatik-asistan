import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import type { CircleSummary } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedInput } from "../../../components/ui/themed-input";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { useAuthStore } from "../../../store/auth-store";
import { useCircleStore } from "../../../store/circle-store";
import { fetchCircles } from "../services/circle-api-client";
import { useProfileStore } from "../../../store/profile-store";
import { useRequireAuth } from "../../auth/hooks/use-require-auth";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import { parseCircleCode } from "../services/circle-share";
import { TEST_IDS } from "../../../test-ids";

// Zikir Halkası hub'ı (`/circle`): mevcut halkaları listeler, yeni halka
// kurma / kodla katılma seçeneklerini sunar. Desen vird-hub-screen.tsx ile
// aynı (PageLayout/PageHeader + premium sheet wiring).
export function CircleHubScreen() {
  const router = useRouter();
  const { t } = useTranslation("circle");
  const premiumSheet = usePremiumSheet();
  const { requireAuth } = useRequireAuth();

  const authStatus = useAuthStore((state) => state.status);
  const isPremium = useProfileStore((state) => state.isPremium);
  const circles = useCircleStore((state) => state.circles);
  const replaceFromServer = useCircleStore((state) => state.replaceFromServer);
  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken);

  // Odaklanınca listeyi tazele: başka üyelerin katkısı/katılımı hub'a
  // yalnız ön plan senkronuyla değil, ekrana her dönüşte yansısın.
  useFocusEffect(
    useCallback(() => {
      if (!sessionAccessToken) return;
      let cancelled = false;
      fetchCircles()
        .then((list) => {
          if (!cancelled) replaceFromServer(list);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [sessionAccessToken, replaceFromServer])
  );

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const sortedCircles = [...circles].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "active" ? -1 : 1;
  });

  const handleCreate = () => {
    requireAuth(() => {
      if (isPremium) {
        router.push("/circle/new" as Href);
      } else {
        premiumSheet.open();
      }
    });
  };

  const handleJoinWithCode = () => {
    const parsed = parseCircleCode(code);
    if (!parsed) {
      setCodeError(t("circle:hub.invalidCode"));
      return;
    }
    setCodeError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: "/circle/join", params: { code: parsed } } as any);
  };

  return (
    <PageLayout>
      <PageHeader title={t("circle:hub.title")} leftIconName="arrow-left" onPressLeft={() => router.back()} />

      <PageScrollView testID={TEST_IDS.circle.hub} contentInnerClassName="w-full px-5" bottomPadding={40}>
        {authStatus !== "authenticated" ? (
          <View className="mb-4 rounded-xl border border-white/10 bg-[--card] px-3 py-2.5">
            <Text className="text-xs text-[--text-muted]">{t("circle:hub.guestHint")}</Text>
          </View>
        ) : null}

        {authStatus === "authenticated" && sortedCircles.length === 0 ? (
          <Text className="mb-4 text-xs text-[--text-muted]">{t("circle:hub.empty")}</Text>
        ) : null}

        {authStatus === "authenticated"
          ? sortedCircles.map((circle) => <CircleRow key={circle.id} circle={circle} />)
          : null}

        <PrimaryCtaButton label={t("circle:hub.newCircle")} onPress={handleCreate} testID={TEST_IDS.circle.newCircle} className="mb-4 mt-2 w-full" />

        <Text className="mb-2 text-xs font-semibold text-[--text-muted]">{t("circle:hub.joinWithCode")}</Text>
        <View className="mb-1 flex-row items-center gap-2">
          <View className="flex-1">
            <ThemedInput
              value={code}
              onChangeText={(value) => {
                setCode(value);
                setCodeError(null);
              }}
              placeholder={t("circle:hub.codePlaceholder")}
              testID={TEST_IDS.circle.codeInput}
              autoCapitalize="characters"
            />
          </View>
        </View>
        <PrimaryCtaButton label={t("circle:hub.join")} onPress={handleJoinWithCode} testID={TEST_IDS.circle.joinButton} className="mt-2 w-full" style={{ paddingVertical: 11 }} textClassName="text-base" />
        {codeError ? <Text className="mt-2 text-xs" style={{ color: "#ef4444" }}>{codeError}</Text> : null}
      </PageScrollView>

      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        subscriptionPrices={premiumSheet.subscriptionPrices}
        source="circle_hub"
      />
    </PageLayout>
  );
}

function CircleRow({ circle }: { circle: CircleSummary }) {
  const router = useRouter();
  const { t, i18n } = useTranslation("circle");
  const { tokens } = useThemeTokens();
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";
  const percent = circle.goalCount > 0 ? Math.min(100, Math.round((circle.totalCount / circle.goalCount) * 100)) : 0;

  return (
    <Pressable onPress={() => router.push(`/circle/${circle.id}` as Href)}>
      <ThemedCard className="mb-3 rounded-2xl p-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="flex-1 pr-2 text-sm font-semibold text-[--text-primary]" numberOfLines={1}>
            {circle.name || resolveLocalizedText(circle.dhikr.name, locale)}
          </Text>
          <Text className="text-xs font-semibold" style={{ color: circle.status === "active" ? tokens.success : tokens.textMuted }}>
            {t(`circle:status.${circle.status}`)}
          </Text>
        </View>
        <View className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <View className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: tokens.accent }} />
        </View>
        <Text className="text-xs text-[--text-muted]">
          {t("circle:home.progress", { total: circle.totalCount, goal: circle.goalCount })}
        </Text>
      </ThemedCard>
    </Pressable>
  );
}
