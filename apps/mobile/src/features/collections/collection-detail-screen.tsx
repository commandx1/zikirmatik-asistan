import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useState } from "react";
import { useThemeTokens } from "@zikirmatik/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DhikrContentStack } from "../../components/ui/dhikr-content-stack";
import { DhikrResumeModal } from "../../components/ui/dhikr-resume-modal";
import { PageHeader } from "../../components/ui/page-header";
import { PageLayout } from "../../components/ui/page-layout";
import { ThemedCard } from "../../components/ui/themed-card";
import { UnsavedDhikrTransitionModal } from "../../components/ui/unsaved-dhikr-transition-modal";
import { useDhikrStartGuard } from "../../hooks/use-dhikr-start-guard";
import { useAuthStore } from "../../store/auth-store";
import { useDhikrStore } from "../../store/dhikr-store";
import { resolveLocalizedText, toDateKey } from "@zikirmatik/shared";
import { isObjectId } from "../dhikrs/services/dhikr-ids";
import { createDhikrLog } from "../dhikrs/services/dhikr-logs-api-client";
import { useCollectionDetail } from "./hooks/use-collection-detail";
import type { BackendCollectionDhikr } from "./services/collections-api-client";
import { useAppLocale } from "../../i18n";

type Props = {
  collectionKey: string;
};


export function CollectionDetailScreen({ collectionKey }: Props) {
  const router = useRouter();
  const { t } = useTranslation("collections");
  const locale = useAppLocale();
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const bottomPadding = 40 + (Platform.OS === "android" ? Math.max(insets.bottom, 0) : insets.bottom);
  const { detail, isLoading, error } = useCollectionDetail(collectionKey);

  const storeItems = useDhikrStore((s) => s.items);
  const selectedDhikrId = useDhikrStore((s) => s.selectedDhikrId);
  const upsertDhikrSnapshot = useDhikrStore((s) => s.upsertDhikrSnapshot);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);
  const setSelectedTarget = useDhikrStore((s) => s.setSelectedTarget);
  const setSelectedCount = useDhikrStore((s) => s.setSelectedCount);
  const unsavedProgressDhikrIds = useDhikrStore((s) => s.unsavedProgressDhikrIds);
  const freeModeCount = useDhikrStore((s) => s.freeModeCount);
  const discardUnsavedProgress = useDhikrStore((s) => s.discardUnsavedProgress);
  const clearFreeModeSession = useDhikrStore((s) => s.clearFreeModeSession);
  const applySavedBackendLog = useDhikrStore((s) => s.applySavedBackendLog);
  const activeAiContext = useDhikrStore((s) => s.activeAiContext);

  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);

  const guard = useDhikrStartGuard();

  const [pendingDhikr, setPendingDhikr] = useState<BackendCollectionDhikr | null>(null);
  const [isSavingUnsaved, setIsSavingUnsaved] = useState(false);
  const [unsavedSaveError, setUnsavedSaveError] = useState<string | null>(null);

  const startDhikr = (dhikr: BackendCollectionDhikr) => {
    guard.guardedStart({
      id: dhikr._id,
      dhikrName: resolveLocalizedText(dhikr.name, locale),
      onFresh: () => {
        upsertDhikrSnapshot({
          id: dhikr._id,
          source: "ready",
          name: dhikr.name,
          arabic: dhikr.nameArabic,
          transliteration: dhikr.transliteration,
          meaning: dhikr.meaning,
          virtue: dhikr.virtue,
          contentSource: dhikr.source,
          current: 0,
          target: dhikr.recommendedCount,
          lastActivityLabel: t("collections:detail.notStarted"),
          streakDays: 0,
          isFavorite: false,
        });
        selectDhikr(dhikr._id);
        setSelectedTarget(dhikr.recommendedCount);
        setSelectedCount(0);
        router.push("/(tabs)/home");
      },
      onContinue: () => {
        selectDhikr(dhikr._id);
        router.push("/(tabs)/home");
      }
    });
  };

  const handleStartDhikr = (dhikr: BackendCollectionDhikr) => {
    const isSameTarget = dhikr._id === selectedDhikrId;
    const hasUnsaved = !isSameTarget && (
      selectedDhikrId
        ? unsavedProgressDhikrIds.includes(selectedDhikrId)
        : freeModeCount > 0
    );
    if (hasUnsaved) {
      setPendingDhikr(dhikr);
      setUnsavedSaveError(null);
      return;
    }
    startDhikr(dhikr);
  };

  const handleUnsavedSaveAndContinue = async () => {
    if (!pendingDhikr || isSavingUnsaved) return;
    const selectedDhikr = storeItems.find((d) => d.id === selectedDhikrId);
    if (!selectedDhikr || authStatus !== "authenticated" || !sessionUserId) {
      setUnsavedSaveError(t("collections:detail.loginRequired"));
      return;
    }
    setIsSavingUnsaved(true);
    setUnsavedSaveError(null);
    const count = Math.max(0, Math.floor(selectedDhikr.current));
    const safeCount = selectedDhikr.target > 0 ? Math.min(selectedDhikr.target, count) : count;
    const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target;
    const aiCtx = activeAiContext?.dhikrId === selectedDhikr.id
      ? { source: "ai" as const, aiRecommendationId: activeAiContext.recommendationId, aiPrompt: activeAiContext.prompt, aiAssistantNote: activeAiContext.assistantNote }
      : { source: "manual" as const };
    const isVerifiedId = isObjectId(selectedDhikr.id);
    const dateKey = toDateKey(new Date());
    try {
      const savedLog = await createDhikrLog(
        isVerifiedId
          ? { userId: sessionUserId, dhikrId: selectedDhikr.id, count: safeCount, targetCount: selectedDhikr.target, date: dateKey, ...aiCtx, isCompleted, isFavorite: selectedDhikr.isFavorite }
          : { userId: sessionUserId, customDhikrId: selectedDhikr.id, customDhikrName: resolveLocalizedText(selectedDhikr.name, locale) || resolveLocalizedText(selectedDhikr.transliteration, locale), count: safeCount, targetCount: selectedDhikr.target, date: dateKey, ...aiCtx, isCompleted: false, isFavorite: selectedDhikr.isFavorite }
      );
      applySavedBackendLog(savedLog);
      const dhikr = pendingDhikr;
      setPendingDhikr(null);
      startDhikr(dhikr);
    } catch (e) {
      setUnsavedSaveError(e instanceof Error ? e.message : t("collections:detail.saveFailed"));
    } finally {
      setIsSavingUnsaved(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={detail ? resolveLocalizedText(detail.label, locale) : t("collections:detail.defaultTitle")}
        leftIconName="arrow-left"
        onPressLeft={() => router.back()}
      />

      {isLoading && !detail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-text-muted">{error}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}
        >
          {detail?.description ? (
            <ThemedCard className="mb-5 rounded-2xl px-4 py-3" accent="accentSoft">
              <Text className="text-sm leading-5 text-text-muted">
                {resolveLocalizedText(detail.description, locale)}
              </Text>
            </ThemedCard>
          ) : null}

          <View className="gap-4">
            {detail?.dhikrs.map((dhikr, index) => (
              <ThemedCard
                key={dhikr._id}
                className="rounded-2xl p-4"
                elevated
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold tracking-[0.8px] text-text-muted">
                    {`${index + 1}/${detail.dhikrs.length}`}
                  </Text>
                  <View className="rounded-full px-2.5 py-0.5">
                    <Text className="text-xs font-medium text-accent">
                      {dhikr.recommendedCount}×
                    </Text>
                  </View>
                </View>

                <Text className="text-base font-semibold text-text-primary">
                  {resolveLocalizedText(dhikr.name, locale)}
                </Text>

                <DhikrContentStack
                  arabic={dhikr.nameArabic}
                  transliteration={resolveLocalizedText(dhikr.transliteration, locale)}
                  meaning={resolveLocalizedText(dhikr.meaning, locale)}
                />

                {dhikr.source ? (
                  <Text className="mt-3 text-xs leading-4 text-text-muted">
                    {resolveLocalizedText(dhikr.source, locale)}
                  </Text>
                ) : null}

                <View className="mt-4 flex-row items-center justify-end">
                  <Pressable
                    onPress={() => handleStartDhikr(dhikr)}
                    className="flex-row items-center gap-1.5 rounded-full bg-accent px-4 py-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <FontAwesome6
                      name="play"
                      iconStyle="solid"
                      size={10}
                      color={tokens.bg}
                    />
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: tokens.bg }}
                    >
                      {t("collections:detail.addToCounter")}
                    </Text>
                  </Pressable>
                </View>
              </ThemedCard>
            ))}
          </View>
        </ScrollView>
      )}

      <UnsavedDhikrTransitionModal
        visible={Boolean(pendingDhikr)}
        dhikrName={(() => {
          const found = storeItems.find((d) => d.id === selectedDhikrId);
          return found ? resolveLocalizedText(found.name, locale) : "";
        })()}
        count={storeItems.find((d) => d.id === selectedDhikrId)?.current ?? freeModeCount}
        isSaving={isSavingUnsaved}
        error={unsavedSaveError}
        onSaveAndContinue={handleUnsavedSaveAndContinue}
        onContinueWithoutSaving={() => {
          const dhikr = pendingDhikr!;
          setPendingDhikr(null);
          setUnsavedSaveError(null);
          if (selectedDhikrId) {
            discardUnsavedProgress(selectedDhikrId);
          } else {
            clearFreeModeSession();
          }
          startDhikr(dhikr);
        }}
        onCancel={() => {
          setPendingDhikr(null);
          setUnsavedSaveError(null);
        }}
      />
      <DhikrResumeModal
        visible={guard.isGuardOpen}
        dhikrName={guard.guardDhikrName}
        currentCount={guard.guardCurrentCount}
        onContinue={guard.onGuardContinue}
        onFresh={guard.onGuardFresh}
        onCancel={guard.onGuardCancel}
      />
    </PageLayout>
  );
}
