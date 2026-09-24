import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { toDateKey } from "@zikirmatik/shared";
import { PageHeader } from "../../../components/ui/page-header";
import { PageLayout, PageScrollView } from "../../../components/ui/page-layout";
import { PrimaryCtaButton } from "../../../components/ui/primary-cta-button";
import { ThemedInput } from "../../../components/ui/themed-input";
import { usePremiumSheet } from "../../../hooks/use-premium-sheet";
import { useAuthStore } from "../../../store/auth-store";
import { useCircleStore } from "../../../store/circle-store";
import { resolveLocalizedText } from "../../../store/dhikr-store";
import { ProfilePremiumSheet } from "../../profile/components/profile-premium-sheet";
import { VirdDhikrPickerModal, type VirdDhikrPickerSelection } from "../../vird/components/vird-dhikr-picker-modal";
import { trackEvent } from "../../../lib/analytics";
import { CIRCLE_ERROR_CODE, CircleApiError, createCircle, resolveCircleErrorMessage } from "../services/circle-api-client";
import { TEST_IDS } from "../../../test-ids";

type DurationOption = "7" | "30" | "40" | "unlimited";

/** Salt takvim-günü kayması (saat bileşeni yok) — vird-store.ts'teki
 * shiftDateKey ile aynı yaklaşım (her istemci kendi küçük kopyasını taşır). */
function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function CircleCreateScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("circle");
  const { tokens } = useThemeTokens();
  const premiumSheet = usePremiumSheet();
  const locale = (i18n.language === "en" ? "en" : "tr") as "tr" | "en";

  const sessionUserId = useAuthStore((state) => state.session?.userId);
  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken);
  const upsertCircle = useCircleStore((state) => state.upsertCircle);

  const [name, setName] = useState("");
  const [goalCount, setGoalCount] = useState("1000");
  const [duration, setDuration] = useState<DurationOption>("30");
  const [selected, setSelected] = useState<VirdDhikrPickerSelection | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationOptions: { key: DurationOption; label: string }[] = [
    { key: "7", label: t("circle:create.duration7") },
    { key: "30", label: t("circle:create.duration30") },
    { key: "40", label: t("circle:create.duration40") },
    { key: "unlimited", label: t("circle:create.durationUnlimited") }
  ];

  const handleSubmit = async () => {
    if (!selected) {
      setError(t("circle:create.dhikrRequired"));
      return;
    }
    // Hedef yalnız rakam ve 1..10.000.000 aralığında olmalı (sunucu DTO ile aynı);
    // "1abc" gibi girdi sessizce 1'e düşmesin (emülatör turunda görüldü).
    const goal = /^\d+$/.test(goalCount.trim()) ? Number.parseInt(goalCount, 10) : Number.NaN;
    if (!Number.isFinite(goal) || goal < 1 || goal > 10_000_000) {
      setError(t("circle:create.goalInvalid"));
      return;
    }
    if (!sessionAccessToken || !sessionUserId) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const endDate = duration === "unlimited" ? undefined : shiftDateKey(toDateKey(new Date()), Number.parseInt(duration, 10));

      const circle = await createCircle({
        name: name.trim() || undefined,
        dhikrId: selected.ref,
        goalCount: goal,
        endDate
      });

      upsertCircle(circle);
      void trackEvent("circle_created", { goalCount: goal });
      router.replace(`/circle/${circle.id}` as Href);
    } catch (err) {
      if (err instanceof CircleApiError && err.code === CIRCLE_ERROR_CODE.PREMIUM_REQUIRED) {
        premiumSheet.open();
      } else {
        const message = err instanceof CircleApiError ? err.message : undefined;
        setError(resolveCircleErrorMessage(err instanceof CircleApiError ? err.code : undefined, message ?? t("circle:errors.serviceUnavailable")));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader title={t("circle:create.title")} leftIconName="arrow-left" onPressLeft={() => router.back()} />

      <PageScrollView contentInnerClassName="w-full px-5" bottomPadding={40}>
        <Text className="mb-1.5 text-xs font-semibold text-[--text-muted]">{t("circle:create.nameLabel")}</Text>
        <ThemedInput value={name} onChangeText={setName} placeholder={t("circle:create.namePlaceholder")} className="mb-4" />

        <Text className="mb-1.5 text-xs font-semibold text-[--text-muted]">{t("circle:create.dhikrLabel")}</Text>
        <Pressable
          onPress={() => setPickerVisible(true)}
          testID={TEST_IDS.circle.pickDhikr}
          className="mb-4 flex-row items-center justify-between rounded-xl border border-white/10 bg-[--card] px-4 py-3.5"
        >
          <Text className="text-sm font-medium text-[--text-primary]">
            {selected
              ? resolveLocalizedText(selected.snapshot.transliteration ?? selected.snapshot.name, locale)
              : t("circle:create.pickDhikr")}
          </Text>
        </Pressable>

        <Text className="mb-1.5 text-xs font-semibold text-[--text-muted]">{t("circle:create.goalLabel")}</Text>
        <ThemedInput
          value={goalCount}
          onChangeText={setGoalCount}
          testID={TEST_IDS.circle.goalInput}
          keyboardType="number-pad"
          className="mb-4"
        />

        <Text className="mb-1.5 text-xs font-semibold text-[--text-muted]">{t("circle:create.durationLabel")}</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {durationOptions.map((option) => {
            const isActive = duration === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setDuration(option.key)}
                className="rounded-full border px-3.5 py-2"
                style={{
                  borderColor: isActive ? tokens.accent : "rgba(255,255,255,0.12)",
                  backgroundColor: isActive ? `${tokens.accent}22` : "transparent"
                }}
              >
                <Text className="text-xs font-semibold" style={{ color: isActive ? tokens.accent : tokens.textMuted }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text className="mb-3 text-xs" style={{ color: "#ef4444" }}>{error}</Text> : null}

        <PrimaryCtaButton
          label={t("circle:create.submit")}
          onPress={() => void handleSubmit()}
          testID={TEST_IDS.circle.submit}
          disabled={isSubmitting}
          className="w-full"
        />
      </PageScrollView>

      <VirdDhikrPickerModal
        visible={pickerVisible}
        onRequestClose={() => setPickerVisible(false)}
        existingRefs={[]}
        slotRefs={selected ? [selected.ref] : []}
        isPremium
        onRequirePremium={() => {}}
        catalogOnly
        onAdd={(selection) => {
          setSelected(selection);
          setError(null);
          setPickerVisible(false);
        }}
        onRemove={() => setSelected(null)}
      />

      <ProfilePremiumSheet
        visible={premiumSheet.isOpen}
        selectedPlan={premiumSheet.plan}
        isActivating={premiumSheet.isActivating}
        error={premiumSheet.error}
        onSelectPlan={premiumSheet.setPlan}
        onStartPremium={premiumSheet.activate}
        onClose={premiumSheet.close}
        subscriptionPrices={premiumSheet.subscriptionPrices}
        source="circle_create"
      />
    </PageLayout>
  );
}
