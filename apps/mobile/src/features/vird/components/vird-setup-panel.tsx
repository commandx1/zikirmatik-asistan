import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import { useVirdStore } from "../../../store/vird-store";
import { VirdProgramListItem } from "./vird-program-list-item";
import { VirdProgramSummaryCard } from "./vird-program-summary-card";
import { VirdReminderSettings } from "./vird-reminder-settings";

// focus/screen.tsx'te (Zikirlerim sekmesi) segment 'vird' seçiliyken
// gösterilen içerik: aktif program özeti (ya da boş durum), "Yeni program"
// CTA'sı, diğer programlar listesi ve global hatırlatma ayarları. Tek bir
// paywall (ProfilePremiumSheet) örneği burada tutulur — "diğer programlar"
// listesindeki aktif-sınırı hatası ve hatırlatma bölümünün premium kilidi
// AYNI sheet'i açar (source="vird_setup").
export function VirdSetupPanel() {
  const router = useRouter();
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();
  const premiumSheet = usePremiumSheet();

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

  return (
    <View className="px-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-[--text-primary]">{t("vird:setup.title")}</Text>
        <Pressable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push("/vird/editor" as any)}
          className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
          style={{ backgroundColor: tokens.accent }}
        >
          <FontAwesome6 name="plus" iconStyle="solid" size={11} color={tokens.bg} />
          <Text className="text-xs font-semibold" style={{ color: tokens.bg }}>
            {t("vird:setup.newProgramButton")}
          </Text>
        </Pressable>
      </View>

      {activeProgram ? (
        <VirdProgramSummaryCard program={activeProgram} />
      ) : (
        <View
          className="mb-4 rounded-2xl px-4 py-5"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: tokens.card }}
        >
          <Text className="mb-1 text-sm font-semibold text-[--text-primary]">{t("vird:setup.noActiveProgram")}</Text>
          <Text className="text-xs leading-4 text-[--text-muted]">
            {otherPrograms.length > 0 ? t("vird:setup.activateHint") : t("vird:home.emptySubtitle")}
          </Text>
        </View>
      )}

      {otherPrograms.length > 0 ? (
        <View className="mb-1">
          <Text className="mb-2 text-xs font-semibold text-[--text-muted]">{t("vird:setup.otherProgramsHeading")}</Text>
          {otherPrograms.map((program) => (
            <VirdProgramListItem key={program.id} program={program} onFreeLimitActive={premiumSheet.open} />
          ))}
        </View>
      ) : null}

      <VirdReminderSettings onRequirePremium={premiumSheet.open} />

      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        subscriptionPrices={premiumSheet.subscriptionPrices}
        source="vird_setup"
      />
    </View>
  );
}
