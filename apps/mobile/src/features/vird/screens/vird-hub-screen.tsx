import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { toDateKey, type VirdSlotKey } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { ErrorBox } from "../../../components/ui/error-box";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { ToastBanner } from "../../../components/ui/toast-banner";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { useRequireAuth } from "../../auth/hooks/use-require-auth";
import { useAuthStore } from "../../../store/auth-store";
import { useVirdStore } from "../../../store/vird-store";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import { TodaysVirdCard } from "../components/todays-vird-card";
import { VirdProgramListItem } from "../components/vird-program-list-item";
import { VirdProgramSummaryCard } from "../components/vird-program-summary-card";
import { VirdReminderSettings } from "../components/vird-reminder-settings";
import { isJourneyFinished } from "../services/vird-day";
import { TEST_IDS } from "../../../test-ids";

// Vird hub'ı (`/vird`): Zikirlerim'deki "Vird programım" satırı ve ana
// ekrandaki Bugünkü Vird kartından buraya gelinir. Eski vird-setup-panel.tsx
// (bkz. FAZ B) burada tohum — aktif program özeti/boş durum + "diğer
// programlar" + "Yeni vird" 3 seçenek + hatırlatma ayarları TEK sayfada.
export function VirdHubScreen() {
  const router = useRouter();
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();
  const premiumSheet = usePremiumSheet();
  const { requireAuth } = useRequireAuth();
  const params = useLocalSearchParams<{ slot?: string; prayerIndex?: string }>();

  const authStatus = useAuthStore((state) => state.status);
  const syncError = useVirdStore((state) => state.syncError);
  const notice = useVirdStore((state) => state.notice);
  const setNotice = useVirdStore((state) => state.setNotice);
  const programs = useVirdStore((state) => state.programs);
  const activeProgramId = useVirdStore((state) => state.activeProgramId);

  const activeProgram = useMemo(
    () => programs.find((program) => program.id === activeProgramId) ?? null,
    [programs, activeProgramId]
  );
  const otherPrograms = useMemo(
    () => programs.filter((program) => program.id !== activeProgramId),
    [programs, activeProgramId]
  );

  const todayKey = toDateKey(new Date());
  const activeIsFinished = Boolean(
    activeProgram && (activeProgram.status === "completed" || isJourneyFinished(activeProgram, todayKey))
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) {
      return;
    }
    setToastMessage(
      notice === "started" ? t("vird:hub.toastStarted") : notice === "saved" ? t("vird:hub.toastSaved") : t("vird:hub.toastDraft")
    );
    const timer = setTimeout(() => {
      setToastMessage(null);
      setNotice(null);
    }, 2500);
    return () => clearTimeout(timer);
    // `t` her render'da yeni kimlik alabildiğinden bağımlılığa alınmaz; aksi
    // hâlde zamanlayıcı sürekli sıfırlanıp toast hiç kapanmaz. setNotice
    // zustand store action'ı olduğu için sabit referanslıdır, eklemek
    // davranışı değiştirmez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice, setNotice]);

  const highlightSlot = (typeof params.slot === "string" ? params.slot : null) as VirdSlotKey | null;

  return (
    <PageLayout>
      <PageHeader title={t("vird:hub.title")} leftIconName="arrow-left" onPressLeft={() => router.back()} />

      <PageScrollView testID={TEST_IDS.vird.hub} contentInnerClassName="w-full px-5" bottomPadding={40}>
        {authStatus === "authenticated" ? (
          syncError ? (
            <ErrorBox
              message={t("vird:hub.syncError")}
              className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2.5"
              textClassName="text-xs text-[#fecaca]"
            />
          ) : null
        ) : (
          <View className="mb-4 rounded-xl border border-white/10 bg-card px-3 py-2.5">
            <Text className="text-xs text-text-muted">{t("vird:hub.guestHint")}</Text>
          </View>
        )}

        {activeProgram ? <TodaysVirdCard highlightSlot={highlightSlot} /> : null}

        {activeProgram ? (
          activeIsFinished ? (
            <View className="mb-4 items-center rounded-2xl border border-white/10 bg-card px-4 py-6">
              <Text className="mb-1 text-base font-semibold text-text-primary">{t("vird:hub.completedTitle")} 🎉</Text>
              <Text className="text-xs text-text-muted">{t("vird:hub.completedHint")}</Text>
            </View>
          ) : (
            <VirdProgramSummaryCard program={activeProgram} />
          )
        ) : null}

        {otherPrograms.length > 0 ? (
          <View className="mb-1">
            <Text className="mb-2 text-xs font-semibold text-text-muted">{t("vird:setup.otherProgramsHeading")}</Text>
            {otherPrograms.map((program) => (
              <VirdProgramListItem key={program.id} program={program} onRequirePremium={premiumSheet.open} />
            ))}
          </View>
        ) : null}

        <Text className="mb-2 mt-2 text-xs font-semibold text-text-muted">{t("vird:hub.newVirdHeading")}</Text>
        <View className="mb-4 gap-2.5">
          <Pressable
            onPress={() => router.push("/vird/editor")}
            testID={TEST_IDS.vird.newManual}
            className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3.5"
          >
            <View className="flex-row items-center gap-2.5">
              <FontAwesome6 name="pen" iconStyle="solid" size={14} color={tokens.accent} />
              <Text className="text-sm font-semibold text-text-primary">{t("vird:hub.newManual")}</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={12} color={tokens.textMuted} />
          </Pressable>
          <Pressable
            // TODO(B1): typed routes yenilenince (.expo/types/router.d.ts) cast'i kaldır.
            onPress={() => router.push("/vird/templates")}
            className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3.5"
          >
            <View className="flex-row items-center gap-2.5">
              <FontAwesome6 name="list" iconStyle="solid" size={14} color={tokens.accent} />
              <Text className="text-sm font-semibold text-text-primary">{t("vird:hub.newTemplate")}</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={12} color={tokens.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => requireAuth(() => router.push("/vird/ai-create"))}
            className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3.5"
          >
            <View className="flex-row items-center gap-2.5">
              <FontAwesome6 name="wand-magic-sparkles" iconStyle="solid" size={14} color={tokens.accent} />
              <Text className="text-sm font-semibold text-text-primary">{t("vird:hub.newAi")}</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={12} color={tokens.textMuted} />
          </Pressable>
        </View>

        <VirdReminderSettings onRequirePremium={premiumSheet.open} />
      </PageScrollView>

      <ToastBanner message={toastMessage} iconName="circle-check" position="bottom" />

      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        subscriptionPrices={premiumSheet.subscriptionPrices}
        source="vird_hub"
      />
    </PageLayout>
  );
}
